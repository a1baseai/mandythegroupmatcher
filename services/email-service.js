/**
 * Email Service
 * Sends emails using the A1Zap API
 */

const axios = require('axios');
const config = require('../config');

class EmailService {
  constructor() {
    // Use config.js values (which already has MANDY_AGENT_ID and A1ZAP_API_KEY)
    this.mandyAgentId = process.env.MANDY_AGENT_ID || config.agents.mandy.agentId;
    this.mandyApiKey = process.env.MANDY_API_KEY || process.env.A1ZAP_API_KEY || config.agents.mandy.apiKey;
    this.a1zapApiUrl = process.env.A1ZAP_API_URL || 'https://api.a1zap.com';
    // Agent slug for constructing shareable links (e.g., "mandythematchmaker")
    this.agentSlug = process.env.MANDY_AGENT_SLUG || 'mandythematchmaker';
  }

  /**
   * Check if email service is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.mandyAgentId && this.mandyApiKey && 
              !this.mandyAgentId.includes('your_') && 
              !this.mandyApiKey.includes('your_'));
  }

  /**
   * Send email from Mandy
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} bodyHtml - HTML email body
   * @param {string} bodyText - Plain text email body
   * @param {string} replyTo - Optional reply-to address
   * @returns {Promise<Object>} { success: boolean, emailId?: string, error?: string }
   */
  async sendEmail(to, subject, bodyHtml, bodyText, replyTo = null) {
    if (!this.isConfigured()) {
      console.error('[Email Service] MANDY_AGENT_ID or MANDY_API_KEY not configured');
      return { 
        success: false, 
        error: 'Email service not configured. Please set MANDY_AGENT_ID and MANDY_API_KEY environment variables.' 
      };
    }

    try {
      const url = `${this.a1zapApiUrl}/v1/agents/${this.mandyAgentId}/emails/send`;
      
      const payload = {
        to,
        subject,
        bodyHtml,
        bodyText
      };

      if (replyTo) {
        payload.replyTo = replyTo;
      }

      console.log(`📧 [Email Service] Sending email to: ${to}`);
      console.log(`   Subject: ${subject}`);

      const response = await axios.post(url, payload, {
        headers: {
          'X-API-Key': this.mandyApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.emailId) {
        console.log(`✅ [Email Service] Email sent successfully: ${response.data.emailId}`);
        return { 
          success: true, 
          emailId: response.data.emailId,
          messageId: response.data.messageId,
          timestamp: response.data.timestamp
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error(`❌ [Email Service] Error sending email:`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        return { 
          success: false, 
          error: `API error: ${error.response.status} - ${error.response.data?.error || error.message}` 
        };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a proactive chat and extract the shareable link
   * 
   * Uses the /v1/agents/{agentId}/chats/start-proactive endpoint to create a chat,
   * then extracts the chatId and constructs the shareable link.
   * 
   * @param {Object} group1 - First group data { name, memberEmails?, ... }
   * @param {Object} group2 - Second group data { name, memberEmails?, ... }
   * @returns {Promise<Object>} { success: boolean, shareLink: string, chatId: string }
   */
  async createGroupChatLink(group1, group2) {
    if (!this.isConfigured()) {
      // Fallback to generated link if not configured
      const chatId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const shareLink = `https://www.a1zap.com/hybrid-chat/${this.agentSlug}/${chatId}`;
      return { 
        success: true, 
        shareLink: shareLink,
        chatId: chatId,
        note: 'Email service not configured, using generated link format'
      };
    }

    try {
      // Create a proactive chat via A1Zap API
      // Note: This creates a 1-on-1 chat, but we can use the chatId to construct the shareable link
      const url = `${this.a1zapApiUrl}/v1/agents/${this.mandyAgentId}/chats/start-proactive`;
      
      // Use the first email from either group as the initial participant
      // The chat can be shared/invited to others after creation
      const initialEmail = (group1.memberEmails && group1.memberEmails[0]) || 
                          (group2.memberEmails && group2.memberEmails[0]) ||
                          group1.email || 
                          group2.email;

      if (!initialEmail) {
        console.warn(`⚠️  [Email Service] No email found for initial chat creation, using fallback`);
        const chatId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const shareLink = `https://www.a1zap.com/hybrid-chat/${this.agentSlug}/${chatId}`;
        return { 
          success: true, 
          shareLink: shareLink,
          chatId: chatId,
          note: 'No email available, using generated link format'
        };
      }

      const payload = {
        userEmail: initialEmail,
        metadata: {
          matchGroup1: group1.name,
          matchGroup2: group2.name,
          matchType: 'group_match'
        }
      };

      console.log(`💬 [Email Service] Creating proactive chat for: ${group1.name} + ${group2.name}`);
      console.log(`   Initial participant: ${initialEmail}`);

      const response = await axios.post(url, payload, {
        headers: {
          'X-API-Key': this.mandyApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Extract chatId from response
      let chatId = null;
      let shareLink = null;

      if (response.data) {
        // Try different possible response formats
        chatId = response.data.chatId || 
                 response.data.chat?.chatId || 
                 response.data.id;

        // Construct shareable link based on A1Zap URL format
        // Format: https://www.a1zap.com/hybrid-chat/{agentSlug}/{chatId}
        if (chatId) {
          shareLink = `https://www.a1zap.com/hybrid-chat/${this.agentSlug}/${chatId}`;
          
          console.log(`✅ [Email Service] Chat created successfully`);
          console.log(`   Chat ID: ${chatId}`);
          console.log(`   Share Link: ${shareLink}`);
          
          return { 
            success: true, 
            shareLink: shareLink,
            chatId: chatId
          };
        }
      }

      // If we didn't get a chatId, log and use fallback
      console.warn(`⚠️  [Email Service] Chat created but no chatId in response, using fallback`);
      console.log(`   Response data:`, JSON.stringify(response.data, null, 2));
      
      const fallbackChatId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fallbackLink = `https://www.a1zap.com/hybrid-chat/${this.agentSlug}/${fallbackChatId}`;
      
      return { 
        success: true, 
        shareLink: fallbackLink,
        chatId: fallbackChatId,
        note: 'Chat created but chatId not found in response, using generated link'
      };

    } catch (error) {
      console.error(`❌ [Email Service] Error creating chat:`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
      }
      
      // Fallback: generate a shareable link even if API call fails
      const fallbackChatId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fallbackLink = `https://www.a1zap.com/hybrid-chat/${this.agentSlug}/${fallbackChatId}`;
      
      console.log(`⚠️  [Email Service] API failed, using fallback link: ${fallbackLink}`);
      return { 
        success: true, 
        shareLink: fallbackLink,
        chatId: fallbackChatId,
        warning: 'Chat creation API call failed, using generated link format'
      };
    }
  }

  /**
   * Send match notification email to both groups
   * @param {Object} group1 - First group data { name, email, memberEmails?, ... }
   * @param {Object} group2 - Second group data { name, email, memberEmails?, ... }
   * @param {Object} matchInfo - Match information { compatibility, ... }
   * @returns {Promise<Object>} { success: boolean, emails: Array, shareLink?: string }
   */
  async sendMatchNotification(group1, group2, matchInfo = {}) {
    const compatibility = matchInfo.compatibility || {};
    const compatibilityScore = compatibility.percentage || compatibility.score * 100 || 'N/A';

    // Create group chat link first
    const chatResult = await this.createGroupChatLink(group1, group2);
    const shareLink = chatResult.shareLink || 'https://www.a1zap.com';

    // Create email content
    const subject = `🎉 You've been matched with ${group2.name}!`;
    
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #A51C30;">🎉 You've Been Matched!</h1>
        <p>Hi ${group1.name},</p>
        <p>Great news! We've found a match for your group.</p>
        
        <h2 style="color: #A51C30;">Your Match: ${group2.name}</h2>
        <p>You've been matched with <strong>${group2.name}</strong>!</p>
        
        ${compatibilityScore !== 'N/A' ? `<p><strong>Compatibility Score: ${compatibilityScore}%</strong></p>` : ''}
        
        <h2 style="color: #A51C30;">Join Your Group Chat</h2>
        <p>Click the link below to join your group chat with ${group2.name} and start planning together!</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${shareLink}" style="background-color: #A51C30; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Join Group Chat →
          </a>
        </p>
        <p style="font-size: 12px; color: #666;">Or copy this link: ${shareLink}</p>
        
        <h2 style="color: #A51C30;">Next Steps</h2>
        <p>Once you join the chat, Mandy will be there to help you break the ice and plan activities together!</p>
        
        <p>Best,<br>Mandy the Matchmaker</p>
      </div>
    `;

    const bodyText = `Great news, ${group1.name}!\n\nYou've been matched with ${group2.name}!\n\n${compatibilityScore !== 'N/A' ? `Compatibility Score: ${compatibilityScore}%\n\n` : ''}Join your group chat to start planning together:\n${shareLink}\n\nOnce you join, Mandy will be there to help you break the ice and plan activities!\n\nBest,\nMandy the Matchmaker`;

    // Send to both groups
    const results = [];
    
    // Email to group 1
    if (group1.email) {
      const result1 = await this.sendEmail(group1.email, subject, bodyHtml, bodyText);
      results.push({ group: group1.name, email: group1.email, ...result1 });
    } else {
      console.warn(`⚠️  [Email Service] Group 1 (${group1.name}) has no email address`);
      results.push({ group: group1.name, email: null, success: false, error: 'No email address' });
    }

    // Email to group 2 (with swapped subject/content)
    const subject2 = `🎉 You've been matched with ${group1.name}!`;
    const bodyHtml2 = bodyHtml.replace(new RegExp(group1.name, 'g'), 'YOUR_GROUP').replace(new RegExp(group2.name, 'g'), group1.name).replace('YOUR_GROUP', group2.name);
    const bodyText2 = bodyText.replace(new RegExp(group1.name, 'g'), 'YOUR_GROUP').replace(new RegExp(group2.name, 'g'), group1.name).replace('YOUR_GROUP', group2.name);

    if (group2.email) {
      const result2 = await this.sendEmail(group2.email, subject2, bodyHtml2, bodyText2);
      results.push({ group: group2.name, email: group2.email, ...result2 });
    } else {
      console.warn(`⚠️  [Email Service] Group 2 (${group2.name}) has no email address`);
      results.push({ group: group2.name, email: null, success: false, error: 'No email address' });
    }

    const allSuccessful = results.every(r => r.success);
    return {
      success: allSuccessful,
      emails: results,
      shareLink: shareLink,
      chatId: chatResult.chatId
    };
  }
}

module.exports = new EmailService();
