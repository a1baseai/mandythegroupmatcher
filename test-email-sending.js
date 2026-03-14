/**
 * Test script to verify email sending functionality
 * This checks if emails are configured and would be sent during matching
 */

const emailService = require('./services/email-service');
const groupProfileStorage = require('./services/group-profile-storage');

async function testEmailSending() {
  console.log('🧪 Testing Email Sending Functionality\n');
  
  // 1. Check if email service is configured
  console.log('1️⃣ Checking email service configuration...');
  const isConfigured = emailService.isConfigured();
  console.log(`   Configured: ${isConfigured ? '✅ YES' : '❌ NO'}`);
  
  if (!isConfigured) {
    console.log('\n⚠️  Email service is NOT configured!');
    console.log('   Required environment variables:');
    console.log('   - MANDY_AGENT_ID or config.agents.mandy.agentId');
    console.log('   - MANDY_API_KEY or A1ZAP_API_KEY or config.agents.mandy.apiKey');
    console.log('\n   Current values:');
    console.log(`   - Agent ID: ${emailService.mandyAgentId || 'NOT SET'}`);
    console.log(`   - API Key: ${emailService.mandyApiKey ? '***' + emailService.mandyApiKey.slice(-4) : 'NOT SET'}`);
    return;
  }
  
  console.log(`   ✅ Agent ID: ${emailService.mandyAgentId}`);
  console.log(`   ✅ API Key: ${emailService.mandyApiKey ? '***' + emailService.mandyApiKey.slice(-4) : 'NOT SET'}`);
  console.log(`   ✅ Agent Slug: ${emailService.agentSlug}`);
  
  // 2. Check if there are groups with emails
  console.log('\n2️⃣ Checking stored groups...');
  const allGroups = groupProfileStorage.getAllProfiles();
  console.log(`   Total groups: ${allGroups.length}`);
  
  if (allGroups.length === 0) {
    console.log('   ⚠️  No groups found. Cannot test email sending.');
    return;
  }
  
  // Show groups with their email info
  console.log('\n   Groups:');
  allGroups.forEach((group, index) => {
    const hasEmail = !!(group.email || group.contactEmail);
    const emailCount = (group.memberEmails || group.emails || []).length;
    console.log(`   ${index + 1}. ${group.groupName || 'Unnamed'}`);
    console.log(`      Email: ${hasEmail ? (group.email || group.contactEmail) : '❌ MISSING'}`);
    console.log(`      Member emails: ${emailCount}`);
  });
  
  // 3. Check if matching endpoint would send emails
  console.log('\n3️⃣ Simulating match email sending...');
  
  if (allGroups.length < 2) {
    console.log('   ⚠️  Need at least 2 groups to test matching');
    return;
  }
  
  // Get first two groups
  const group1 = allGroups[0];
  const group2 = allGroups[1];
  
  console.log(`   Group 1: ${group1.groupName}`);
  console.log(`   Group 1 Email: ${group1.email || group1.contactEmail || '❌ MISSING'}`);
  console.log(`   Group 2: ${group2.groupName}`);
  console.log(`   Group 2 Email: ${group2.email || group2.contactEmail || '❌ MISSING'}`);
  
  // Check if both groups have emails
  const group1Email = group1.email || group1.contactEmail;
  const group2Email = group2.email || group2.contactEmail;
  
  if (!group1Email || !group2Email) {
    console.log('\n   ⚠️  Cannot test: One or both groups are missing email addresses');
    console.log(`   Group 1 email: ${group1Email ? '✅' : '❌'}`);
    console.log(`   Group 2 email: ${group2Email ? '✅' : '❌'}`);
    return;
  }
  
  // 4. Test email sending (dry run - don't actually send)
  console.log('\n4️⃣ Email sending would work:');
  console.log(`   ✅ Both groups have email addresses`);
  console.log(`   ✅ Email service is configured`);
  console.log(`   ✅ Ready to send match notifications`);
  
  console.log('\n📧 To actually test email sending:');
  console.log('   1. Visit: https://mandythegroupmatcher-production.up.railway.app/api/match');
  console.log('   2. Check the response for "emailStatus"');
  console.log('   3. Check Railway logs for email sending confirmation');
  
  // 5. Check the actual matching endpoint response format
  console.log('\n5️⃣ Expected response format from /api/match:');
  console.log('   {');
  console.log('     "success": true,');
  console.log('     "emailStatus": {');
  console.log('       "sent": true/false,');
  console.log('       "emails": [');
  console.log('         { "group": "...", "email": "...", "success": true/false }');
  console.log('       ],');
  console.log('       "shareLink": "https://...",');
  console.log('       "chatId": "..."');
  console.log('     }');
  console.log('   }');
}

// Run the test
testEmailSending().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
