const path = require('path');
const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const claudeService = require('../services/claude-service');
const willWanderForFoodAgent = require('../agents/willwanderforfood-agent');
const fileRegistry = require('../services/file-registry');
const SocialLinkExtractor = require('../services/social-link-extractor');
const webhookHelpers = require('../services/webhook-helpers');
const config = require('../config');

/**
 * Brandon Eats Webhook Handler
 * Specialized for food/restaurant data analysis with intelligent filtering
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * INTELLIGENT RESPONSE FLOW
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This webhook implements a smart, two-step filtering system to ensure users
 * only receive relevant responses and social media links:
 * 
 * 1️⃣  OFF-TOPIC TRIAGE (Temporarily disabled)
 *     • Checks if the question is food/restaurant-related before processing
 *     • Currently disabled - responds with CSV data for all questions
 * 
 * 2️⃣  SOCIAL LINK FILTERING
 *     Two-stage process to ensure social links are only sent when relevant:
 * 
 *     Stage 2A (Webhook): Quick check if response discusses specific places
 *       • Prevents links for generic responses or clarifications
 *       • Only proceeds if specific restaurant names are mentioned
 * 
 *     Stage 2B (social-link-extractor.js): Match restaurants to CSV data
 *       • Uses AI to detect which restaurants are actually discussed
 *       • Strict matching - only includes restaurants that are key subjects
 *       • Returns empty if response is generic or doesn't discuss places
 * 
 *     Examples:
 *     ✓ "Try Pho 24 in District 1" → Sends Pho 24 TikTok link
 *     ✓ "Brandon loved Banh Mi 25" → Sends Banh Mi 25 link
 *     ✗ "I can help with that!" → No links (generic response)
 *     ✗ "What would you like to know?" → No links (clarification)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
class WillWanderForFoodWebhook extends BaseWebhook {
  constructor() {
    // Create A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.willWanderForFood);

    // Initialize base webhook
    super(willWanderForFoodAgent, client);

    // Create social link extractor instance with willwanderforfood.csv
    this.socialLinkExtractor = new SocialLinkExtractor(
      path.join(__dirname, '../files/willwanderforfood.csv')
    );
  }

  /**
   * Extract webhook data and check for Easter eggs
   * @override
   */
  extractWebhookData(body) {
    const data = super.extractWebhookData(body);
    
    // Check for Easter eggs
    if (data.valid && data.userMessage) {
      const lowerMessage = data.userMessage.toLowerCase().trim();
      if (lowerMessage === 'a1') {
        data.isEasterEgg = true;
        data.easterEggType = 'a1';
      }
    }
    
    return data;
  }

  /**
   * Process Brandon Eats request
   * @param {Object} data - Request data with conversation history
   * @returns {Promise<Object>} Result with response text
   */
  async processRequest(data) {
    const { userMessage, conversation, chatId } = data;

    // Handle Easter egg: "a1" command
    if (data.isEasterEgg && data.easterEggType === 'a1') {
      return await this.handleA1EasterEgg(chatId);
    }

    // Check if base file is set for brandoneats agent
    const baseFileId = fileRegistry.getBaseFile('willwanderforfood');
    if (baseFileId) {
      const fileInfo = fileRegistry.getFileById(baseFileId);
      console.log(`📊 Using data file for Will Wander for Food: ${fileInfo?.filename || baseFileId}`);
    } else {
      console.warn('⚠️  No base file set for Will Wander for Food - responses will not have data context');
    }

    // Add the current message to conversation
    const fullConversation = [...conversation, { role: 'user', content: String(userMessage) }];

    // Generate response using Claude with Brandon Eats agent configuration
    console.log('Generating response with Claude using Will Wander for Food agent...');
    let response;

    if (fullConversation.length > 1) {
      // Use chat with history
      response = await claudeService.chatWithBaseFile(fullConversation, {
        ...this.agent.getGenerationOptions(),
        systemPrompt: this.agent.getSystemPrompt(),
        agentName: 'willwanderforfood'
      });
    } else {
      // First message - use generateWithBaseFile
      response = await claudeService.generateWithBaseFile(
        userMessage,
        {
          ...this.agent.getGenerationOptions(),
          systemPrompt: this.agent.getSystemPrompt(),
          agentName: 'willwanderforfood'
        }
      );
    }

    console.log('Generated response:', response.substring(0, 200) + '...');

    // Extract and send social media links as follow-up (async, don't block response)
    if (!webhookHelpers.isTestChat(chatId)) {
      this.sendSocialLinksIfRelevant(chatId, response).catch(err => {
        console.error('Error sending social links:', err.message);
      });
    }

    return {
      response,
      baseFile: baseFileId ? fileRegistry.getFileById(baseFileId)?.filename : null
    };
  }

  /**
   * Handle the "a1" Easter egg command
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Result
   */
  async handleA1EasterEgg(chatId) {
    console.log('🎉 A1 Easter egg triggered! Sending social share rich content...');

    const socialLinks = [
      { platform: 'instagram', url: 'https://www.instagram.com/reel/DQI4QE8jHiL/' },
      { platform: 'tiktok', url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144' },
      { platform: 'youtube', url: 'https://www.youtube.com/shorts/ToobPQS6_ZI' }
    ];

    const richContentBlocks = webhookHelpers.createSocialShareBlocks(socialLinks);

    // Send rich content message (if not test mode)
    if (!webhookHelpers.isTestChat(chatId)) {
      await webhookHelpers.sendResponse(
        this.client,
        chatId,
        '🔥 Check out our viral content across all platforms!',
        richContentBlocks
      );
    }

    console.log('✅ A1 Easter egg: Social shares sent successfully!');

    return {
      response: '🔥 Check out our viral content across all platforms!',
      richContent: true,
      easterEgg: 'a1'
    };
  }

  /**
   * Check if response discusses specific restaurants and send social links
   * This runs asynchronously after the main response is sent
   * @param {string} chatId - Chat ID
   * @param {string} response - Generated response text
   */
  async sendSocialLinksIfRelevant(chatId, response) {
    try {
      console.log('🔍 Checking if response discusses specific restaurants...');

      // Stage 2A: Pre-check - Does this response actually discuss specific restaurants/places?
      const restaurantCheckPrompt = `Analyze this response and determine if it discusses specific restaurant names or place names.

Response: "${response}"

Does this response mention or discuss specific restaurants, cafes, or food places by name?
Answer ONLY "YES" or "NO".

YES = response talks about specific named restaurants/places
NO = response is generic, just a greeting, clarification, or doesn't mention specific places

Answer:`;

      const restaurantCheck = await claudeService.generateText(restaurantCheckPrompt, {
        temperature: 0.1,
        maxTokens: 10
      });

      const hasSpecificRestaurants = restaurantCheck.trim().toUpperCase().includes('YES');

      if (!hasSpecificRestaurants) {
        console.log('ℹ️  Response does not discuss specific restaurants - skipping social links');
        return;
      }

      console.log('✅ Response discusses specific restaurants - checking for social links...');
      const relevantLinks = await this.socialLinkExtractor.extractRelevantSocialLinks(response);

      if (relevantLinks && relevantLinks.length > 0) {
        console.log(`📹 Found ${relevantLinks.length} relevant TikTok links, sending follow-up message...`);

        // Check if this is an alternative suggestion (has contextMessage)
        const isAlternativeSuggestion = relevantLinks[0]?.contextMessage;

        // Create rich content blocks for TikTok links
        const richContentBlocks = webhookHelpers.createSocialShareBlocks(relevantLinks, 'tiktok');

        // Send follow-up message with social embeds
        let socialMessage;
        if (isAlternativeSuggestion) {
          // Use the context message to explain why we're showing alternatives
          const contextMsg = relevantLinks[0].contextMessage;
          socialMessage = relevantLinks.length === 1
            ? `💡 ${contextMsg}\n\n🎥 Check out ${relevantLinks[0].name}:`
            : `💡 ${contextMsg}\n\n🎥 Here are ${relevantLinks.length} videos:`;
        } else {
          // Standard message for direct matches
          socialMessage = relevantLinks.length === 1
            ? `🎥 Here's a video about ${relevantLinks[0].name}!`
            : `🎥 Here are ${relevantLinks.length} videos about these places!`;
        }

        await webhookHelpers.sendResponse(
          this.client,
          chatId,
          socialMessage,
          richContentBlocks
        );

        console.log('✅ Social media links sent as follow-up message');
      } else {
        console.log('ℹ️  No relevant social links found for this response');
      }
    } catch (error) {
      console.error('⚠️  Error extracting/sending social links:', error.message);
      // Don't throw - this is a non-critical feature
    }
  }
}

// Create and export singleton webhook handler
const willWanderForFoodWebhook = new WillWanderForFoodWebhook();
module.exports = willWanderForFoodWebhook.createHandler();
