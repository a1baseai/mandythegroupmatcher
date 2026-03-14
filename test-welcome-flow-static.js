/**
 * Static test script for Mandy's new welcome flow
 * Tests code structure without requiring dependencies
 */

const fs = require('fs');

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
    const storageCode = fs.readFileSync('./services/group-profile-storage.js', 'utf8');

    // Check if function exists
    const hasFunction = storageCode.includes('getMatchedGroupsForChat');
    logTest(
      'Function Exists',
      hasFunction,
      hasFunction ? 'getMatchedGroupsForChat function found' : 'Function not found'
    );

    // Check if exported
    const isExported = storageCode.includes('getMatchedGroupsForChat') &&
                       storageCode.includes('module.exports');
    logTest(
      'Function Exported',
      isExported,
      isExported ? 'Function is exported' : 'Function not exported'
    );

    // Check function logic
    const hasNullCheck = storageCode.includes('if (!chatId) return null') ||
                        storageCode.includes('if (!chatId)') ||
                        storageCode.includes('chatId) return null');
    logTest(
      'Null Check',
      hasNullCheck,
      hasNullCheck ? 'Has null check for chatId' : 'Missing null check'
    );

    const hasGetProfileByChatId = storageCode.includes('getProfileByChatId(chatId)');
    logTest(
      'Uses getProfileByChatId',
      hasGetProfileByChatId,
      hasGetProfileByChatId ? 'Uses getProfileByChatId' : 'Missing getProfileByChatId call'
    );

    const hasGetMatchesForGroup = storageCode.includes('getMatchesForGroup');
    logTest(
      'Uses getMatchesForGroup',
      hasGetMatchesForGroup,
      hasGetMatchesForGroup ? 'Uses getMatchesForGroup' : 'Missing getMatchesForGroup call'
    );

    return hasFunction && isExported;
  } catch (error) {
    logTest('getMatchedGroupsForChat', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 2: Admin Photos Service
// ============================================================================
function testAdminPhotosService() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 2: Admin Photos Service`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const photosCode = fs.readFileSync('./services/admin-photos-service.js', 'utf8');

    // Check if service file exists and has functions
    const hasGetPhotos = photosCode.includes('getPhotos') || 
                        photosCode.includes('function getPhotos');
    const hasGetRandomPhoto = photosCode.includes('getRandomPhoto') ||
                             photosCode.includes('function getRandomPhoto');
    
    logTest(
      'Service File Exists',
      photosCode.length > 0,
      photosCode.length > 0 ? 'Admin photos service file found' : 'File not found'
    );

    logTest(
      'getPhotos Function',
      hasGetPhotos,
      hasGetPhotos ? 'getPhotos function found' : 'getPhotos function missing'
    );

    logTest(
      'getRandomPhoto Function',
      hasGetRandomPhoto,
      hasGetRandomPhoto ? 'getRandomPhoto function found' : 'getRandomPhoto function missing'
    );

    // Check for API endpoint reference
    const hasApiEndpoint = photosCode.includes('/admin/api/photos');
    logTest(
      'API Endpoint Reference',
      hasApiEndpoint,
      hasApiEndpoint ? 'References /admin/api/photos' : 'Missing API endpoint reference'
    );

    // Check for admin auth
    const hasAuth = photosCode.includes('Basic') || photosCode.includes('Authorization');
    logTest(
      'Authentication Logic',
      hasAuth,
      hasAuth ? 'Has authentication logic' : 'Missing authentication logic'
    );

    return hasGetPhotos && hasGetRandomPhoto;
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
    const agentCode = fs.readFileSync('./agents/mandy-agent.js', 'utf8');

    // Extract welcome message function
    const welcomeMatch = agentCode.match(/getWelcomeMessage\([^)]*\)\s*\{[\s\S]*?const\s+messages\s*=\s*\[([\s\S]*?)\];/);
    
    if (welcomeMatch) {
      const welcomeCode = welcomeMatch[1];
      
      // Check for 15% bonus mention
      const hasBonus = /15%|15\s*percent|bonus/i.test(welcomeCode);
      logTest(
        'Welcome Message: 15% Bonus',
        hasBonus,
        hasBonus ? 'Contains 15% bonus mention' : 'Missing 15% bonus mention'
      );

      // Check for game mention
      const hasGame = /game|play/i.test(welcomeCode);
      logTest(
        'Welcome Message: Game Mention',
        hasGame,
        hasGame ? 'Mentions game' : 'Missing game mention'
      );

      console.log(`\n📋 Welcome message code found`);
    } else {
      logTest('Welcome Message', false, 'Could not find getWelcomeMessage function');
      return false;
    }

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
    const configCode = fs.readFileSync('./config.js', 'utf8');

    const hasWelcomeMiniApp = configCode.includes('welcomeMiniApp');
    logTest(
      'Welcome Mini App Config',
      hasWelcomeMiniApp,
      hasWelcomeMiniApp ? 'Configuration found' : 'Configuration missing'
    );

    const hasCorrectId = configCode.includes('xs76ck6ada5ygz39jvgh85dmnd82dvw0');
    logTest(
      'Welcome Mini App ID',
      hasCorrectId,
      hasCorrectId 
        ? 'Correct ID found' 
        : 'ID not found or incorrect'
    );

    return hasWelcomeMiniApp && hasCorrectId;
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
                         webhookCode.includes('matched groups') ||
                         webhookCode.includes('Here are the two groups');
    logTest(
      'Webhook: Group Introduction',
      hasGroupIntro,
      hasGroupIntro 
        ? 'Has group introduction logic' 
        : 'Missing group introduction logic'
    );

    // Check for $50 prize message
    const hasPrizeMessage = webhookCode.includes('$50') || 
                           webhookCode.includes('50 dollars') ||
                           webhookCode.includes('free food');
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

    // Check message order (welcome, then group intro, then game)
    const welcomeIndex = webhookCode.indexOf('welcomeMessage');
    const groupIntroIndex = webhookCode.indexOf('getMatchedGroupsForChat');
    const gameIndex = webhookCode.indexOf('welcomeMiniApp');
    
    const correctOrder = welcomeIndex < groupIntroIndex && groupIntroIndex < gameIndex;
    logTest(
      'Webhook: Message Order',
      correctOrder || welcomeIndex === -1 || groupIntroIndex === -1 || gameIndex === -1,
      correctOrder 
        ? 'Messages in correct order (welcome → groups → game)'
        : 'Message order may be incorrect',
      !correctOrder && welcomeIndex !== -1 && groupIntroIndex !== -1 && gameIndex !== -1
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
    const serverCode = fs.readFileSync('./server.js', 'utf8');

    // Check for photos endpoint
    const hasPhotosEndpoint = serverCode.includes('/admin/api/photos') ||
                              serverCode.match(/app\.get\(['"]\/admin\/api\/photos['"]/);
    logTest(
      'Photos Endpoint Exists',
      hasPhotosEndpoint,
      hasPhotosEndpoint 
        ? 'Photos endpoint found' 
        : 'Photos endpoint not found'
    );

    // Check for requireAdminAuth
    const endpointPattern = /app\.get\(['"]\/admin\/api\/photos['"][\s\S]*?requireAdminAuth/;
    const hasAuth = endpointPattern.test(serverCode) ||
                    (serverCode.includes('/admin/api/photos') && 
                     serverCode.includes('requireAdminAuth'));
    logTest(
      'Photos Endpoint Auth',
      hasAuth,
      hasAuth 
        ? 'Endpoint requires admin auth' 
        : 'Endpoint may not require auth',
      !hasAuth
    );

    // Check for MANDY_PHOTOS env var reference
    const hasEnvVar = serverCode.includes('MANDY_PHOTOS') ||
                     serverCode.includes('process.env.MANDY_PHOTOS');
    logTest(
      'Photos Env Var Support',
      hasEnvVar,
      hasEnvVar 
        ? 'Supports MANDY_PHOTOS env var' 
        : 'Missing MANDY_PHOTOS env var support'
    );

    return hasPhotosEndpoint;
  } catch (error) {
    logTest('Photos Endpoint', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 7: Code Quality
// ============================================================================
function testCodeQuality() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 7: Code Quality`);
  console.log(`${'='.repeat(80)}\n`);

  const files = [
    './services/group-profile-storage.js',
    './services/admin-photos-service.js',
    './webhooks/mandy-webhook.js',
    './server.js',
    './agents/mandy-agent.js',
    './config.js'
  ];

  let allFilesExist = true;
  for (const file of files) {
    const exists = fs.existsSync(file);
    logTest(
      `File Exists: ${file.split('/').pop()}`,
      exists,
      exists ? 'File found' : 'File not found'
    );
    if (!exists) allFilesExist = false;
  }

  return allFilesExist;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
function runAllTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 STATIC TEST: MANDY WELCOME FLOW`);
  console.log(`${'='.repeat(80)}\n`);

  // Run all tests
  testCodeQuality();
  testGetMatchedGroupsForChat();
  testAdminPhotosService();
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
  runAllTests();
}

module.exports = { runAllTests };
