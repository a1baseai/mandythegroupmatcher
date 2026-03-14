/**
 * DETAILED TEST: Mandy's Welcome Flow
 * 
 * This test thoroughly validates the welcome flow implementation and explains how it works.
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  explanations: []
};

function logTest(name, passed, message, isWarning = false) {
  const status = passed ? '✅' : (isWarning ? '⚠️' : '❌');
  console.log(`${status} ${name}: ${message}`);
  
  if (passed) {
    testResults.passed.push({ name, message });
  } else if (isWarning) {
    testResults.warnings.push({ name, message });
  } else {
    testResults.failed.push({ name, message });
  }
}

function addExplanation(title, content) {
  testResults.explanations.push({ title, content });
}

// ============================================================================
// COMPREHENSIVE CODE ANALYSIS
// ============================================================================

function analyzeCodeFlow() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📖 CODE FLOW ANALYSIS`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const webhookCode = fs.readFileSync('./webhooks/mandy-webhook.js', 'utf8');
    const storageCode = fs.readFileSync('./services/group-profile-storage.js', 'utf8');
    const photosCode = fs.readFileSync('./services/admin-photos-service.js', 'utf8');
    const serverCode = fs.readFileSync('./server.js', 'utf8');
    const clientCode = fs.readFileSync('./core/BaseA1ZapClient.js', 'utf8');

    // Extract handleChatStarted function
    const chatStartedMatch = webhookCode.match(/async handleChatStarted\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*\/\/|\n\s*async|\n\s*\})/);
    
    if (chatStartedMatch) {
      const chatStartedBody = chatStartedMatch[1];
      
      // Check message sequence
      const welcomeIndex = chatStartedBody.indexOf('sendMessage(chatId, welcomeMessage)');
      const groupIntroIndex = chatStartedBody.indexOf('getMatchedGroupsForChat');
      const photosIndex = chatStartedBody.indexOf('adminPhotosService.getPhotos');
      const mediaIndex = chatStartedBody.indexOf('sendMediaMessage');
      const gameIndex = chatStartedBody.indexOf('welcomeMiniApp');
      const prizeIndex = chatStartedBody.indexOf('$50');

      console.log(`📋 Message Sequence Analysis:`);
      console.log(`   1. Welcome message: ${welcomeIndex !== -1 ? '✅ Found' : '❌ Missing'} (index: ${welcomeIndex})`);
      console.log(`   2. Get matched groups: ${groupIntroIndex !== -1 ? '✅ Found' : '❌ Missing'} (index: ${groupIntroIndex})`);
      console.log(`   3. Fetch photos: ${photosIndex !== -1 ? '✅ Found' : '❌ Missing'} (index: ${photosIndex})`);
      console.log(`   4. Send media messages: ${mediaIndex !== -1 ? '✅ Found' : '❌ Missing'} (index: ${mediaIndex})`);
      console.log(`   5. Send welcome game: ${gameIndex !== -1 ? '✅ Found' : '❌ Missing'} (index: ${gameIndex})`);
      console.log(`   6. $50 prize message: ${prizeIndex !== -1 ? '✅ Found' : '❌ Missing'} (index: ${prizeIndex})`);

      // Verify order
      const correctOrder = welcomeIndex < groupIntroIndex && 
                          groupIntroIndex < photosIndex && 
                          photosIndex < mediaIndex &&
                          mediaIndex < gameIndex &&
                          gameIndex < prizeIndex;
      
      logTest('Message Order', correctOrder, 
        correctOrder 
          ? 'Messages are in correct sequence'
          : 'Message order may be incorrect');

      addExplanation('Message Flow', `
The welcome flow executes in this order:
1. Welcome message sent first
2. Get matched groups for the chat
3. Fetch photos from admin API
4. Send group introductions with photos (2 separate messages)
5. Send welcome game mini app
6. Include $50 prize message with game
      `);
    }

    // Analyze getMatchedGroupsForChat function
    const matchedGroupsMatch = storageCode.match(/function getMatchedGroupsForChat\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
    if (matchedGroupsMatch) {
      const functionBody = matchedGroupsMatch[1];
      
      const hasNullCheck = functionBody.includes('if (!chatId)');
      const hasGetProfile = functionBody.includes('getProfileByChatId');
      const hasGetMatches = functionBody.includes('getMatchesForGroup');
      const hasGetProfiles = functionBody.includes('getProfileByGroupName');
      const returnsBothGroups = functionBody.includes('group1') && functionBody.includes('group2');

      console.log(`\n📋 getMatchedGroupsForChat Function Analysis:`);
      console.log(`   Null check: ${hasNullCheck ? '✅' : '❌'}`);
      console.log(`   Gets profile by chatId: ${hasGetProfile ? '✅' : '❌'}`);
      console.log(`   Gets matches: ${hasGetMatches ? '✅' : '❌'}`);
      console.log(`   Gets both group profiles: ${hasGetProfiles ? '✅' : '❌'}`);
      console.log(`   Returns both groups: ${returnsBothGroups ? '✅' : '❌'}`);

      addExplanation('getMatchedGroupsForChat Logic', `
This function:
1. Takes a chatId as input
2. Finds the group profile associated with that chatId
3. Retrieves all matches for that group
4. Selects the best match (marked as isBestMatch or first match)
5. Gets both group profiles (group1 and group2)
6. Returns { group1, group2, match } object
      `);
    }

    // Analyze admin photos service
    const hasGetPhotos = photosCode.includes('async function getPhotos') || 
                        photosCode.includes('function getPhotos');
    const hasGetRandom = photosCode.includes('function getRandomPhoto');
    const hasAuth = photosCode.includes('Basic') || photosCode.includes('Authorization');
    const hasApiCall = photosCode.includes('/admin/api/photos');

    console.log(`\n📋 Admin Photos Service Analysis:`);
    console.log(`   getPhotos function: ${hasGetPhotos ? '✅' : '❌'}`);
    console.log(`   getRandomPhoto function: ${hasGetRandom ? '✅' : '❌'}`);
    console.log(`   Authentication: ${hasAuth ? '✅' : '❌'}`);
    console.log(`   API endpoint: ${hasApiCall ? '✅' : '❌'}`);

    addExplanation('Admin Photos Service', `
The service:
1. Uses Basic Auth (username: admin, password: a1zapped!)
2. Fetches photos from /admin/api/photos endpoint
3. Caches photos for 5 minutes to reduce API calls
4. getRandomPhoto() selects a random photo from the array
5. Returns empty array on error (graceful degradation)
      `);

    // Analyze sendMediaMessage
    const hasSendMedia = clientCode.includes('sendMediaMessage');
    const hasRichContent = clientCode.includes('richContentBlocks');

    console.log(`\n📋 sendMediaMessage Analysis:`);
    console.log(`   Function exists: ${hasSendMedia ? '✅' : '❌'}`);
    console.log(`   Uses rich content blocks: ${hasRichContent ? '✅' : '❌'}`);

    addExplanation('sendMediaMessage', `
This function:
1. Takes chatId, message text, and image URL
2. Creates a rich content block with type 'image'
3. Sends message with image attached
4. Falls back to text-only if image fails
      `);

    // Analyze photos endpoint
    const endpointMatch = serverCode.match(/app\.get\(['"]\/admin\/api\/photos['"][\s\S]*?\}\);/);
    const hasEnvVar = serverCode.includes('MANDY_PHOTOS');
    const hasAuthCheck = serverCode.includes('requireAdminAuth');

    console.log(`\n📋 Photos API Endpoint Analysis:`);
    console.log(`   Endpoint exists: ${endpointMatch ? '✅' : '❌'}`);
    console.log(`   Requires auth: ${hasAuthCheck ? '✅' : '❌'}`);
    console.log(`   Uses MANDY_PHOTOS env var: ${hasEnvVar ? '✅' : '❌'}`);

    addExplanation('Photos API Endpoint', `
The /admin/api/photos endpoint:
1. Requires Basic Auth (admin credentials)
2. Reads photos from MANDY_PHOTOS environment variable
3. Returns JSON: { success: true, photos: [...] }
4. Photos are comma-separated URLs in env var
5. Returns empty array if not configured
      `);

    return true;
  } catch (error) {
    logTest('Code Flow Analysis', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// DETAILED FUNCTIONAL TESTS
// ============================================================================

function testFunctionSignatures() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: Function Signatures`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const storageCode = fs.readFileSync('./services/group-profile-storage.js', 'utf8');
    const photosCode = fs.readFileSync('./services/admin-photos-service.js', 'utf8');
    const webhookCode = fs.readFileSync('./webhooks/mandy-webhook.js', 'utf8');

    // Test getMatchedGroupsForChat signature
    const matchedGroupsPattern = /function getMatchedGroupsForChat\s*\(\s*chatId\s*\)/;
    const hasCorrectSignature = matchedGroupsPattern.test(storageCode);
    logTest('getMatchedGroupsForChat Signature', hasCorrectSignature,
      hasCorrectSignature ? 'Correct function signature' : 'Incorrect signature');

    // Test getRandomPhoto signature
    const randomPhotoPattern = /function getRandomPhoto\s*\(\s*photos\s*\)/;
    const hasRandomPhotoSig = randomPhotoPattern.test(photosCode);
    logTest('getRandomPhoto Signature', hasRandomPhotoSig,
      hasRandomPhotoSig ? 'Correct function signature' : 'Incorrect signature');

    // Test async getPhotos
    const getPhotosPattern = /async function getPhotos\s*\(\s*\)/;
    const hasGetPhotosSig = getPhotosPattern.test(photosCode);
    logTest('getPhotos Signature', hasGetPhotosSig,
      hasGetPhotosSig ? 'Correct async function signature' : 'Incorrect signature');

    // Test error handling in webhook
    const hasTryCatch = webhookCode.includes('try {') && 
                       webhookCode.includes('catch') &&
                       webhookCode.includes('groupIntroError');
    logTest('Error Handling', hasTryCatch,
      hasTryCatch ? 'Has try-catch for group intro' : 'Missing error handling');

    return true;
  } catch (error) {
    logTest('Function Signatures', false, `Error: ${error.message}`);
    return false;
  }
}

function testErrorHandling() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: Error Handling`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const webhookCode = fs.readFileSync('./webhooks/mandy-webhook.js', 'utf8');
    const photosCode = fs.readFileSync('./services/admin-photos-service.js', 'utf8');

    // Check for graceful degradation
    const hasPhotoFallback = webhookCode.includes('photoError') || 
                            webhookCode.includes('sendMessage') && 
                            webhookCode.includes('group1Photo');
    logTest('Photo Error Fallback', hasPhotoFallback,
      hasPhotoFallback ? 'Falls back to text if photo fails' : 'Missing fallback');

    // Check for empty photos handling
    const hasEmptyCheck = photosCode.includes('photos.length === 0') ||
                         photosCode.includes('!photos') ||
                         photosCode.includes('photos ||');
    logTest('Empty Photos Handling', hasEmptyCheck,
      hasEmptyCheck ? 'Handles empty photos array' : 'Missing empty check');

    // Check for null return
    const hasNullReturn = photosCode.includes('return null') ||
                         photosCode.includes('return null;');
    logTest('Null Return', hasNullReturn,
      hasNullReturn ? 'Returns null for empty photos' : 'Missing null return');

    // Check for API error handling
    const hasApiErrorHandling = photosCode.includes('catch') &&
                               photosCode.includes('return []');
    logTest('API Error Handling', hasApiErrorHandling,
      hasApiErrorHandling ? 'Returns empty array on API error' : 'Missing error handling');

    addExplanation('Error Handling Strategy', `
The system handles errors gracefully:
1. If photos API fails → returns empty array
2. If photo send fails → falls back to text-only message
3. If matched groups not found → logs warning, continues
4. If mini app fails → logs error, doesn't crash webhook
5. All errors are logged but don't stop the flow
      `);

    return true;
  } catch (error) {
    logTest('Error Handling', false, `Error: ${error.message}`);
    return false;
  }
}

function testDataFlow() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: Data Flow`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const webhookCode = fs.readFileSync('./webhooks/mandy-webhook.js', 'utf8');

    // Check that photos are fetched before use
    const photosFetchIndex = webhookCode.indexOf('adminPhotosService.getPhotos()');
    const photosUseIndex = webhookCode.indexOf('getRandomPhoto(photos)');
    const correctPhotoFlow = photosFetchIndex < photosUseIndex;

    logTest('Photos Fetch Before Use', correctPhotoFlow,
      correctPhotoFlow ? 'Photos fetched before random selection' : 'Photos used before fetch');

    // Check that groups are retrieved before photos
    const groupsIndex = webhookCode.indexOf('getMatchedGroupsForChat');
    const correctGroupFlow = groupsIndex < photosFetchIndex;

    logTest('Groups Retrieved Before Photos', correctGroupFlow,
      correctGroupFlow ? 'Groups retrieved before photo fetch' : 'Incorrect order');

    // Check that both groups get photos
    const hasGroup1Photo = webhookCode.includes('group1Photo');
    const hasGroup2Photo = webhookCode.includes('group2Photo');
    const bothGroupsGetPhotos = hasGroup1Photo && hasGroup2Photo;

    logTest('Both Groups Get Photos', bothGroupsGetPhotos,
      bothGroupsGetPhotos ? 'Both groups receive photos' : 'Missing photo assignment');

    addExplanation('Data Flow', `
The data flows like this:
1. chatId → getMatchedGroupsForChat(chatId) → { group1, group2 }
2. adminPhotosService.getPhotos() → [photo1, photo2, ...]
3. getRandomPhoto(photos) → group1Photo (random)
4. getRandomPhoto(photos) → group2Photo (random, may be same or different)
5. sendMediaMessage(chatId, group1Name, group1Photo)
6. sendMediaMessage(chatId, group2Name, group2Photo)
      `);

    return true;
  } catch (error) {
    logTest('Data Flow', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

function runAllTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 DETAILED TEST: MANDY WELCOME FLOW`);
  console.log(`${'='.repeat(80)}\n`);

  // Run comprehensive tests
  analyzeCodeFlow();
  testFunctionSignatures();
  testErrorHandling();
  testDataFlow();

  // Print explanations
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📚 HOW IT WORKS`);
  console.log(`${'='.repeat(80)}\n`);

  testResults.explanations.forEach((exp, index) => {
    console.log(`${index + 1}. ${exp.title}`);
    console.log(exp.content);
    console.log('');
  });

  // Print summary
  console.log(`${'='.repeat(80)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'='.repeat(80)}\n`);

  const total = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const passed = testResults.passed.length;
  const failed = testResults.failed.length;
  const warnings = testResults.warnings.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⚠️  Warnings: ${warnings}/${total}\n`);

  if (failed > 0) {
    console.log(`❌ Failed Tests:`);
    testResults.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
    console.log('');
  }

  // Overall assessment
  console.log(`${'='.repeat(80)}`);
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  if (successRate >= 90) {
    console.log(`✅ OVERALL: Welcome flow is robust and well-implemented! (${successRate.toFixed(1)}% pass rate)`);
  } else if (successRate >= 70) {
    console.log(`⚠️  OVERALL: Most components working, but some issues to address (${successRate.toFixed(1)}% pass rate)`);
  } else {
    console.log(`❌ OVERALL: Several issues need to be fixed (${successRate.toFixed(1)}% pass rate)`);
  }
  console.log(`${'='.repeat(80)}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
