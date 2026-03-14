/**
 * Test script for Mandy's new welcome flow:
 * 1. Welcome message
 * 2. Group introduction with photos
 * 3. Welcome game with $50 prize
 */

const groupProfileStorage = require('./services/group-profile-storage');
const adminPhotosService = require('./services/admin-photos-service');
const mandyAgent = require('./agents/mandy-agent');
const config = require('./config');

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: []
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

// ============================================================================
// TEST 1: getMatchedGroupsForChat Function
// ============================================================================
function testGetMatchedGroupsForChat() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 1: getMatchedGroupsForChat Function`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Check if function exists
    const hasFunction = typeof groupProfileStorage.getMatchedGroupsForChat === 'function';
    logTest(
      'Function Exists',
      hasFunction,
      hasFunction ? 'getMatchedGroupsForChat function found' : 'Function not found'
    );

    if (!hasFunction) return false;

    // Test with null chatId
    const nullResult = groupProfileStorage.getMatchedGroupsForChat(null);
    logTest(
      'Null chatId Handling',
      nullResult === null,
      nullResult === null ? 'Returns null for null chatId' : 'Should return null for null chatId'
    );

    // Test with empty chatId
    const emptyResult = groupProfileStorage.getMatchedGroupsForChat('');
    logTest(
      'Empty chatId Handling',
      emptyResult === null,
      emptyResult === null ? 'Returns null for empty chatId' : 'Should return null for empty chatId'
    );

    // Test with non-existent chatId
    const fakeResult = groupProfileStorage.getMatchedGroupsForChat('fake-chat-id-12345');
    logTest(
      'Non-existent chatId',
      fakeResult === null || !fakeResult.group1,
      fakeResult === null || !fakeResult.group1 
        ? 'Returns null or invalid result for non-existent chatId' 
        : 'Unexpectedly found groups for fake chatId',
      fakeResult !== null && fakeResult.group1
    );

    return true;
  } catch (error) {
    logTest('getMatchedGroupsForChat', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 2: Admin Photos Service
// ============================================================================
async function testAdminPhotosService() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 2: Admin Photos Service`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Check if service exists
    const hasGetPhotos = typeof adminPhotosService.getPhotos === 'function';
    const hasGetRandomPhoto = typeof adminPhotosService.getRandomPhoto === 'function';
    
    logTest(
      'Service Functions Exist',
      hasGetPhotos && hasGetRandomPhoto,
      hasGetPhotos && hasGetRandomPhoto 
        ? 'Both functions found' 
        : `Missing: ${!hasGetPhotos ? 'getPhotos' : ''} ${!hasGetRandomPhoto ? 'getRandomPhoto' : ''}`
    );

    if (!hasGetPhotos || !hasGetRandomPhoto) return false;

    // Test getRandomPhoto with empty array
    const emptyPhoto = adminPhotosService.getRandomPhoto([]);
    logTest(
      'Empty Photos Array',
      emptyPhoto === null,
      emptyPhoto === null ? 'Returns null for empty array' : 'Should return null for empty array'
    );

    // Test getRandomPhoto with null
    const nullPhoto = adminPhotosService.getRandomPhoto(null);
    logTest(
      'Null Photos Array',
      nullPhoto === null,
      nullPhoto === null ? 'Returns null for null' : 'Should return null for null'
    );

    // Test getRandomPhoto with valid array
    const testPhotos = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
    const randomPhoto = adminPhotosService.getRandomPhoto(testPhotos);
    logTest(
      'Random Photo Selection',
      randomPhoto !== null && testPhotos.includes(randomPhoto),
      randomPhoto !== null && testPhotos.includes(randomPhoto)
        ? `Selected: ${randomPhoto}`
        : 'Failed to select random photo'
    );

    // Try to fetch photos (may fail if API not available, that's OK)
    try {
      const photos = await adminPhotosService.getPhotos();
      logTest(
        'Photos API Call',
        Array.isArray(photos),
        Array.isArray(photos) 
          ? `Fetched ${photos.length} photos` 
          : 'API returned non-array',
        !Array.isArray(photos)
      );
    } catch (error) {
      logTest(
        'Photos API Call',
        false,
        `API call failed: ${error.message}`,
        true // Warning, not failure - API might not be available in test
      );
    }

    return true;
  } catch (error) {
    logTest('Admin Photos Service', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 3: Welcome Message
// ============================================================================
function testWelcomeMessage() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 3: Welcome Message`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const welcomeMessage = mandyAgent.getWelcomeMessage('TestUser', false);
    
    logTest(
      'Welcome Message Generated',
      typeof welcomeMessage === 'string' && welcomeMessage.length > 0,
      typeof welcomeMessage === 'string' && welcomeMessage.length > 0
        ? `Generated (${welcomeMessage.length} chars)`
        : 'Failed to generate welcome message'
    );

    const hasGameBonus = welcomeMessage.toLowerCase().includes('15%') || 
                         welcomeMessage.toLowerCase().includes('bonus');
    logTest(
      'Welcome Message Has Bonus Mention',
      hasGameBonus,
      hasGameBonus 
        ? 'Contains 15% bonus mention' 
        : 'Missing 15% bonus mention',
      !hasGameBonus
    );

    console.log(`\n📋 Sample welcome message:`);
    console.log(`"${welcomeMessage.substring(0, 200)}..."\n`);

    return true;
  } catch (error) {
    logTest('Welcome Message', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 4: Welcome Game Configuration
// ============================================================================
function testWelcomeGameConfig() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 4: Welcome Game Configuration`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const welcomeMiniApp = config.agents.mandy.miniApps?.welcomeMiniApp;
    
    logTest(
      'Welcome Mini App Config',
      !!welcomeMiniApp,
      welcomeMiniApp ? 'Configuration found' : 'Configuration missing'
    );

    if (welcomeMiniApp) {
      const hasId = welcomeMiniApp.id && !welcomeMiniApp.id.includes('your_');
      logTest(
        'Welcome Mini App ID',
        hasId,
        hasId ? `ID: ${welcomeMiniApp.id}` : 'ID not configured'
      );

      const correctId = welcomeMiniApp.id === 'xs76ck6ada5ygz39jvgh85dmnd82dvw0';
      logTest(
        'Welcome Mini App ID Correct',
        correctId,
        correctId 
          ? 'ID matches expected' 
          : `ID mismatch: expected xs76ck6ada5ygz39jvgh85dmnd82dvw0, got ${welcomeMiniApp.id}`
      );
    }

    return !!welcomeMiniApp;
  } catch (error) {
    logTest('Welcome Game Config', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 5: Webhook Code Structure
// ============================================================================
function testWebhookCodeStructure() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 5: Webhook Code Structure`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const fs = require('fs');
    const webhookCode = fs.readFileSync('./webhooks/mandy-webhook.js', 'utf8');

    // Check for getMatchedGroupsForChat usage
    const hasMatchedGroupsCall = webhookCode.includes('getMatchedGroupsForChat');
    logTest(
      'Webhook: Uses getMatchedGroupsForChat',
      hasMatchedGroupsCall,
      hasMatchedGroupsCall 
        ? 'Calls getMatchedGroupsForChat' 
        : 'Missing getMatchedGroupsForChat call'
    );

    // Check for adminPhotosService usage
    const hasPhotosService = webhookCode.includes('adminPhotosService');
    logTest(
      'Webhook: Uses adminPhotosService',
      hasPhotosService,
      hasPhotosService 
        ? 'Uses adminPhotosService' 
        : 'Missing adminPhotosService usage'
    );

    // Check for group introduction message
    const hasGroupIntro = webhookCode.includes('two groups') || 
                         webhookCode.includes('matched groups');
    logTest(
      'Webhook: Group Introduction',
      hasGroupIntro,
      hasGroupIntro 
        ? 'Has group introduction logic' 
        : 'Missing group introduction logic'
    );

    // Check for $50 prize message
    const hasPrizeMessage = webhookCode.includes('$50') || 
                           webhookCode.includes('50 dollars');
    logTest(
      'Webhook: $50 Prize Message',
      hasPrizeMessage,
      hasPrizeMessage 
        ? 'Has $50 prize message' 
        : 'Missing $50 prize message'
    );

    // Check for sendMediaMessage usage
    const hasSendMedia = webhookCode.includes('sendMediaMessage');
    logTest(
      'Webhook: Uses sendMediaMessage',
      hasSendMedia,
      hasSendMedia 
        ? 'Uses sendMediaMessage for photos' 
        : 'Missing sendMediaMessage usage'
    );

    return hasMatchedGroupsCall && hasPhotosService && hasGroupIntro && hasPrizeMessage;
  } catch (error) {
    logTest('Webhook Code Structure', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 6: Photos API Endpoint
// ============================================================================
function testPhotosEndpoint() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 6: Photos API Endpoint`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const fs = require('fs');
    const serverCode = fs.readFileSync('./server.js', 'utf8');

    // Check for photos endpoint
    const hasPhotosEndpoint = serverCode.includes('/admin/api/photos') ||
                              serverCode.includes('admin/api/photos');
    logTest(
      'Photos Endpoint Exists',
      hasPhotosEndpoint,
      hasPhotosEndpoint 
        ? 'Photos endpoint found' 
        : 'Photos endpoint not found'
    );

    // Check for requireAdminAuth
    const hasAuth = serverCode.includes('requireAdminAuth') && 
                    (serverCode.includes('/admin/api/photos') || 
                     serverCode.match(/app\.get\(['"]\/admin\/api\/photos['"]/));
    logTest(
      'Photos Endpoint Auth',
      hasAuth,
      hasAuth 
        ? 'Endpoint requires admin auth' 
        : 'Endpoint may not require auth',
      !hasAuth
    );

    return hasPhotosEndpoint;
  } catch (error) {
    logTest('Photos Endpoint', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: MANDY WELCOME FLOW`);
  console.log(`${'='.repeat(80)}\n`);

  // Run all tests
  testGetMatchedGroupsForChat();
  await testAdminPhotosService();
  testWelcomeMessage();
  testWelcomeGameConfig();
  testWebhookCodeStructure();
  testPhotosEndpoint();

  // Print summary
  console.log(`\n${'='.repeat(80)}`);
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

  if (warnings > 0) {
    console.log(`⚠️  Warnings:`);
    testResults.warnings.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
    console.log('');
  }

  // Overall assessment
  console.log(`${'='.repeat(80)}`);
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  if (successRate >= 80) {
    console.log(`✅ OVERALL: Welcome flow is properly implemented! (${successRate.toFixed(1)}% pass rate)`);
  } else if (successRate >= 60) {
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
  runAllTests().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
