#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = fs.realpathSync(process.cwd());
const minAgeDaysRaw = process.env.DEPENDENCY_MIN_AGE_DAYS || '7';
const minAgeDays = Number(minAgeDaysRaw);
if (!Number.isInteger(minAgeDays) || minAgeDays < 0) {
  throw new Error(`DEPENDENCY_MIN_AGE_DAYS must be a non-negative integer, found ${JSON.stringify(minAgeDaysRaw)}`);
}
const skipAgeCheck = process.env.DEPENDENCY_POLICY_SKIP_AGE === '1';
const now = process.env.DEPENDENCY_POLICY_NOW ? new Date(process.env.DEPENDENCY_POLICY_NOW) : new Date();
if (Number.isNaN(now.getTime())) {
  throw new Error(`DEPENDENCY_POLICY_NOW must be a valid date, found ${JSON.stringify(process.env.DEPENDENCY_POLICY_NOW)}`);
}
const cutoffMs = now.getTime() - minAgeDays * 24 * 60 * 60 * 1000;
const skipDirs = new Set(['.git', 'node_modules', '.next', '.venv', 'dist', 'build', 'coverage', '.turbo']);
const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const failures = [];
const packages = [];
const metadataCache = new Map();
const pythonManifestPins = new Map();

function rel(file) {
  return path.relative(root, file) || '.';
}

function assertInsideRoot(file) {
  const resolved = fs.realpathSync(file);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside repository: ${file}`);
  }
  return resolved;
}

function walk(dir, out = []) {
  const safeDir = assertInsideRoot(dir);
  for (const ent of fs.readdirSync(safeDir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (!skipDirs.has(ent.name)) walk(path.join(safeDir, ent.name), out);
    } else {
      out.push(path.join(safeDir, ent.name));
    }
  }
  return out;
}

function read(file) {
  return fs.readFileSync(assertInsideRoot(file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function isPinnedVersion(spec) {
  return typeof spec === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(spec);
}

function isExactNonRangeSpec(spec) {
  return typeof spec === 'string' && spec.length > 0 && !/[<>=~^*]/.test(spec) && !/^(latest|file:|link:|workspace:|git\+|github:|https?:)/.test(spec);
}

function packageNameFromNodeModules(lockKey) {
  const parts = lockKey.split('node_modules/');
  if (parts.length < 2) return null;
  const tail = parts[parts.length - 1].split('/');
  if (tail[0]?.startsWith('@')) return tail.length >= 2 ? `${tail[0]}/${tail[1]}` : null;
  return tail[0] || null;
}

function addPackage(ecosystem, name, version, file, uploadTime = null) {
  if (!name || !version) return;
  packages.push({ ecosystem, name, version, file, uploadTime });
}

function addPythonManifestPin(file, name, version) {
  if (!name || !version) return;
  const dir = path.dirname(file);
  if (!pythonManifestPins.has(dir)) pythonManifestPins.set(dir, new Map());
  pythonManifestPins.get(dir).set(name.toLowerCase(), version);
}

function checkPackageJson(file) {
  const pkg = readJson(file);
  const dir = path.dirname(file);
  const lockPath = path.join(dir, 'package-lock.json');
  const pnpmPath = path.join(dir, 'pnpm-lock.yaml');
  let hasDirectDeps = false;

  for (const field of depFields) {
    for (const [name, spec] of Object.entries(pkg[field] || {})) {
      if (field !== 'peerDependencies') hasDirectDeps = true;
      if (!isPinnedVersion(spec)) {
        failures.push(`${rel(file)} ${field}.${name} must be an exact version, found ${JSON.stringify(spec)}`);
      }
    }
  }
  checkNpmOverrides(pkg.overrides, `${rel(file)} overrides`);
  checkNpmOverrides(pkg.pnpm?.overrides, `${rel(file)} pnpm.overrides`);

  if (hasDirectDeps && !fs.existsSync(lockPath) && !fs.existsSync(pnpmPath)) {
    failures.push(`${rel(file)} has dependencies but no package-lock.json or pnpm-lock.yaml`);
  }
  if (fs.existsSync(lockPath)) checkPackageLock(lockPath, pkg);
  if (fs.existsSync(pnpmPath)) checkPnpmLock(pnpmPath, pkg);
}

function checkNpmOverrides(overrides, label) {
  if (!overrides || typeof overrides !== 'object') return;
  for (const [name, value] of Object.entries(overrides)) {
    if (typeof value === 'string') {
      if (value.startsWith('$')) continue;
      if (!isPinnedVersion(value)) failures.push(`${label}.${name} replacement must be exact, found ${JSON.stringify(value)}`);
    } else if (value && typeof value === 'object') {
      checkNpmOverrides(value, `${label}.${name}`);
    }
  }
}

function checkPackageLock(file, pkg) {
  const lock = readJson(file);
  const rootPkg = lock.packages?.[''];
  if (rootPkg) {
    for (const field of depFields) {
      for (const name of Object.keys(pkg?.[field] || {})) {
        if (!rootPkg[field]?.[name]) {
          failures.push(`${rel(file)} root ${field}.${name} is missing from package-lock.json`);
        }
      }
      for (const [name, spec] of Object.entries(rootPkg[field] || {})) {
        if (!isPinnedVersion(spec)) {
          failures.push(`${rel(file)} root ${field}.${name} must be exact, found ${JSON.stringify(spec)}`);
        }
        const manifestSpec = pkg?.[field]?.[name];
        if (manifestSpec && manifestSpec !== spec) {
          failures.push(`${rel(file)} root ${field}.${name} (${spec}) does not match package.json (${manifestSpec})`);
        }
      }
    }
  }

  for (const [key, value] of Object.entries(lock.packages || {})) {
    if (!key || !value?.version) continue;
    addPackage('npm', value.name || packageNameFromNodeModules(key), value.version, file);
  }
}

function checkPnpmLock(file, pkg) {
  const text = read(file);
  const seenDirect = new Map();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const field = lines[i].match(/^(\s*)(dependencies|devDependencies|optionalDependencies):\s*$/);
    if (!field) continue;
    const sectionIndent = field[1].length;
    const sectionField = field[2];
    for (i += 1; i < lines.length; i += 1) {
      if (/^\S/.test(lines[i]) && sectionIndent === 0) {
        i -= 1;
        break;
      }
      const nameMatch = lines[i].match(/^(\s*)(?:'([^']+)'|([^:\n]+)):\s*$/);
      if (nameMatch && nameMatch[1].length <= sectionIndent) {
        i -= 1;
        break;
      }
      if (!nameMatch) continue;
      const nameIndent = nameMatch[1].length;
      const name = nameMatch[2] || nameMatch[3].trim();
      let spec = null;
      let version = null;
      for (let j = i + 1; j < lines.length; j += 1) {
        const detail = lines[j].match(/^(\s*)(specifier|version):\s*(.+)\s*$/);
        if (detail && detail[1].length > nameIndent) {
          if (detail[2] === 'specifier') spec = detail[3].trim();
          if (detail[2] === 'version') version = detail[3].trim().split('(')[0];
          continue;
        }
        if (/^\s*\S/.test(lines[j])) {
          break;
        }
      }
      if (!spec || !version) continue;
      if (!seenDirect.has(sectionField)) seenDirect.set(sectionField, new Set());
      seenDirect.get(sectionField).add(name);
      if (!isPinnedVersion(spec)) failures.push(`${rel(file)} ${sectionField}.${name} specifier must be exact, found ${spec}`);
      const manifestSpec = pkg?.[sectionField]?.[name];
      if (manifestSpec && manifestSpec !== spec) failures.push(`${rel(file)} ${sectionField}.${name} (${spec}) does not match package.json (${manifestSpec})`);
    }
  }
  for (const field of depFields) {
    for (const name of Object.keys(pkg?.[field] || {})) {
      if (!seenDirect.get(field)?.has(name)) failures.push(`${rel(file)} ${field}.${name} is missing from pnpm-lock.yaml`);
    }
  }

  for (const line of text.split('\n')) {
    const m = line.match(/^ {2}(?:['"]?\/?([^'":]+(?:\/[^'":]+)?@[^'":]+)['"]?):\s*$/);
    if (!m) continue;
    const key = m[1].split('(')[0];
    const at = key.lastIndexOf('@');
    if (at <= 0) continue;
    addPackage('npm', key.slice(0, at), key.slice(at + 1), file);
  }
}

function checkPyproject(file) {
  const text = read(file);
  const localSources = new Set();
  let inUvSources = false;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (/^\[.*\]/.test(trimmed)) inUvSources = trimmed === '[tool.uv.sources]';
    if (inUvSources) {
      const source = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{[^}]*\bpath\s*=/);
      if (source) localSources.add(source[1].toLowerCase());
    }
  }
  let inProjectDeps = false;
  let inOptionalDeps = false;
  let inBuildSystem = false;
  let inRelevantArray = false;
  let inPoetryDeps = false;
  for (const [idx, line] of text.split('\n').entries()) {
    const trimmed = line.trim();
    if (/^\[.*\]/.test(trimmed)) {
      inPoetryDeps = trimmed === '[tool.poetry.dependencies]';
      inOptionalDeps = trimmed === '[project.optional-dependencies]';
      inBuildSystem = trimmed === '[build-system]';
      inProjectDeps = false;
      inRelevantArray = false;
    }
    const startsProjectDeps = /^dependencies\s*=\s*\[/.test(trimmed);
    const startsRelevantArray = (inOptionalDeps || inBuildSystem) && /^[A-Za-z0-9_.-]+\s*=\s*\[/.test(trimmed);
    if (startsProjectDeps) inProjectDeps = true;
    if (startsRelevantArray) inRelevantArray = true;
    const endArrayAfterLine = (startsProjectDeps || startsRelevantArray) && trimmed.includes(']');
    if ((inProjectDeps || inRelevantArray) && trimmed === ']') {
      inProjectDeps = false;
      inRelevantArray = false;
    }
    if (inProjectDeps || inRelevantArray || (inBuildSystem && /^requires\s*=/.test(trimmed))) {
      const quoted = [...trimmed.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      for (const dep of quoted) {
        const name = dep?.match(/^([A-Za-z0-9_.-]+)/)?.[1]?.toLowerCase();
        if (!name) continue;
        if (!localSources.has(name) && !/^[A-Za-z0-9_.-]+(?:\[[^\]]+\])?==[^<>=!~^*]+$/.test(dep)) {
          failures.push(`${rel(file)}:${idx + 1} dependency must use == exact pin, found ${dep}`);
        }
        const version = dep.match(/==([^<>=!~^*]+)/)?.[1];
        if (version && !localSources.has(name)) {
          addPackage('pypi', name, version, file);
          if (!inBuildSystem) addPythonManifestPin(file, name, version);
        }
      }
      if (endArrayAfterLine) {
        inProjectDeps = false;
        inRelevantArray = false;
      }
    }
    if (inPoetryDeps) {
      const dep = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*"([^"]+)"$/);
      if (dep && dep[1] !== 'python' && !isExactNonRangeSpec(dep[2])) {
        failures.push(`${rel(file)}:${idx + 1} ${dep[1]} must be exact, found ${dep[2]}`);
      }
      if (dep && dep[1] !== 'python' && isExactNonRangeSpec(dep[2])) {
        addPackage('pypi', dep[1], dep[2], file);
        addPythonManifestPin(file, dep[1], dep[2]);
      }
    }
  }
}

function parseUvLock(file) {
  const text = read(file);
  const locked = new Map();
  for (const block of text.split('\n[[package]]\n')) {
    const name = block.match(/name = "([^"]+)"/)?.[1];
    const version = block.match(/version = "([^"]+)"/)?.[1];
    const source = block.match(/^source = \{([^}]*)\}/m)?.[1] || '';
    if (/\b(path|editable|virtual)\b/.test(source)) continue;
    const times = [...block.matchAll(/upload-time = "([^"]+)"/g)].map((m) => m[1]).sort();
    if (name && version) locked.set(name.toLowerCase(), version);
    addPackage('pypi', name, version, file, times[0] || null);
  }
  comparePythonLock(file, locked);
}

function parsePoetryLock(file) {
  const text = read(file);
  const locked = new Map();
  for (const block of text.split('\n[[package]]\n')) {
    const name = block.match(/name = "([^"]+)"/)?.[1];
    const version = block.match(/version = "([^"]+)"/)?.[1];
    if (name && version) locked.set(name.toLowerCase(), version);
    addPackage('pypi', name, version, file);
  }
  comparePythonLock(file, locked);
}

function comparePythonLock(file, locked) {
  const pins = pythonManifestPins.get(path.dirname(file));
  if (!pins) return;
  for (const [name, version] of pins) {
    const resolved = locked.get(name);
    if (!locked.has(name)) {
      failures.push(`${rel(file)} ${name} is pinned in the manifest but missing from the lockfile`);
    } else if (resolved !== version) {
      failures.push(`${rel(file)} ${name} resolved version (${resolved}) does not match manifest pin (${version})`);
    }
  }
}

function checkRequirements(file) {
  read(file).split('\n').forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const m = trimmed.match(/^([A-Za-z0-9_.-]+)(?:\[[^\]]+\])?==([^<>=!~^*]+)$/);
    if (!m) {
      failures.push(`${rel(file)}:${idx + 1} requirement must use == exact pin, found ${trimmed}`);
      return;
    }
    addPackage('pypi', m[1].toLowerCase(), m[2], file);
  });
}

function parseGemfileLock(file) {
  for (const line of read(file).split('\n')) {
    const m = line.match(/^    ([A-Za-z0-9_.-]+) \(([^)]+)\)/);
    if (m) addPackage('rubygems', m[1], m[2], file);
  }
}

function checkGemfile(file) {
  read(file).split('\n').forEach((line, idx) => {
    const m = line.trim().match(/^gem\s+["']([^"']+)["'](?:,\s*["']([^"']+)["'])?/);
    if (m && !isExactNonRangeSpec(m[2] || '')) {
      failures.push(`${rel(file)}:${idx + 1} gem ${m[1]} must be exact, found ${m[2] || 'unconstrained'}`);
    }
  });
}

async function fetchJson(url) {
  if (metadataCache.has(url)) return metadataCache.get(url);
  const controller = new AbortController();
  const fetchTimeoutRaw = process.env.DEPENDENCY_POLICY_FETCH_TIMEOUT_MS || '15000';
  const fetchTimeoutMs = Number(fetchTimeoutRaw);
  if (!Number.isInteger(fetchTimeoutMs) || fetchTimeoutMs <= 0) {
    throw new Error(`DEPENDENCY_POLICY_FETCH_TIMEOUT_MS must be a positive integer, found ${JSON.stringify(fetchTimeoutRaw)}`);
  }
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'a1base-dependency-policy' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    metadataCache.set(url, json);
    return json;
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error(`timed out fetching ${url}`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function publishedAt(pkg) {
  if (pkg.uploadTime) return new Date(pkg.uploadTime);
  if (pkg.ecosystem === 'npm') {
    const encoded = pkg.name.startsWith('@') ? `@${encodeURIComponent(pkg.name.slice(1))}` : encodeURIComponent(pkg.name);
    const json = await fetchJson(`https://registry.npmjs.org/${encoded}`);
    return json.time?.[pkg.version] ? new Date(json.time[pkg.version]) : null;
  }
  if (pkg.ecosystem === 'pypi') {
    const json = await fetchJson(`https://pypi.org/pypi/${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.version)}/json`);
    const earliest = (json.urls || []).map((u) => u.upload_time_iso_8601 || u.upload_time).filter(Boolean).sort()[0];
    return earliest ? new Date(earliest) : null;
  }
  if (pkg.ecosystem === 'rubygems') {
    const json = await fetchJson(`https://rubygems.org/api/v2/rubygems/${encodeURIComponent(pkg.name)}/versions/${encodeURIComponent(pkg.version)}.json`);
    return json.created_at ? new Date(json.created_at) : null;
  }
  return null;
}

const files = walk(root);
const pythonLockFiles = [];
for (const file of files) {
  const base = path.basename(file);
  if (base === 'package.json') checkPackageJson(file);
  else if (base === 'pyproject.toml') checkPyproject(file);
  else if (base === 'uv.lock' || base === 'poetry.lock') pythonLockFiles.push(file);
  else if (/^requirements.*\.txt$/.test(base)) checkRequirements(file);
  else if (base === 'Gemfile') checkGemfile(file);
  else if (base === 'Gemfile.lock') parseGemfileLock(file);
}
for (const file of pythonLockFiles) {
  const base = path.basename(file);
  if (base === 'uv.lock') parseUvLock(file);
  else if (base === 'poetry.lock') parsePoetryLock(file);
}

const unique = new Map();
for (const pkg of packages) unique.set(`${pkg.ecosystem}:${pkg.name}@${pkg.version}`, pkg);
console.log(`Checking ${unique.size} resolved package versions for a minimum age of ${minAgeDays} days...`);
if (skipAgeCheck) {
  console.log('Skipping registry age checks because DEPENDENCY_POLICY_SKIP_AGE=1.');
} else {
  for (const pkg of unique.values()) {
    try {
      const date = await publishedAt(pkg);
      if (!date || Number.isNaN(date.getTime())) {
        failures.push(`${rel(pkg.file)} ${pkg.ecosystem}:${pkg.name}@${pkg.version} has no verifiable publish timestamp`);
        continue;
      }
      if (date.getTime() > cutoffMs) {
        failures.push(`${rel(pkg.file)} ${pkg.ecosystem}:${pkg.name}@${pkg.version} was published ${date.toISOString()}, less than ${minAgeDays} days before ${now.toISOString()}`);
      }
    } catch (err) {
      failures.push(`${rel(pkg.file)} ${pkg.ecosystem}:${pkg.name}@${pkg.version} could not be verified: ${err.message}`);
    }
  }
}

if (failures.length) {
  console.error('\nDependency policy failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Dependency policy passed.');
