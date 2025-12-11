/**
 * View Group Profile Data
 * Simple script to view all stored group profiles and interview states
 */

const groupProfileStorage = require('./services/group-profile-storage');
const fs = require('fs');
const path = require('path');

console.log('\n📊 Mandy Group Matchmaker - Data Viewer\n');
console.log('='.repeat(60));

// Get statistics
const stats = groupProfileStorage.getStats();
console.log('\n📈 Statistics:');
console.log(`   Total Completed Profiles: ${stats.totalProfiles}`);
console.log(`   Active Interviews: ${stats.activeInterviews}`);
console.log(`   Stored Matches: ${stats.totalMatches}`);

// Show all completed profiles
const allProfiles = groupProfileStorage.getAllProfiles();
console.log('\n✅ Completed Group Profiles:');
console.log('='.repeat(60));
if (allProfiles.length === 0) {
  console.log('   No completed profiles yet.');
} else {
  allProfiles.forEach((profile, index) => {
    console.log(`\n   Profile ${index + 1}:`);
    console.log(`   ──────────────────────────────────────────────`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Group Name: ${profile.groupName || 'N/A'}`);
    console.log(`   Created: ${profile.createdAt || 'N/A'}`);
    console.log(`   Answers:`);
    Object.keys(profile).forEach(key => {
      if (!['id', 'groupName', 'createdAt', 'profileVersion'].includes(key)) {
        console.log(`     ${key}: ${profile[key]}`);
      }
    });
  });
}

// Show active interviews
const stateFile = path.join(__dirname, 'data', 'interview-state.json');
if (fs.existsSync(stateFile)) {
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const chatIds = Object.keys(state);
  
  console.log('\n\n🔄 Active Interviews:');
  console.log('='.repeat(60));
  if (chatIds.length === 0) {
    console.log('   No active interviews.');
  } else {
    chatIds.forEach((chatId, index) => {
      const interview = state[chatId];
      console.log(`\n   Interview ${index + 1}:`);
      console.log(`   ──────────────────────────────────────────────`);
      console.log(`   Chat ID: ${chatId.substring(0, 20)}...`);
      console.log(`   Question: ${interview.questionNumber}/10`);
      console.log(`   Group Name: ${interview.groupName || 'Not set yet'}`);
      console.log(`   Started: ${interview.startedAt || 'N/A'}`);
      console.log(`   Waiting for clarification: ${interview.waitingForClarification || false}`);
      if (Object.keys(interview.answers || {}).length > 0) {
        console.log(`   Answers collected:`);
        Object.keys(interview.answers).forEach(key => {
          console.log(`     ${key}: ${interview.answers[key]}`);
        });
      }
    });
  }
}

// Show stored matches
const allMatches = groupProfileStorage.getAllMatches();
console.log('\n\n💕 Stored Matches:');
console.log('='.repeat(60));
if (allMatches.length === 0) {
  console.log('   No matches stored yet.');
  console.log('   Run the matching algorithm to generate matches.');
} else {
  // Sort by compatibility score (highest first)
  const sortedMatches = [...allMatches].sort((a, b) => 
    (b.compatibility?.percentage || 0) - (a.compatibility?.percentage || 0)
  );
  
  sortedMatches.forEach((match, index) => {
    console.log(`\n   Match ${index + 1}:`);
    console.log(`   ──────────────────────────────────────────────`);
    console.log(`   ${match.group1Name} ↔ ${match.group2Name}`);
    console.log(`   Compatibility: ${match.compatibility?.percentage || 'N/A'}%`);
    if (match.compatibility?.breakdown) {
      console.log(`   Breakdown:`);
      console.log(`     - Quantitative: ${match.compatibility.breakdown.quantitative}%`);
      console.log(`     - Qualitative: ${match.compatibility.breakdown.qualitative}%`);
      if (match.compatibility.breakdown.sizeMatch !== undefined) {
        console.log(`     - Size Match: ${match.compatibility.breakdown.sizeMatch}%`);
      }
    }
    console.log(`   Matched At: ${match.matchedAt || 'N/A'}`);
    console.log(`   ID: ${match.id || 'N/A'}`);
  });
}

console.log('\n\n📁 File Locations:');
console.log('='.repeat(60));
console.log(`   Completed Profiles: ${path.join(__dirname, 'data', 'group-profiles.json')}`);
console.log(`   Interview State: ${path.join(__dirname, 'data', 'interview-state.json')}`);
console.log(`   Matches: ${path.join(__dirname, 'data', 'matches.json')}`);
console.log('\n');

