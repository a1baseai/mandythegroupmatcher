const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const claudeService = require('../services/claude-service');
const zapbankRepAgent = require('../agents/zapbank-rep-agent');
const webhookHelpers = require('../services/webhook-helpers');
const zapbankRichContentTriage = require('../services/zapbank-rich-content-triage');
const config = require('../config');

/**
 * Zap Bank Representative Webhook Handler
 * Modern fintech banking advisor with AI-powered rich content delivery
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * AI-POWERED RICH CONTENT TRIAGE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Uses Claude AI to intelligently analyze conversation context and determine
 * when to send rich content (carousels, product cards, CTA buttons).
 * 
 * Benefits over hardcoded rules:
 * ✅ Understands conversation context and timing
 * ✅ Adapts to natural language variations
 * ✅ Considers user intent, not just keywords
 * ✅ Learns from multi-turn conversations
 * 
 * Available rich content types:
 * 🎠 Product Carousel - Overview of multiple Zap Bank products
 * 💳 Product Cards - Detailed cards for Treasury, Corporate Cards, or Checking
 * 🔘 CTA Buttons - Apply Now, Learn More, Schedule Demo
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
class ZapBankRepWebhook extends BaseWebhook {
  constructor() {
    // Create A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.zapbankRep);
    
    // Initialize base webhook
    super(zapbankRepAgent, client);
  }

  /**
   * Handle chat.started event - send welcome message + carousel
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleChatStarted(req, res) {
    try {
      // Log the full payload for debugging
      console.log('📦 chat.started FULL PAYLOAD:', JSON.stringify(req.body, null, 2));
      
      // Support both payload structures (newer and legacy)
      const { chatMetadata, chatId: rootChatId, user: rootUser } = req.body;
      
      const chatId = rootChatId || chatMetadata?.chatId;
      const userName = rootUser?.userName || chatMetadata?.user?.userName;
      const isAnonymous = rootUser?.isAnonymous || chatMetadata?.user?.isAnonymous;
      
      console.log('🔍 Extracted values:', { chatId, userName, isAnonymous });
      
      // Validate chatId
      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: 'Missing chatId in webhook payload'
        });
      }

      console.log(`👋 Chat started with user: ${userName || 'Anonymous'} (chatId: ${chatId})`);

      // Get welcome message from agent
      const welcomeMessage = this.agent.getWelcomeMessage(userName, isAnonymous);

      // Send both messages (skip if test mode)
      if (!webhookHelpers.isTestChat(chatId)) {
        // Send first message: Welcome text
        await this.client.sendMessage(chatId, welcomeMessage);
        console.log('✅ Welcome message sent successfully!');

        // Send second message: Product carousel
        try {
          console.log('🎠 Sending welcome carousel...');
          await this.sendWelcomeCarousel(chatId);
          console.log('✅ Welcome carousel sent successfully!');
        } catch (carouselError) {
          console.error('❌ Error sending welcome carousel:', carouselError.message);
          console.error('Stack:', carouselError.stack);
          // Don't fail the whole request if carousel fails
        }
      } else {
        console.log('⚠️  Test mode: Skipping welcome message and carousel send');
      }

      // Return success
      return res.json({
        success: true,
        event: 'chat.started',
        agent: this.agent.name,
        welcomeMessageSent: true,
        carouselSent: true,
        userName: userName || 'Anonymous'
      });

    } catch (error) {
      console.error('❌ Error handling chat.started event:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message,
        event: 'chat.started'
      });
    }
  }

  /**
   * Process Zap Bank request
   * @param {Object} data - Request data with conversation history
   * @returns {Promise<Object>} Result with response text
   */
  async processRequest(data) {
    const { userMessage, conversation, chatId } = data;

    // Add the current message to conversation
    const fullConversation = [...conversation, { role: 'user', content: String(userMessage) }];

    // Generate response using Claude with Zap Bank agent configuration
    console.log('Generating response with Claude using Zap Bank Rep agent...');
    let response;

    if (fullConversation.length > 1) {
      // Use chat with history
      response = await claudeService.chat(fullConversation, {
        ...this.agent.getGenerationOptions(),
        systemPrompt: this.agent.getSystemPrompt()
      });
    } else {
      // First message - use generateText
      response = await claudeService.generateText(
        userMessage,
        {
          ...this.agent.getGenerationOptions(),
          systemPrompt: this.agent.getSystemPrompt()
        }
      );
    }

    console.log('Generated response:', response.substring(0, 200) + '...');

    // Send rich content if relevant (async, don't block response)
    if (!webhookHelpers.isTestChat(chatId)) {
      this.sendRichContentIfRelevant(chatId, userMessage, response).catch(err => {
        console.error('Error sending rich content:', err.message);
      });
    }

    return {
      response
    };
  }

  /**
   * Analyze conversation and send appropriate rich content using AI triage
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User's message
   * @param {string} response - Generated response text
   */
  async sendRichContentIfRelevant(chatId, userMessage, response) {
    try {
      console.log('🤖 Using AI to analyze rich content opportunities...');

      // Get AI decision on whether to send rich content
      const decision = await this.analyzeWithAI(chatId, userMessage, response);

      if (!decision.shouldSend) {
        console.log(`ℹ️  AI Decision: No rich content needed - ${decision.reasoning}`);
        return;
      }

      console.log(`✨ AI Decision: Send ${decision.contentType} - ${decision.reasoning}`);

      // Get accompanying message (use AI-generated or fallback to generic)
      const accompanyingMessage = decision.accompanyingMessage || this.getDefaultAccompanyingMessage(decision.contentType);

      // Send appropriate content based on AI decision
      switch (decision.contentType) {
        case 'carousel':
          await this.sendProductCarousel(chatId, accompanyingMessage);
          break;
        
        case 'product_card':
          if (decision.productType) {
            await this.sendProductCard(chatId, decision.productType, accompanyingMessage);
          } else {
            console.warn('⚠️  Product card requested but no productType specified');
          }
          break;
        
        case 'cta_buttons':
          await this.sendCTAButtons(chatId, accompanyingMessage);
          break;
        
        default:
          console.log(`ℹ️  No action needed for contentType: ${decision.contentType}`);
      }

    } catch (error) {
      console.error('⚠️  Error in AI rich content triage:', error.message);
      // Don't throw - this is a non-critical feature
    }
  }

  /**
   * Get default accompanying message if AI doesn't provide one
   * @param {string} contentType - Type of content being sent
   * @returns {string} Default message
   */
  getDefaultAccompanyingMessage(contentType) {
    const defaults = {
      carousel: 'Check these out 👀',
      product_card: 'Here\'s what I\'m talking about 🔥',
      cta_buttons: 'Ready to take the next step? 👇'
    };
    return defaults[contentType] || 'Take a look 👇';
  }

  /**
   * Use AI to analyze conversation and decide on rich content
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User's message
   * @param {string} response - Generated response text
   * @returns {Promise<Object>} AI decision object
   */
  async analyzeWithAI(chatId, userMessage, response) {
    try {
      // Fetch conversation history for context
      const conversation = await webhookHelpers.fetchAndProcessHistory(
        this.client,
        chatId,
        this.client.agentId,
        10  // Last 10 messages for context
      );

      // Call Zap Bank rich content triage service
      return await zapbankRichContentTriage.analyze(
        conversation,
        userMessage,
        response
      );
    } catch (error) {
      console.error('❌ Error in AI analysis:', error.message);
      // Safe fallback
      return {
        shouldSend: false,
        contentType: 'none',
        productType: null,
        reasoning: 'Analysis failed'
      };
    }
  }

  /**
   * Send product carousel with top Zap Bank features
   * @param {string} chatId - Chat ID
   * @param {string} accompanyingMessage - Message to send with the carousel
   */
  async sendProductCarousel(chatId, accompanyingMessage) {
    // Get base URL from config
    const baseUrl = config.server.baseUrl || 'http://localhost:3000';
    
    const carouselItems = [
      {
        title: '💰 Treasury - 4.09% APY',
        subtitle: 'Earn market-leading returns on idle cash',
        description: 'FDIC insured, instant access',
        imageUrl: `https://images.unsplash.com/photo-1511883040705-6011fad9edfc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`
      },
      {
        title: '💳 Corporate Cards - 2% Cashback',
        subtitle: 'Maximize returns on all business spend',
        description: 'Virtual cards, spending controls, real-time tracking',
        imageUrl: `https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`
      },
      {
        title: '📊 Expense Management',
        subtitle: 'Eliminate expense reports forever',
        description: 'Auto receipt capture, real-time categorization',
        imageUrl: `https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`
      },
      {
        title: '💸 Bill Pay - $0 Fees',
        subtitle: 'Pay hundreds of vendors for free',
        description: 'No matter how many payments, zero cost',
        imageUrl: `https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`
      },
      {
        title: '🔗 Accounting Integrations',
        subtitle: 'Close books faster',
        description: 'QuickBooks, Xero, NetSuite - auto sync',
        imageUrl: `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZmluYW5jZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900`
      }
    ];

    const richContentBlocks = [{
      type: 'carousel',
      data: {
        items: carouselItems.map(item => ({
          imageUrl: item.imageUrl,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description
        })),
        interval: 4000
      },
      order: 0
    }];

    await webhookHelpers.sendResponse(
      this.client,
      chatId,
      accompanyingMessage,
      richContentBlocks
    );

    console.log('✅ Product carousel sent successfully');
  }

  /**
   * Send specific product card
   * @param {string} chatId - Chat ID
   * @param {string} productType - Type of product (treasury, corporate-cards, checking)
   * @param {string} accompanyingMessage - Message to send with the product card
   */
  async sendProductCard(chatId, productType, accompanyingMessage) {
    // Get base URL from config
    const baseUrl = config.server.baseUrl || 'http://localhost:3000';
    
    let productData;

    switch (productType) {
      case 'treasury':
        productData = {
          name: '💰 Treasury Account',
          description: 'Earn 4.09% APY on your idle cash with FDIC insurance and instant access. Perfect for parking runway or reserves.',
          price: 0,
          currency: 'USD',
          imageUrl: `https://images.unsplash.com/photo-1511883040705-6011fad9edfc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`,
          rating: 4.9
        };
        break;

      case 'corporate-cards':
        productData = {
          name: '💳 Corporate Cards',
          description: 'Up to 2% cashback on all business spend. Virtual cards, granular controls, and real-time tracking included.',
          price: 0,
          currency: 'USD',
          imageUrl: `https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`,
          rating: 4.8
        };
        break;

      case 'checking':
        productData = {
          name: '🏦 Business Checking',
          description: '$0 ACH fees and up to $75M FDIC insurance. Modern platform built for startups and businesses.',
          price: 0,
          currency: 'USD',
          imageUrl: `https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`,
          rating: 4.9
        };
        break;

      default:
        return;
    }

    const richContentBlocks = [{
      type: 'product_card',
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        imageUrl: productData.imageUrl,
        rating: productData.rating,
        inStock: true
      },
      order: 0
    }];

    await webhookHelpers.sendResponse(
      this.client,
      chatId,
      accompanyingMessage,
      richContentBlocks
    );

    console.log(`✅ ${productType} product card sent successfully`);
  }

  /**
   * Send CTA buttons for signup/learning more
   * @param {string} chatId - Chat ID
   * @param {string} accompanyingMessage - Message to send with the CTA buttons
   */
  async sendCTAButtons(chatId, accompanyingMessage) {
    // Get base URL from config
    const baseUrl = config.server.baseUrl || 'http://localhost:3000';
    
    const richContentBlocks = [{
      type: 'button_card',
      data: {
        title: '🚀 Ready to get started?',
        description: 'Open your Zap Bank account in minutes',
        imageUrl: `https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`,
        buttons: [
          {
            id: 'apply-now',
            label: '🎯 Apply Now',
            action: 'url',
            url: 'https://zapbank.com/apply',
            variant: 'primary'
          },
          {
            id: 'learn-more',
            label: '📚 Learn More',
            action: 'url',
            url: 'https://zapbank.com/features',
            variant: 'secondary'
          },
          {
            id: 'schedule-demo',
            label: '📅 Schedule Demo',
            action: 'url',
            url: 'https://zapbank.com/demo',
            variant: 'outline'
          }
        ]
      },
      order: 0
    }];

    await webhookHelpers.sendResponse(
      this.client,
      chatId,
      accompanyingMessage,
      richContentBlocks
    );

    console.log('✅ CTA buttons sent successfully');
  }

  /**
   * Send welcome carousel with 3 core banking products
   * @param {string} chatId - Chat ID
   */
  async sendWelcomeCarousel(chatId) {
    console.log(`📸 Building welcome carousel for chat ${chatId}...`);
    
    // Get base URL from config
    const baseUrl = config.server.baseUrl || 'http://localhost:3000';
    
    const carouselItems = [
      {
        title: '💰 Treasury - 4.09% APY',
        subtitle: 'Earn market-leading returns on idle cash',
        description: 'FDIC insured, instant access',
        imageUrl: `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZmluYW5jZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900`
      },
      {
        title: '💳 Corporate Cards - 2% Cashback',
        subtitle: 'Maximize returns on all business spend',
        description: 'Virtual cards, spending controls, real-time tracking',
        imageUrl: `https://images.unsplash.com/photo-1511883040705-6011fad9edfc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`
      },
      {
        title: '🏦 Business Checking - $0 Fees',
        subtitle: 'Up to $75M FDIC insurance',
        description: 'Modern platform built for startups',
        imageUrl: `https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZpbmFuY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=900`
      }
    ];

    const richContentBlocks = [{
      type: 'carousel',
      data: {
        items: carouselItems.map(item => ({
          imageUrl: item.imageUrl,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description
        })),
        interval: 4000
      },
      order: 0
    }];

    console.log(`📤 Sending carousel with ${carouselItems.length} items to webhookHelpers.sendResponse...`);
    
    await webhookHelpers.sendResponse(
      this.client,
      chatId,
      'Here\'s what we offer:',
      richContentBlocks
    );

    console.log('✅ Welcome carousel sent successfully');
  }
}

// Create and export singleton webhook handler
const zapbankRepWebhook = new ZapBankRepWebhook();
module.exports = zapbankRepWebhook.createHandler();

