/**
 * MATCHING EVENT - Find and Save All Matches
 * 
 * Run this script when you're ready to perform official matching:
 *   node find-matches.js
 * 
 * This is the DEFINITIVE matching point - it will:
 * 1. Clear any existing matches (fresh start)
 * 2. Calculate matches for all groups
 * 3. Save all matches to data/matches.json as the official matches
 * 
 * Matches are NOT saved automatically during normal operation.
 * This script is run only when you want to perform an official matching event.
 */

const groupMatching = require('./services/group-matching');
const groupProfileStorage = require('./services/group-profile-storage');
const fs = require('fs');
const path = require('path');

async function performMatchingEvent() {
  console.log('\n' + '='.repeat(80));
  console.log('💕 OFFICIAL MATCHING EVENT');
  console.log('='.repeat(80) + '\n');

  const allProfiles = groupProfileStorage.getAllProfiles();
  console.log(`📊 Total groups in database: ${allProfiles.length}\n`);

  if (allProfiles.length < 2) {
    console.log('❌ Need at least 2 groups to perform matching.');
    console.log('   Groups are stored in: data/group-profiles.json\n');
    return;
  }

  // Clear existing matches for fresh matching event
  console.log('🗑️  Clearing existing matches for fresh matching event...');
  const matchesData = { matches: [] };
  fs.writeFileSync(path.join(__dirname, 'data', 'matches.json'), JSON.stringify(matchesData, null, 2));
  console.log('   ✅ Cleared.\n');

  // Find best overall match
  console.log('🔍 Step 1: Finding best overall match...');
  const bestMatch = await groupMatching.findBestMatch();
  
  if (bestMatch) {
    console.log(`\n   🎯 Best Match Found:`);
    console.log(`      ${bestMatch.group1.groupName} ↔ ${bestMatch.group2.groupName}`);
    console.log(`      Compatibility: ${bestMatch.compatibility.percentage}%`);
    
    // Save the best match
    groupProfileStorage.saveMatch({
      group1Name: bestMatch.group1.groupName,
      group2Name: bestMatch.group2.groupName,
      group1Id: bestMatch.group1.id,
      group2Id: bestMatch.group2.id,
      compatibility: bestMatch.compatibility,
      matchedAt: new Date().toISOString(),
      isBestMatch: true
    });
    console.log(`      ✅ Saved\n`);
  }

  // Find top matches for each group
  console.log('🔍 Step 2: Finding top matches for each group...\n');
  let totalMatchesSaved = 0;

  for (const group of allProfiles) {
    console.log(`   Finding matches for "${group.groupName}"...`);
    const matches = await groupMatching.findMatchesForGroup(group.groupName, 3);
    
    if (matches.length > 0) {
      // Save top 3 matches for this group (avoid duplicates with best match)
      for (const match of matches) {
        // Check if this match is already saved as the best match
        const isBestMatchPair = bestMatch && (
          (match.group.groupName === bestMatch.group1.groupName && group.groupName === bestMatch.group2.groupName) ||
          (match.group.groupName === bestMatch.group2.groupName && group.groupName === bestMatch.group1.groupName)
        );

        if (!isBestMatchPair) {
          groupProfileStorage.saveMatch({
            group1Name: group.groupName,
            group2Name: match.group.groupName,
            group1Id: group.id,
            group2Id: match.group.id,
            compatibility: match.compatibility,
            matchedAt: new Date().toISOString()
          });
          totalMatchesSaved++;
        }
      }
      console.log(`      ✅ Saved ${matches.length} match(es)\n`);
    }
  }

  // Show summary
  const allMatches = groupProfileStorage.getAllMatches();
  console.log('='.repeat(80));
  console.log('📊 MATCHING EVENT COMPLETE');
  console.log('='.repeat(80));
  console.log(`   Total groups matched: ${allProfiles.length}`);
  console.log(`   Total matches saved: ${allMatches.length}`);
  console.log(`   Best overall match: ${bestMatch ? `${bestMatch.group1.groupName} ↔ ${bestMatch.group2.groupName} (${bestMatch.compatibility.percentage}%)` : 'N/A'}`);
  console.log(`\n✅ All matches saved to: data/matches.json`);
  console.log(`   View them with: node view-data.js\n`);
}

performMatchingEvent().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

