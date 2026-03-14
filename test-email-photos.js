/**
 * Test: Verify that match notification emails include photos of both groups
 */

const { notifyBothGroupsOfMatch, validateGroupPhotos, getBestPhotoUrl } = require('./services/mandy-email-helpers');

// Mock email service for testing
let sentEmails = [];

const mockEmailService = {
  async sendEmail(email, subject, html, text) {
    sentEmails.push({
      email,
      subject,
      html,
      text,
      timestamp: new Date().toISOString()
    });
    return { success: true, emailId: `test_email_${Date.now()}` };
  }
};

// Test data with photos
const group1WithPhoto = {
  groupName: 'Luke and Friends',
  email: 'luke@example.com',
  groupPhotoUrl: 'https://example.com/photos/luke-group.jpg',
  groupPhotoVariantUrls: ['https://example.com/photos/luke-variant1.jpg', 'https://example.com/photos/luke-variant2.jpg']
};

const group2WithPhoto = {
  groupName: "Sarah's Squad",
  email: 'sarah@example.com',
  groupPhotoUrl: 'https://example.com/photos/sarah-group.jpg',
  groupPhotoVariants: [
    { url: 'https://example.com/photos/sarah-variant1.jpg' },
    { url: 'https://example.com/photos/sarah-variant2.jpg' }
  ]
};

const group1WithoutPhoto = {
  groupName: 'No Photo Group',
  email: 'nophoto@example.com'
};

// Test results
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
// TEST 1: Photo Extraction
// ============================================================================
function testPhotoExtraction() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 1: Photo Extraction`);
  console.log(`${'='.repeat(80)}\n`);

  // Test getBestPhotoUrl with variant URLs
  const photo1 = getBestPhotoUrl(group1WithPhoto);
  logTest('Extract Photo from Variant URLs', 
    photo1 === 'https://example.com/photos/luke-variant1.jpg',
    photo1 === 'https://example.com/photos/luke-variant1.jpg' 
      ? `Found: ${photo1}` 
      : `Expected variant URL, got: ${photo1}`);

  // Test getBestPhotoUrl with variant objects
  const photo2 = getBestPhotoUrl(group2WithPhoto);
  logTest('Extract Photo from Variant Objects',
    photo2 === 'https://example.com/photos/sarah-variant1.jpg',
    photo2 === 'https://example.com/photos/sarah-variant1.jpg'
      ? `Found: ${photo2}`
      : `Expected variant object URL, got: ${photo2}`);

  // Test getBestPhotoUrl fallback to groupPhotoUrl
  const groupWithOnlyOriginal = {
    groupName: 'Original Only',
    groupPhotoUrl: 'https://example.com/photos/original.jpg'
  };
  const photo3 = getBestPhotoUrl(groupWithOnlyOriginal);
  logTest('Extract Photo from Original URL',
    photo3 === 'https://example.com/photos/original.jpg',
    photo3 === 'https://example.com/photos/original.jpg'
      ? `Found: ${photo3}`
      : `Expected original URL, got: ${photo3}`);

  // Test getBestPhotoUrl with no photos
  const photo4 = getBestPhotoUrl(group1WithoutPhoto);
  logTest('Handle Missing Photos',
    photo4 === null,
    photo4 === null
      ? 'Correctly returns null for missing photos'
      : `Expected null, got: ${photo4}`);

  // Test validation
  const validation1 = validateGroupPhotos(group1WithPhoto, 'Group 1');
  logTest('Validate Group with Photos',
    validation1.isValid === true && validation1.extractedPhotoUrl !== null,
    validation1.isValid
      ? `Valid: ${validation1.extractedPhotoUrl}`
      : 'Group should have valid photo');

  const validation2 = validateGroupPhotos(group1WithoutPhoto, 'Group No Photo');
  logTest('Validate Group without Photos',
    validation2.isValid === false,
    !validation2.isValid
      ? 'Correctly identifies missing photos'
      : 'Should identify missing photos');
}

// ============================================================================
// TEST 2: Email HTML Generation
// ============================================================================
function testEmailHtmlGeneration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 2: Email HTML Generation`);
  console.log(`${'='.repeat(80)}\n`);

  const { generateMatchEmailHtml } = require('./services/mandy-email-helpers');

  // Test HTML with photos
  const htmlWithPhotos = generateMatchEmailHtml({
    groupName: 'Luke and Friends',
    matchedGroupName: "Sarah's Squad",
    groupPhotoUrl: 'https://example.com/photos/luke.jpg',
    matchedGroupPhotoUrl: 'https://example.com/photos/sarah.jpg'
  });

  const hasGroup1Photo = htmlWithPhotos.includes('https://example.com/photos/luke.jpg');
  logTest('HTML Includes Group 1 Photo',
    hasGroup1Photo,
    hasGroup1Photo
      ? 'Group 1 photo URL found in HTML'
      : 'Group 1 photo URL missing from HTML');

  const hasGroup2Photo = htmlWithPhotos.includes('https://example.com/photos/sarah.jpg');
  logTest('HTML Includes Group 2 Photo',
    hasGroup2Photo,
    hasGroup2Photo
      ? 'Group 2 photo URL found in HTML'
      : 'Group 2 photo URL missing from HTML');

  // Check for side-by-side layout
  const hasSideBySide = htmlWithPhotos.includes('display: inline-block') || 
                        htmlWithPhotos.includes('width:') ||
                        htmlWithPhotos.includes('table');
  logTest('HTML Has Side-by-Side Layout',
    hasSideBySide,
    hasSideBySide
      ? 'Side-by-side layout detected'
      : 'Side-by-side layout not found');

  // Test HTML without photos (should use placeholders)
  const htmlWithoutPhotos = generateMatchEmailHtml({
    groupName: 'Group 1',
    matchedGroupName: 'Group 2',
    groupPhotoUrl: null,
    matchedGroupPhotoUrl: null
  });

  const hasPlaceholder = htmlWithoutPhotos.includes('placeholder') || 
                        htmlWithoutPhotos.includes('Group+Photo');
  logTest('HTML Uses Placeholder for Missing Photos',
    hasPlaceholder,
    hasPlaceholder
      ? 'Placeholder image detected'
      : 'Placeholder image missing');
}

// ============================================================================
// TEST 3: Email Sending with Photos
// ============================================================================
async function testEmailSending() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 3: Email Sending with Photos`);
  console.log(`${'='.repeat(80)}\n`);

  // Reset sent emails
  sentEmails = [];

  // Send emails
  const results = await notifyBothGroupsOfMatch(
    group1WithPhoto,
    group2WithPhoto,
    mockEmailService.sendEmail.bind(mockEmailService)
  );

  // Check that emails were sent
  logTest('Emails Sent',
    sentEmails.length === 2,
    sentEmails.length === 2
      ? `Sent ${sentEmails.length} emails`
      : `Expected 2 emails, got ${sentEmails.length}`);

  // Check first email (to group1)
  if (sentEmails.length > 0) {
    const email1 = sentEmails[0];
    const hasGroup1PhotoInEmail1 = email1.html.includes('https://example.com/photos/luke') ||
                                   email1.html.includes('luke-variant1.jpg');
    logTest('Email 1 Includes Group 1 Photo',
      hasGroup1PhotoInEmail1,
      hasGroup1PhotoInEmail1
        ? 'Group 1 photo found in email 1'
        : 'Group 1 photo missing from email 1');

    const hasGroup2PhotoInEmail1 = email1.html.includes('https://example.com/photos/sarah') ||
                                   email1.html.includes('sarah-variant1.jpg');
    logTest('Email 1 Includes Group 2 Photo',
      hasGroup2PhotoInEmail1,
      hasGroup2PhotoInEmail1
        ? 'Group 2 photo found in email 1'
        : 'Group 2 photo missing from email 1');

    const hasCorrectSubject1 = email1.subject.includes("Sarah's Squad");
    logTest('Email 1 Has Correct Subject',
      hasCorrectSubject1,
      hasCorrectSubject1
        ? `Subject: ${email1.subject}`
        : `Wrong subject: ${email1.subject}`);
  }

  // Check second email (to group2)
  if (sentEmails.length > 1) {
    const email2 = sentEmails[1];
    const hasGroup2PhotoInEmail2 = email2.html.includes('https://example.com/photos/sarah') ||
                                   email2.html.includes('sarah-variant1.jpg');
    logTest('Email 2 Includes Group 2 Photo',
      hasGroup2PhotoInEmail2,
      hasGroup2PhotoInEmail2
        ? 'Group 2 photo found in email 2'
        : 'Group 2 photo missing from email 2');

    const hasGroup1PhotoInEmail2 = email2.html.includes('https://example.com/photos/luke') ||
                                   email2.html.includes('luke-variant1.jpg');
    logTest('Email 2 Includes Group 1 Photo',
      hasGroup1PhotoInEmail2,
      hasGroup1PhotoInEmail2
        ? 'Group 1 photo found in email 2'
        : 'Group 1 photo missing from email 2');

    const hasCorrectSubject2 = email2.subject.includes('Luke and Friends');
    logTest('Email 2 Has Correct Subject',
      hasCorrectSubject2,
      hasCorrectSubject2
        ? `Subject: ${email2.subject}`
        : `Wrong subject: ${email2.subject}`);
  }

  // Check results
  logTest('All Emails Successful',
    results.every(r => r.success),
    results.every(r => r.success)
      ? 'All emails sent successfully'
      : `Some emails failed: ${JSON.stringify(results)}`);
}

// ============================================================================
// TEST 4: Integration Test
// ============================================================================
async function testIntegration() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST 4: Integration Test`);
  console.log(`${'='.repeat(80)}\n`);

  // Reset sent emails
  sentEmails = [];

  // Test with real-world scenario
  const realGroup1 = {
    groupName: 'The Explorers',
    email: 'explorers@example.com',
    groupPhotoVariantUrls: ['https://example.com/ai-generated/explorers-v1.jpg']
  };

  const realGroup2 = {
    groupName: 'The Adventurers',
    email: 'adventurers@example.com',
    groupPhotoUrl: 'https://example.com/photos/adventurers.jpg'
  };

  const results = await notifyBothGroupsOfMatch(
    realGroup1,
    realGroup2,
    mockEmailService.sendEmail.bind(mockEmailService)
  );

  // Verify both emails have both photos
  if (sentEmails.length === 2) {
    const email1 = sentEmails[0];
    const email2 = sentEmails[1];

    // Email 1 should have both photos
    const email1HasBoth = email1.html.includes('explorers') && email1.html.includes('adventurers');
    logTest('Email 1 Has Both Group Photos',
      email1HasBoth,
      email1HasBoth
        ? 'Both photos found in email 1'
        : 'Missing photos in email 1');

    // Email 2 should have both photos
    const email2HasBoth = email2.html.includes('explorers') && email2.html.includes('adventurers');
    logTest('Email 2 Has Both Group Photos',
      email2HasBoth,
      email2HasBoth
        ? 'Both photos found in email 2'
        : 'Missing photos in email 2');
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST: Email Photos Integration`);
  console.log(`${'='.repeat(80)}\n`);

  testPhotoExtraction();
  testEmailHtmlGeneration();
  await testEmailSending();
  await testIntegration();

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

  // Overall assessment
  console.log(`${'='.repeat(80)}`);
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  if (successRate >= 90) {
    console.log(`✅ OVERALL: Email photos integration is working! (${successRate.toFixed(1)}% pass rate)`);
  } else if (successRate >= 70) {
    console.log(`⚠️  OVERALL: Most tests passing, but some issues (${successRate.toFixed(1)}% pass rate)`);
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
