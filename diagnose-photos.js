/**
 * Diagnostic script to check photo data in groups
 * Run: node diagnose-photos.js
 */

const groupProfileStorage = require('./services/group-profile-storage');
const { getBestPhotoUrl } = require('./services/mandy-email-helpers');

console.log('🔍 Diagnosing photo data in groups...\n');

const allGroups = groupProfileStorage.getAllProfiles();
console.log(`Total groups in database: ${allGroups.length}\n`);

if (allGroups.length === 0) {
  console.log('⚠️  No groups found in database');
  process.exit(0);
}

allGroups.forEach((group, index) => {
  const groupName = group.groupName || group.name || 'Unknown';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Group ${index + 1}: ${groupName}`);
  console.log(`ID: ${group.id || 'N/A'}`);
  console.log(`Email: ${group.email || 'N/A'}`);
  console.log(`\n📸 Photo Data Analysis:`);
  
  // Check top-level photo fields
  console.log(`\n  Top-level fields:`);
  console.log(`    groupPhotoVariantUrls:`, 
    group.groupPhotoVariantUrls 
      ? (Array.isArray(group.groupPhotoVariantUrls) 
          ? `Array[${group.groupPhotoVariantUrls.length}] = ${JSON.stringify(group.groupPhotoVariantUrls.slice(0, 2))}${group.groupPhotoVariantUrls.length > 2 ? '...' : ''}`
          : group.groupPhotoVariantUrls)
      : '❌ MISSING');
  console.log(`    groupPhotoVariants:`, 
    group.groupPhotoVariants 
      ? (Array.isArray(group.groupPhotoVariants)
          ? `Array[${group.groupPhotoVariants.length}] = ${JSON.stringify(group.groupPhotoVariants.slice(0, 1))}${group.groupPhotoVariants.length > 1 ? '...' : ''}`
          : group.groupPhotoVariants)
      : '❌ MISSING');
  console.log(`    groupPhotoUrl:`, group.groupPhotoUrl || '❌ MISSING');
  
  // Check rawData photo fields
  if (group.rawData) {
    console.log(`\n  rawData fields:`);
    console.log(`    groupPhotoVariantUrls:`, 
      group.rawData.groupPhotoVariantUrls 
        ? (Array.isArray(group.rawData.groupPhotoVariantUrls)
            ? `Array[${group.rawData.groupPhotoVariantUrls.length}] = ${JSON.stringify(group.rawData.groupPhotoVariantUrls.slice(0, 2))}${group.rawData.groupPhotoVariantUrls.length > 2 ? '...' : ''}`
            : group.rawData.groupPhotoVariantUrls)
        : '❌ MISSING');
    console.log(`    groupPhotoVariants:`, 
      group.rawData.groupPhotoVariants 
        ? (Array.isArray(group.rawData.groupPhotoVariants)
            ? `Array[${group.rawData.groupPhotoVariants.length}] = ${JSON.stringify(group.rawData.groupPhotoVariants.slice(0, 1))}${group.rawData.groupPhotoVariants.length > 1 ? '...' : ''}`
            : group.rawData.groupPhotoVariants)
        : '❌ MISSING');
    console.log(`    groupPhotoUrl:`, group.rawData.groupPhotoUrl || '❌ MISSING');
    
    // Check all photo-related keys in rawData
    const photoKeys = Object.keys(group.rawData).filter(k => 
      k.toLowerCase().includes('photo') || 
      k.toLowerCase().includes('variant') ||
      k.toLowerCase() === 'photos'
    );
    if (photoKeys.length > 0) {
      console.log(`\n  Other photo-related keys in rawData:`, photoKeys);
      photoKeys.forEach(key => {
        const value = group.rawData[key];
        if (Array.isArray(value)) {
          console.log(`    ${key}: Array[${value.length}]`);
        } else if (typeof value === 'string') {
          console.log(`    ${key}: "${value.substring(0, 80)}${value.length > 80 ? '...' : ''}"`);
        } else {
          console.log(`    ${key}:`, typeof value);
        }
      });
    }
  } else {
    console.log(`\n  rawData: ❌ MISSING`);
  }
  
  // Test getBestPhotoUrl
  console.log(`\n  🎯 getBestPhotoUrl() result:`);
  const bestPhoto = getBestPhotoUrl(group);
  console.log(`    Selected photo:`, bestPhoto || '❌ NONE');
  
  // Summary
  const hasVariants = 
    (group.groupPhotoVariantUrls && Array.isArray(group.groupPhotoVariantUrls) && group.groupPhotoVariantUrls.length > 0) ||
    (group.groupPhotoVariants && Array.isArray(group.groupPhotoVariants) && group.groupPhotoVariants.length > 0) ||
    (group.rawData?.groupPhotoVariantUrls && Array.isArray(group.rawData.groupPhotoVariantUrls) && group.rawData.groupPhotoVariantUrls.length > 0) ||
    (group.rawData?.groupPhotoVariants && Array.isArray(group.rawData.groupPhotoVariants) && group.rawData.groupPhotoVariants.length > 0);
  
  const hasOriginal = !!(group.groupPhotoUrl || group.rawData?.groupPhotoUrl);
  
  console.log(`\n  📊 Summary:`);
  console.log(`    Has AI variants: ${hasVariants ? '✅ YES' : '❌ NO'}`);
  console.log(`    Has original photo: ${hasOriginal ? '✅ YES' : '❌ NO'}`);
  console.log(`    Will use: ${bestPhoto ? (hasVariants && bestPhoto !== (group.groupPhotoUrl || group.rawData?.groupPhotoUrl) ? '✅ AI VARIANT' : '⚠️  ORIGINAL') : '❌ NONE'}`);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`\n✅ Diagnosis complete!`);
