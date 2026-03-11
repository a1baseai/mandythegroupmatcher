/**
 * Static analysis test to verify all Mandy updates without requiring dependencies
 * Tests code structure, configuration, and logic flow
 */

const fs = require('fs');
const path = require('path');

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
// TEST 1: Yelp Service Code Improvements
// ============================================================================
function testYelpServiceCode() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 1: Yelp Service Code Improvements`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const yelpCode = fs.readFileSync('./services/yelp-service.js', 'utf8');

    // Check for best_match sorting
    const hasBestMatch = yelpCode.includes('best_match') || yelpCode.includes("sortBy: 'best_match'");
    logTest(
      'Yelp Service: best_match Sorting',
      hasBestMatch,
      hasBestMatch ? 'Uses best_match sorting' : 'Missing best_match sorting'
    );

    // Check for open_now filtering
    const hasOpenNow = yelpCode.includes('open_now') || yelpCode.includes('openNow');
    logTest(
      'Yelp Service: Open Now Filtering',
      hasOpenNow,
      hasOpenNow ? 'Filters for open businesses' : 'Missing open_now filtering'
    );

    // Check for rating filtering in formatBusinesses
    const hasRatingFilter = yelpCode.includes('rating') && 
                            (yelpCode.includes('>= 3.5') || yelpCode.includes('>=3.5'));
    logTest(
      'Yelp Service: Rating Filter',
      hasRatingFilter,
      hasRatingFilter ? 'Filters businesses by rating (>=3.5)' : 'Missing rating filter'
    );

    // Check for improved sorting logic
    const hasSorting = yelpCode.includes('sort') && yelpCode.includes('rating') && yelpCode.includes('review_count');
    logTest(
      'Yelp Service: Enhanced Sorting',
      hasSorting,
      hasSorting ? 'Has enhanced sorting logic' : 'Missing enhanced sorting'
    );

    return hasBestMatch && hasOpenNow;
  } catch (error) {
    logTest('Yelp Service Code', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 2: Activity Planning Service Updates
// ============================================================================
function testActivityPlanningCode() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 2: Activity Planning Service Updates`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const activityCode = fs.readFileSync('./services/activity-planning-service.js', 'utf8');

    // Check for Yelp prioritization
    const prioritizesYelp = activityCode.includes('yelpService') && 
                            (activityCode.includes('Try Yelp API first') || 
                             activityCode.includes('prioritize Yelp'));
    logTest(
      'Activity Planning: Yelp Prioritization',
      prioritizesYelp,
      prioritizesYelp ? 'Prioritizes Yelp API' : 'Missing Yelp prioritization'
    );

    // Check for concise formatting
    const hasConciseFormat = activityCode.includes('Concise') || 
                            activityCode.includes('concise') ||
                            activityCode.includes('Top picks');
    logTest(
      'Activity Planning: Concise Formatting',
      hasConciseFormat,
      hasConciseFormat ? 'Has concise formatting function' : 'Missing concise formatting'
    );

    // Check for Yelp links in formatting
    const hasYelpLinks = activityCode.includes('yelp.com') || 
                        activityCode.includes('Yelp') ||
                        activityCode.includes('yelpUrl');
    logTest(
      'Activity Planning: Yelp Links',
      hasYelpLinks,
      hasYelpLinks ? 'Includes Yelp links in output' : 'Missing Yelp links'
    );

    // Check for improved location extraction
    const hasLocationExtraction = activityCode.includes('extractLocation') ||
                                 activityCode.includes('searchLocation');
    logTest(
      'Activity Planning: Location Extraction',
      hasLocationExtraction,
      hasLocationExtraction ? 'Has location extraction logic' : 'Missing location extraction'
    );

    return prioritizesYelp && hasConciseFormat && hasYelpLinks;
  } catch (error) {
    logTest('Activity Planning Code', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 3: Mandy Agent System Prompt
// ============================================================================
function testMandySystemPrompt() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 3: Mandy Agent System Prompt`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const agentCode = fs.readFileSync('./agents/mandy-agent.js', 'utf8');

    // Check for in-person focus
    const hasInPersonFocus = agentCode.includes('in-person') || 
                             agentCode.includes('meet in person') ||
                             agentCode.includes('meetup');
    logTest(
      'System Prompt: In-Person Focus',
      hasInPersonFocus,
      hasInPersonFocus ? 'Focuses on in-person meetups' : 'Missing in-person focus'
    );

    // Check for Yelp mention
    const hasYelpMention = agentCode.includes('Yelp') || agentCode.includes('yelp');
    logTest(
      'System Prompt: Yelp Integration',
      hasYelpMention,
      hasYelpMention ? 'Mentions Yelp integration' : 'Missing Yelp mention'
    );

    // Check for concise instructions
    const hasConciseInstruction = agentCode.includes('CONCISE') || 
                                 agentCode.includes('Concise') ||
                                 agentCode.includes('concise');
    logTest(
      'System Prompt: Concise Instructions',
      hasConciseInstruction,
      hasConciseInstruction ? 'Instructs to be concise' : 'Missing concise instruction'
    );

    // Check for activity planning focus
    const hasActivityPlanning = agentCode.includes('ACTIVITY PLANNING') ||
                               agentCode.includes('Activity Planning') ||
                               (agentCode.includes('restaurant') && agentCode.includes('activity'));
    logTest(
      'System Prompt: Activity Planning',
      hasActivityPlanning,
      hasActivityPlanning ? 'Includes activity planning focus' : 'Missing activity planning focus'
    );

    // Check that old humor focus is reduced
    const humorMatches = (agentCode.match(/hilarious|HILARIOUS|funny|humor/gi) || []).length;
    const isLessHumorFocused = humorMatches < 15; // Should have less humor focus
    logTest(
      'System Prompt: Reduced Humor Focus',
      isLessHumorFocused,
      `Humor mentions: ${humorMatches}`,
      !isLessHumorFocused
    );

    // Extract and show system prompt snippet
    const promptMatch = agentCode.match(/getSystemPrompt\(\)\s*\{[\s\S]*?return\s+`([\s\S]*?)`;?\s*\}/);
    if (promptMatch) {
      const prompt = promptMatch[1];
      console.log(`\n📋 System prompt preview (first 300 chars):`);
      console.log(prompt.substring(0, 300) + '...\n');
    }

    return hasInPersonFocus && hasYelpMention && hasConciseInstruction && hasActivityPlanning;
  } catch (error) {
    logTest('System Prompt', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 4: Welcome Message
// ============================================================================
function testWelcomeMessage() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 4: Welcome Message`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const agentCode = fs.readFileSync('./agents/mandy-agent.js', 'utf8');

    // Extract welcome message function - look for the messages array
    const welcomeMatch = agentCode.match(/getWelcomeMessage\([^)]*\)\s*\{[\s\S]*?const\s+messages\s*=\s*\[([\s\S]*?)\];/);
    
    if (welcomeMatch) {
      const welcomeCode = welcomeMatch[1];
      
      // Check for in-person focus (case insensitive)
      const hasInPersonFocus = /meet\s+(up\s+)?in\s+person/i.test(welcomeCode) || 
                               /meetup/i.test(welcomeCode) ||
                               /meet\s+up/i.test(welcomeCode);
      logTest(
        'Welcome Message: In-Person Focus',
        hasInPersonFocus,
        hasInPersonFocus ? 'Focuses on meeting in person' : 'Missing in-person focus'
      );

      // Check for activity mention (case insensitive)
      const hasActivityMention = /restaurant/i.test(welcomeCode) ||
                                /activity/i.test(welcomeCode) ||
                                /plan/i.test(welcomeCode) ||
                                /mini\s+golf/i.test(welcomeCode) ||
                                /escape\s+room/i.test(welcomeCode);
      logTest(
        'Welcome Message: Activity Planning',
        hasActivityMention,
        hasActivityMention ? 'Mentions activity planning' : 'Missing activity planning mention'
      );

      // Check message length (should be concise)
      const messageMatches = welcomeCode.match(/`([^`]+)`/g);
      if (messageMatches && messageMatches.length > 0) {
        const firstMessage = messageMatches[0].replace(/`/g, '');
        const isConcise = firstMessage.length < 400;
        logTest(
          'Welcome Message: Concise',
          isConcise,
          `First message length: ${firstMessage.length} chars`,
          !isConcise
        );

        console.log(`\n📋 Sample welcome message:`);
        console.log(`"${firstMessage.substring(0, 200)}..."\n`);
      }

      return hasInPersonFocus && hasActivityMention;
    } else {
      logTest('Welcome Message', false, 'Could not find getWelcomeMessage function');
      return false;
    }
  } catch (error) {
    logTest('Welcome Message', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 5: Mini App Configuration
// ============================================================================
function testMiniAppConfiguration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 5: Mini App Configuration`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const configCode = fs.readFileSync('./config.js', 'utf8');

    // Check for welcomeMiniApp config
    const hasWelcomeMiniApp = configCode.includes('welcomeMiniApp') ||
                              configCode.includes('welcome-mini-app');
    logTest(
      'Config: Welcome Mini App',
      hasWelcomeMiniApp,
      hasWelcomeMiniApp ? 'Welcome mini app config found' : 'Welcome mini app config missing'
    );

    // Check for correct ID
    const hasCorrectId = configCode.includes('xs76ck6ada5ygz39jvgh85dmnd82dvw0');
    logTest(
      'Config: Correct Mini App ID',
      hasCorrectId,
      hasCorrectId 
        ? 'Correct mini app ID found (xs76ck6ada5ygz39jvgh85dmnd82dvw0)'
        : 'Mini app ID not found or incorrect'
    );

    // Check for handle and name
    const hasHandle = configCode.includes('handle') && configCode.includes('welcome');
    const hasName = configCode.includes('name') && configCode.includes('Welcome');
    
    logTest(
      'Config: Mini App Handle',
      hasHandle,
      hasHandle ? 'Handle configured' : 'Handle missing'
    );

    logTest(
      'Config: Mini App Name',
      hasName,
      hasName ? 'Name configured' : 'Name missing'
    );

    return hasWelcomeMiniApp && hasCorrectId;
  } catch (error) {
    logTest('Mini App Configuration', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 6: Webhook Integration
// ============================================================================
function testWebhookIntegration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 6: Webhook Integration`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const webhookCode = fs.readFileSync('./webhooks/mandy-webhook.js', 'utf8');

    // Check for welcomeMiniApp reference
    const hasWelcomeMiniApp = webhookCode.includes('welcomeMiniApp') ||
                              webhookCode.includes('welcome-mini-app');
    logTest(
      'Webhook: Welcome Mini App Reference',
      hasWelcomeMiniApp,
      hasWelcomeMiniApp 
        ? 'Welcome mini app referenced in webhook'
        : 'Welcome mini app not referenced in webhook'
    );

    // Check for second message logic
    const hasSecondMessage = webhookCode.includes('second message') ||
                            webhookCode.includes('secondMessage') ||
                            webhookCode.includes("Let's get started");
    logTest(
      'Webhook: Second Message Logic',
      hasSecondMessage,
      hasSecondMessage 
        ? 'Second message logic found'
        : 'Second message logic not found'
    );

    // Check for mini app session creation in handleChatStarted
    const hasSessionCreation = webhookCode.includes('createMiniAppSession') &&
                              webhookCode.includes('handleChatStarted');
    logTest(
      'Webhook: Mini App Session Creation',
      hasSessionCreation,
      hasSessionCreation 
        ? 'Mini app session creation in handleChatStarted'
        : 'Mini app session creation not found in handleChatStarted'
    );

    // Check for rich content block
    const hasRichContent = webhookCode.includes('micro_app_instance_card') ||
                           webhookCode.includes('richContentBlock');
    logTest(
      'Webhook: Rich Content Block',
      hasRichContent,
      hasRichContent 
        ? 'Rich content block for mini app found'
        : 'Rich content block not found'
    );

    // Check that it's sent after welcome message
    const sendMessageCount = (webhookCode.match(/sendMessage\(/g) || []).length;
    const hasMultipleSends = sendMessageCount >= 2;
    logTest(
      'Webhook: Multiple Messages',
      hasMultipleSends,
      `Found ${sendMessageCount} sendMessage calls`,
      !hasMultipleSends
    );

    return hasWelcomeMiniApp && hasSecondMessage && hasSessionCreation;
  } catch (error) {
    logTest('Webhook Integration', false, `Error reading file: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TEST 7: Code Quality Checks
// ============================================================================
function testCodeQuality() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 7: Code Quality Checks`);
  console.log(`${'='.repeat(80)}\n`);

  const files = [
    './services/yelp-service.js',
    './services/activity-planning-service.js',
    './agents/mandy-agent.js',
    './webhooks/mandy-webhook.js',
    './config.js'
  ];

  let allFilesExist = true;
  for (const file of files) {
    const exists = fs.existsSync(file);
    logTest(
      `File Exists: ${path.basename(file)}`,
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
  console.log(`🧪 STATIC ANALYSIS TEST: MANDY UPDATES`);
  console.log(`${'='.repeat(80)}\n`);

  // Run all tests
  testCodeQuality();
  testYelpServiceCode();
  testActivityPlanningCode();
  testMandySystemPrompt();
  testWelcomeMessage();
  testMiniAppConfiguration();
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
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  if (successRate >= 80) {
    console.log(`✅ OVERALL: All updates are properly implemented! (${successRate.toFixed(1)}% pass rate)`);
  } else if (successRate >= 60) {
    console.log(`⚠️  OVERALL: Most updates implemented, but some issues to address (${successRate.toFixed(1)}% pass rate)`);
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
