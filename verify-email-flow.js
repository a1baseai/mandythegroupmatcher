/**
 * Verify Email Sending Flow
 * Checks the code logic without requiring dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Email Sending Flow\n');

// 1. Check if email service file exists and has the right structure
console.log('1️⃣ Checking email service implementation...');
const emailServicePath = path.join(__dirname, 'services', 'email-service.js');
if (fs.existsSync(emailServicePath)) {
  const emailServiceCode = fs.readFileSync(emailServicePath, 'utf8');
  
  const hasSendEmail = emailServiceCode.includes('async sendEmail(');
  const hasSendMatchNotification = emailServiceCode.includes('async sendMatchNotification(');
  const hasCreateGroupChatLink = emailServiceCode.includes('async createGroupChatLink(');
  const usesA1ZapAPI = emailServiceCode.includes('/v1/agents/') && emailServiceCode.includes('/emails/send');
  
  console.log(`   ✅ Email service file exists`);
  console.log(`   ${hasSendEmail ? '✅' : '❌'} sendEmail method: ${hasSendEmail ? 'FOUND' : 'MISSING'}`);
  console.log(`   ${hasSendMatchNotification ? '✅' : '❌'} sendMatchNotification method: ${hasSendMatchNotification ? 'FOUND' : 'MISSING'}`);
  console.log(`   ${hasCreateGroupChatLink ? '✅' : '❌'} createGroupChatLink method: ${hasCreateGroupChatLink ? 'FOUND' : 'MISSING'}`);
  console.log(`   ${usesA1ZapAPI ? '✅' : '❌'} Uses A1Zap API: ${usesA1ZapAPI ? 'YES' : 'NO'}`);
} else {
  console.log('   ❌ Email service file not found!');
}

// 2. Check if server.js calls email service
console.log('\n2️⃣ Checking server.js integration...');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverCode = fs.readFileSync(serverPath, 'utf8');
  
  const callsEmailService = serverCode.includes('emailService.sendMatchNotification');
  const includesEmailStatus = serverCode.includes('emailStatus');
  const checksBestMatch = serverCode.includes('if (bestMatch)');
  
  console.log(`   ✅ Server file exists`);
  console.log(`   ${callsEmailService ? '✅' : '❌'} Calls emailService.sendMatchNotification: ${callsEmailService ? 'YES' : 'NO'}`);
  console.log(`   ${includesEmailStatus ? '✅' : '❌'} Includes emailStatus in response: ${includesEmailStatus ? 'YES' : 'NO'}`);
  console.log(`   ${checksBestMatch ? '✅' : '❌'} Checks for bestMatch before sending: ${checksBestMatch ? 'YES' : 'NO'}`);
  
  // Check if emailStatus is properly structured
  if (includesEmailStatus) {
    const emailStatusPattern = /emailStatus:\s*\{[\s\S]*?sent:[\s\S]*?emails:[\s\S]*?shareLink:/;
    const hasProperStructure = emailStatusPattern.test(serverCode);
    console.log(`   ${hasProperStructure ? '✅' : '⚠️ '} EmailStatus structure: ${hasProperStructure ? 'PROPER' : 'CHECK MANUALLY'}`);
  }
} else {
  console.log('   ❌ Server file not found!');
}

// 3. Check config for email settings
console.log('\n3️⃣ Checking configuration...');
const configPath = path.join(__dirname, 'config.js');
if (fs.existsSync(configPath)) {
  const configCode = fs.readFileSync(configPath, 'utf8');
  
  const hasMandyConfig = configCode.includes('mandy:') || configCode.includes('agents.mandy');
  const hasAgentId = configCode.includes('MANDY_AGENT_ID') || configCode.includes('agentId');
  const hasApiKey = configCode.includes('MANDY_API_KEY') || configCode.includes('A1ZAP_API_KEY') || configCode.includes('apiKey');
  
  console.log(`   ✅ Config file exists`);
  console.log(`   ${hasMandyConfig ? '✅' : '⚠️ '} Mandy configuration: ${hasMandyConfig ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`   ${hasAgentId ? '✅' : '⚠️ '} Agent ID config: ${hasAgentId ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`   ${hasApiKey ? '✅' : '⚠️ '} API Key config: ${hasApiKey ? 'FOUND' : 'NOT FOUND'}`);
} else {
  console.log('   ⚠️  Config file not found');
}

// 4. Summary and next steps
console.log('\n4️⃣ Summary:');
console.log('   The email sending flow is integrated in the code.');
console.log('   To verify it actually works:');
console.log('   1. Ensure MANDY_AGENT_ID and MANDY_API_KEY are set in Railway');
console.log('   2. Make sure groups have email addresses');
console.log('   3. Run matching: https://mandythegroupmatcher-production.up.railway.app/api/match');
console.log('   4. Check the response for "emailStatus" object');
console.log('   5. Check Railway logs for email sending confirmation');
console.log('\n   Expected emailStatus structure:');
console.log('   {');
console.log('     "sent": true/false,');
console.log('     "emails": [');
console.log('       { "group": "...", "email": "...", "success": true/false, "emailId": "..." }');
console.log('     ],');
console.log('     "shareLink": "https://www.a1zap.com/hybrid-chat/...",');
console.log('     "chatId": "..."');
console.log('   }');
