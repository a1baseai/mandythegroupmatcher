/**
 * Comprehensive test script to verify all Mandy updates:
 * 1. Yelp API service improvements
 * 2. Activity planning service with prominent Yelp results
 * 3. Updated system prompt (focused on in-person meetups)
 * 4. Updated welcome message
 * 5. Mini app integration in second message
 */

const yelpService = require('./services/yelp-service');
const activityPlanningService = require('./services/activity-planning-service');
const mandyAgent = require('./agents/mandy-agent');
const config = require('./config');
const MiniAppService = require('./services/mini-app-service');

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
// TEST 1: Yelp Service Configuration
// ============================================================================
function testYelpServiceConfiguration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 1: Yelp Service Configuration`);
  console.log(`${'='.repeat(80)}\n`);

  const isConfigured = yelpService.isConfigured();
  logTest(
    'Yelp API Configuration',
    isConfigured,
    isConfigured ? 'Yelp API is configured' : 'Yelp API not configured (set YELP_API_KEY)',
    !isConfigured
  );

  return isConfigured;
}

// ============================================================================
// TEST 2: Yelp API Search Improvements
// ============================================================================
async function testYelpSearch() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 2: Yelp API Search (with improvements)`);
  console.log(`${'='.repeat(80)}\n`);

  if (!yelpService.isConfigured()) {
    logTest('Yelp Search', false, 'Skipped - Yelp API not configured', true);
    return false;
  }

  try {
    // Test search with location (should use best_match sorting)
    console.log('Testing Yelp search for "italian restaurant" in "Boston"...');
    const results = await yelpService.searchBusinesses('italian restaurant', 'Boston', {
      limit: 5,
      sortBy: 'best_match',
      openNow: true
    });

    logTest(
      'Yelp Search Returns Results',
      results.success && results.businesses.length > 0,
      results.success && results.businesses.length > 0 
        ? `Found ${results.businesses.length} businesses` 
        : 'No results returned'
    );

    if (results.businesses.length > 0) {
      const business = results.businesses[0];
      
      // Check that businesses are filtered (not closed)
      const allOpen = results.businesses.every(b => !b.is_closed);
      logTest(
        'Businesses Filtered (Open Only)',
        allOpen,
        allOpen ? 'All businesses are open' : 'Some closed businesses in results'
      );

      // Check that businesses have good ratings
      const avgRating = results.businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / results.businesses.length;
      logTest(
        'Business Quality (Ratings)',
        avgRating >= 3.5,
        `Average rating: ${avgRating.toFixed(1)}`,
        avgRating < 3.5
      );

      // Test formatting
      const formatted = yelpService.formatBusiness(business);
      logTest(
        'Business Formatting',
        formatted && formatted.name && formatted.rating,
        formatted ? `Formatted: ${formatted.name} (${formatted.rating}⭐)` : 'Formatting failed'
      );
    }

    return results.success;
  } catch (error) {
    logTest('Yelp Search', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 3: Activity Planning Service
// ============================================================================
async function testActivityPlanning() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 3: Activity Planning Service`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Test with location
    console.log('Testing activity search for "restaurant" in "Cambridge"...');
    const result = await activityPlanningService.searchActivities('restaurant', 'Cambridge');

    logTest(
      'Activity Search Success',
      result.success,
      result.success ? 'Search completed successfully' : `Search failed: ${result.error}`
    );

    if (result.success) {
      // Check if Yelp was used
      const usedYelp = result.source === 'yelp' && result.recommendations.length > 0;
      logTest(
        'Yelp Integration',
        usedYelp || !yelpService.isConfigured(),
        usedYelp 
          ? `Using Yelp API (${result.recommendations.length} results)`
          : yelpService.isConfigured() 
            ? 'Yelp configured but not used' 
            : 'Using fallback (Yelp not configured)',
        !usedYelp && yelpService.isConfigured()
      );

      // Check recommendations format
      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        const hasRequiredFields = rec.name && (rec.rating || rec.url);
        logTest(
          'Recommendation Format',
          hasRequiredFields,
          hasRequiredFields 
            ? `Format OK: ${rec.name}${rec.rating ? ` (${rec.rating}⭐)` : ''}`
            : 'Missing required fields'
        );
      }

      // Test formatting function
      const formatted = activityPlanningService.formatActivityRecommendations(result);
      const isConcise = formatted.length < 500; // Should be concise
      const hasYelpLinks = formatted.includes('yelp.com') || formatted.includes('Yelp');
      
      logTest(
        'Formatted Output (Concise)',
        isConcise,
        `Length: ${formatted.length} chars`,
        !isConcise
      );

      logTest(
        'Formatted Output (Yelp Links)',
        hasYelpLinks || !yelpService.isConfigured(),
        hasYelpLinks ? 'Contains Yelp links' : 'No Yelp links found',
        !hasYelpLinks && yelpService.isConfigured()
      );

      console.log('\n📋 Sample formatted output:');
      console.log(formatted.substring(0, 300) + '...\n');
    }

    return result.success;
  } catch (error) {
    logTest('Activity Planning', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 4: Mandy Agent System Prompt
// ============================================================================
function testMandySystemPrompt() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 4: Mandy Agent System Prompt`);
  console.log(`${'='.repeat(80)}\n`);

  const systemPrompt = mandyAgent.getSystemPrompt();

  // Check for key focus areas
  const hasInPersonFocus = systemPrompt.toLowerCase().includes('in-person') || 
                           systemPrompt.toLowerCase().includes('meet in person') ||
                           systemPrompt.toLowerCase().includes('meetup');
  logTest(
    'System Prompt: In-Person Focus',
    hasInPersonFocus,
    hasInPersonFocus ? 'Focuses on in-person meetups' : 'Missing in-person meetup focus'
  );

  const hasYelpMention = systemPrompt.toLowerCase().includes('yelp');
  logTest(
    'System Prompt: Yelp Integration',
    hasYelpMention,
    hasYelpMention ? 'Mentions Yelp integration' : 'Missing Yelp mention'
  );

  const hasConciseInstruction = systemPrompt.toLowerCase().includes('concise') ||
                                systemPrompt.toLowerCase().includes('short');
  logTest(
    'System Prompt: Concise Instructions',
    hasConciseInstruction,
    hasConciseInstruction ? 'Instructs to be concise' : 'Missing concise instruction'
  );

  const hasActivityPlanning = systemPrompt.toLowerCase().includes('activity') ||
                              systemPrompt.toLowerCase().includes('restaurant') ||
                              systemPrompt.toLowerCase().includes('plan');
  logTest(
    'System Prompt: Activity Planning',
    hasActivityPlanning,
    hasActivityPlanning ? 'Includes activity planning focus' : 'Missing activity planning focus'
  );

  // Check that old humor-focused content is reduced
  const humorCount = (systemPrompt.match(/hilarious|funny|humor|joke/gi) || []).length;
  const isLessHumorFocused = humorCount < 10; // Should have less humor focus
  logTest(
    'System Prompt: Reduced Humor Focus',
    isLessHumorFocused,
    `Humor mentions: ${humorCount}`,
    !isLessHumorFocused
  );

  console.log(`\n📋 System prompt length: ${systemPrompt.length} chars`);
  console.log(`📋 First 200 chars: ${systemPrompt.substring(0, 200)}...\n`);

  return hasInPersonFocus && hasYelpMention && hasConciseInstruction;
}

// ============================================================================
// TEST 5: Welcome Message
// ============================================================================
function testWelcomeMessage() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 5: Welcome Message`);
  console.log(`${'='.repeat(80)}\n`);

  const welcomeMessage = mandyAgent.getWelcomeMessage('TestUser', false);

  const hasInPersonFocus = welcomeMessage.toLowerCase().includes('meet') ||
                           welcomeMessage.toLowerCase().includes('meetup') ||
                           welcomeMessage.toLowerCase().includes('in person');
  logTest(
    'Welcome Message: In-Person Focus',
    hasInPersonFocus,
    hasInPersonFocus ? 'Focuses on meeting in person' : 'Missing in-person focus'
  );

  const hasActivityMention = welcomeMessage.toLowerCase().includes('restaurant') ||
                            welcomeMessage.toLowerCase().includes('activity') ||
                            welcomeMessage.toLowerCase().includes('plan');
  logTest(
    'Welcome Message: Activity Planning',
    hasActivityMention,
    hasActivityMention ? 'Mentions activity planning' : 'Missing activity planning mention'
  );

  const isConcise = welcomeMessage.length < 300;
  logTest(
    'Welcome Message: Concise',
    isConcise,
    `Length: ${welcomeMessage.length} chars`,
    !isConcise
  );

  console.log(`\n📋 Welcome message:`);
  console.log(`"${welcomeMessage}"\n`);

  return hasInPersonFocus && hasActivityMention && isConcise;
}

// ============================================================================
// TEST 6: Mini App Configuration
// ============================================================================
function testMiniAppConfiguration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 6: Mini App Configuration`);
  console.log(`${'='.repeat(80)}\n`);

  const welcomeMiniApp = config.agents.mandy.miniApps?.welcomeMiniApp;

  logTest(
    'Welcome Mini App Config Exists',
    !!welcomeMiniApp,
    welcomeMiniApp ? 'Configuration found' : 'Configuration missing'
  );

  if (welcomeMiniApp) {
    const hasId = welcomeMiniApp.id && !welcomeMiniApp.id.includes('your_');
    logTest(
      'Welcome Mini App ID',
      hasId,
      hasId ? `ID: ${welcomeMiniApp.id}` : 'ID not configured or is placeholder'
    );

    const hasHandle = welcomeMiniApp.handle;
    logTest(
      'Welcome Mini App Handle',
      hasHandle,
      hasHandle ? `Handle: ${welcomeMiniApp.handle}` : 'Handle missing'
    );

    const hasName = welcomeMiniApp.name;
    logTest(
      'Welcome Mini App Name',
      hasName,
      hasName ? `Name: ${welcomeMiniApp.name}` : 'Name missing'
    );

    // Check if ID matches expected
    const expectedId = 'xs76ck6ada5ygz39jvgh85dmnd82dvw0';
    const idMatches = welcomeMiniApp.id === expectedId;
    logTest(
      'Welcome Mini App ID Matches',
      idMatches,
      idMatches 
        ? `ID matches expected: ${expectedId}`
        : `ID mismatch: expected ${expectedId}, got ${welcomeMiniApp.id}`
    );

    return hasId && hasHandle && hasName && idMatches;
  }

  return false;
}

// ============================================================================
// TEST 7: Mini App Service Integration
// ============================================================================
function testMiniAppService() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 7: Mini App Service Integration`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const apiKey = config.agents.mandy.apiKey;
    const hasApiKey = apiKey && !apiKey.includes('your_');
    
    logTest(
      'Mini App Service API Key',
      hasApiKey,
      hasApiKey ? 'API key configured' : 'API key not configured (required for mini app)',
      !hasApiKey
    );

    if (hasApiKey) {
      // Test that MiniAppService can be instantiated
      try {
        const miniAppService = new MiniAppService(apiKey);
        logTest(
          'Mini App Service Instantiation',
          !!miniAppService,
          'Service can be instantiated'
        );
        return true;
      } catch (error) {
        logTest('Mini App Service Instantiation', false, `Error: ${error.message}`);
        return false;
      }
    }

    return false;
  } catch (error) {
    logTest('Mini App Service', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 8: Webhook Integration Check
// ============================================================================
function testWebhookIntegration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 8: Webhook Integration Check`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const mandyWebhook = require('./webhooks/mandy-webhook');
    
    logTest(
      'Webhook Module Loads',
      !!mandyWebhook,
      'Mandy webhook module loaded successfully'
    );

    // Check if handleChatStarted method exists and has mini app logic
    const webhookCode = require('fs').readFileSync('./webhooks/mandy-webhook.js', 'utf8');
    const hasMiniAppLogic = webhookCode.includes('welcomeMiniApp') || 
                           webhookCode.includes('welcome-mini-app') ||
                           webhookCode.includes('xs76ck6ada5ygz39jvgh85dmnd82dvw0');
    
    logTest(
      'Webhook Has Mini App Logic',
      hasMiniAppLogic,
      hasMiniAppLogic 
        ? 'Mini app integration found in webhook'
        : 'Mini app integration not found in webhook code'
    );

    const hasSecondMessage = webhookCode.includes('second message') ||
                            webhookCode.includes('secondMessage') ||
                            (webhookCode.includes('sendMessage') && webhookCode.split('sendMessage').length > 2);
    
    logTest(
      'Webhook Has Second Message Logic',
      hasSecondMessage,
      hasSecondMessage 
        ? 'Second message logic found'
        : 'Second message logic not found'
    );

    return !!mandyWebhook && hasMiniAppLogic;
  } catch (error) {
    logTest('Webhook Integration', false, `Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 COMPREHENSIVE TEST: MANDY UPDATES`);
  console.log(`${'='.repeat(80)}\n`);

  // Run all tests
  const yelpConfigured = testYelpServiceConfiguration();
  if (yelpConfigured) {
    await testYelpSearch();
  }
  await testActivityPlanning();
  testMandySystemPrompt();
  testWelcomeMessage();
  testMiniAppConfiguration();
  testMiniAppService();
  testWebhookIntegration();

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
  const successRate = (passed / total) * 100;
  if (successRate >= 80) {
    console.log(`✅ OVERALL: All updates are working well! (${successRate.toFixed(1)}% pass rate)`);
  } else if (successRate >= 60) {
    console.log(`⚠️  OVERALL: Most updates working, but some issues to address (${successRate.toFixed(1)}% pass rate)`);
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
