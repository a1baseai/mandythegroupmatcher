/**
 * Group Profile Storage Service
 * 
 * Manages group profiles and interview state for Mandy the Group Matchmaker.
 * Stores:
 * - Interview state per chat (which question, answers collected)
 * - Completed group profiles (for matching)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const PROFILES_FILE = path.join(DATA_DIR, 'group-profiles.json');
const STATE_FILE = path.join(DATA_DIR, 'interview-state.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Initialize data files if they don't exist
 */
function initializeFiles() {
  if (!fs.existsSync(PROFILES_FILE)) {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify({ groups: [] }, null, 2));
  }
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2));
  }
  if (!fs.existsSync(MATCHES_FILE)) {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify({ matches: [] }, null, 2));
  }
}

// Initialize on load
initializeFiles();

/**
 * Load group profiles from file
 * @returns {Object} { groups: Array }
 */
function loadProfiles() {
  try {
    const data = fs.readFileSync(PROFILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading profiles:', error);
    return { groups: [] };
  }
}

/**
 * Save group profiles to file
 * @param {Object} data - { groups: Array }
 */
function saveProfiles(data) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving profiles:', error);
    throw error;
  }
}

/**
 * Load interview state from file
 * @returns {Object} { chatId: { questionNumber, answers, groupName, ... } }
 */
function loadState() {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading state:', error);
    return {};
  }
}

/**
 * Save interview state to file
 * @param {Object} state - { chatId: { ... } }
 */
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
}

/**
 * Get interview state for a chat
 * @param {string} chatId - Chat ID
 * @returns {Object|null} Interview state or null
 */
function getInterviewState(chatId) {
  const state = loadState();
  return state[chatId] || null;
}

/**
 * Set interview state for a chat
 * @param {string} chatId - Chat ID
 * @param {Object} interviewState - State object
 */
function setInterviewState(chatId, interviewState) {
  const state = loadState();
  state[chatId] = interviewState;
  saveState(state);
}

/**
 * Clear interview state for a chat (after completion)
 * @param {string} chatId - Chat ID
 */
function clearInterviewState(chatId) {
  const state = loadState();
  delete state[chatId];
  saveState(state);
}

/**
 * Check if a group name already exists
 * @param {string} groupName - Group name to check
 * @returns {boolean} True if exists
 */
function groupNameExists(groupName) {
  const profiles = loadProfiles();
  return profiles.groups.some(g => 
    g.groupName && g.groupName.toLowerCase() === groupName.toLowerCase()
  );
}

/**
 * Save a completed group profile
 * @param {Object} profile - Group profile object
 * @returns {Object} Saved profile with ID
 */
function saveGroupProfile(profile) {
  const profiles = loadProfiles();
  
  // Add metadata
  const fullProfile = {
    ...profile,
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    profileVersion: '1.0'
  };
  
  profiles.groups.push(fullProfile);
  saveProfiles(profiles);
  
  console.log(`✅ Saved group profile: ${fullProfile.groupName} (ID: ${fullProfile.id})`);
  return fullProfile;
}

/**
 * Get all group profiles
 * @returns {Array} Array of group profiles
 */
function getAllProfiles() {
  const profiles = loadProfiles();
  return profiles.groups || [];
}

/**
 * Get a profile by group name
 * @param {string} groupName - Group name
 * @returns {Object|null} Profile or null
 */
function getProfileByGroupName(groupName) {
  const profiles = loadProfiles();
  return profiles.groups.find(g => 
    g.groupName && g.groupName.toLowerCase() === groupName.toLowerCase()
  ) || null;
}

/**
 * Load matches from file
 * @returns {Object} { matches: Array }
 */
function loadMatches() {
  try {
    const data = fs.readFileSync(MATCHES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading matches:', error);
    return { matches: [] };
  }
}

/**
 * Save matches to file
 * @param {Object} data - { matches: Array }
 */
function saveMatches(data) {
  try {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving matches:', error);
    throw error;
  }
}

/**
 * Save a match result
 * @param {Object} match - Match object { group1, group2, compatibility, matchedAt }
 */
function saveMatch(match) {
  const matchesData = loadMatches();
  
  // Check if this match already exists (same pair)
  const existingIndex = matchesData.matches.findIndex(m => 
    (m.group1Name === match.group1Name && m.group2Name === match.group2Name) ||
    (m.group1Name === match.group2Name && m.group2Name === match.group1Name)
  );
  
  const matchToSave = {
    ...match,
    matchedAt: match.matchedAt || new Date().toISOString(),
    id: match.id || `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  if (existingIndex >= 0) {
    // Update existing match
    matchesData.matches[existingIndex] = matchToSave;
  } else {
    // Add new match
    matchesData.matches.push(matchToSave);
  }
  
  saveMatches(matchesData);
  console.log(`✅ Saved match: ${match.group1Name} ↔ ${match.group2Name} (${match.compatibility.percentage}%)`);
  return matchToSave;
}

/**
 * Get all stored matches
 * @returns {Array} Array of matches
 */
function getAllMatches() {
  const matchesData = loadMatches();
  return matchesData.matches || [];
}

/**
 * Get matches for a specific group
 * @param {string} groupName - Group name
 * @returns {Array} Array of matches for this group
 */
function getMatchesForGroup(groupName) {
  const allMatches = getAllMatches();
  return allMatches.filter(m => 
    m.group1Name.toLowerCase() === groupName.toLowerCase() ||
    m.group2Name.toLowerCase() === groupName.toLowerCase()
  );
}

/**
 * Get statistics about stored profiles
 * @returns {Object} Statistics
 */
function getStats() {
  const profiles = loadProfiles();
  const state = loadState();
  const matches = getAllMatches();
  
  return {
    totalProfiles: profiles.groups.length,
    activeInterviews: Object.keys(state).length,
    totalMatches: matches.length,
    groups: profiles.groups.map(g => ({
      name: g.groupName,
      id: g.id,
      createdAt: g.createdAt
    }))
  };
}

module.exports = {
  getInterviewState,
  setInterviewState,
  clearInterviewState,
  groupNameExists,
  saveGroupProfile,
  getAllProfiles,
  getProfileByGroupName,
  saveMatch,
  getAllMatches,
  getMatchesForGroup,
  getStats
};

