/**
 * Diagnostic script to check if groups have photos in the database
 */

const groupProfileStorage = require('./services/group-profile-storage');
const { getBestPhotoUrl, validateGroupPhotos } = require('./services/mandy-email-helpers');

console.log('\n🔍 Checking group photos in database...\n');

const allProfiles = groupProfileStorage.getAllProfiles();
console.log(`Total groups in database: ${allProfiles.length}\n`);

if (allProfiles.length === 0) {
  console.log('No groups found in database.');
  process.exit(0);
}

let groupsWithPhotos = 0;
let groupsWithoutPhotos = 0;

for (const group of allProfiles) {
  const groupName = group.groupName || group.name || 'Unknown';
  const validation = validateGroupPhotos(group, groupName);
  
  if (validation.isValid) {
    groupsWithPhotos++;
    console.log(`✅ ${groupName}:`);
    console.log(`   Photo URL: ${validation.extractedPhotoUrl}`);
    console.log(`   Source: ${validation.hasGroupPhotoVariantUrls ? 'groupPhotoVariantUrls' : 
                              validation.hasGroupPhotoVariants ? 'groupPhotoVariants' : 
                              validation.hasGroupPhotoUrl ? 'groupPhotoUrl' : 'rawData'}`);
  } else {
    groupsWithoutPhotos++;
    console.log(`❌ ${groupName}: NO PHOTO`);
    console.log(`   Top level fields:`, {
      hasGroupPhotoUrl: validation.hasGroupPhotoUrl,
      hasGroupPhotoVariants: validation.hasGroupPhotoVariants,
      hasGroupPhotoVariantUrls: validation.hasGroupPhotoVariantUrls
    });
    if (group.rawData) {
      const rawHasPhoto = !!(group.rawData.groupPhotoUrl || 
                             group.rawData.groupPhotoVariantUrls || 
                             group.rawData.groupPhotoVariants);
      console.log(`   rawData has photos: ${rawHasPhoto}`);
      if (rawHasPhoto) {
        console.log(`   ⚠️  Photos are in rawData but not extracted!`);
      }
    }
  }
  console.log('');
}

console.log('\n📊 Summary:');
console.log(`   Groups with photos: ${groupsWithPhotos}/${allProfiles.length}`);
console.log(`   Groups without photos: ${groupsWithoutPhotos}/${allProfiles.length}`);

if (groupsWithoutPhotos > 0) {
  console.log('\n⚠️  Some groups are missing photos. This could be because:');
  console.log('   1. Photos weren\'t sent when groups were created');
  console.log('   2. Photos are in rawData but not extracted to top level');
  console.log('   3. Photo field names don\'t match expected format');
}
