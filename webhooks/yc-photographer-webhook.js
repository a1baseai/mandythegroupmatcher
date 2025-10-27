const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const geminiService = require('../services/gemini-service');
const imageStorage = require('../services/image-storage');
const ycPhotographerAgent = require('../agents/yc-photographer-agent');
const webhookHelpers = require('../services/webhook-helpers');
const conversationCache = require('../services/conversation-cache');
const config = require('../config');
const fs = require('fs');
const path = require('path');

/**
 * YC Photographer webhook handler with multi-turn image editing support
 * Uses Gemini's image generation to place people in YC settings
 * 
 * Key Features:
 * - Multi-turn conversation support
 * - Image context tracking (from current message, history, or cache)
 * - Two modes: IMAGE mode (generate edited image) and TEXT mode (conversational)
 * - Automatic style detection (YC sign or orange background)
 * - Automatic image storage and delivery
 */
class YCPhotographerWebhook extends BaseWebhook {
  constructor() {
    // Create A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.ycPhotographer);
    
    // Initialize base webhook
    super(ycPhotographerAgent, client);
    
    // Reference image configuration
    // Support both old and new environment variable names for backward compatibility
    this.referenceImagesEnabled = (
      process.env.YC_USE_REFERENCE_IMAGES === 'true' || 
      process.env.YC_SEND_REFERENCE_IMAGES === 'true'
    );
    this.sendReferenceToUser = process.env.YC_SEND_REFERENCE_TO_USER !== 'false'; // Default: true
    this.referenceImagesDir = path.join(__dirname, '..', 'reference-images');
    
    console.log(`🎨 Reference Images Config:`);
    console.log(`   - Use in AI: ${this.referenceImagesEnabled}`);
    console.log(`   - Send to user: ${this.sendReferenceToUser}`);
  }
  
  /**
   * Get reference image URL for a given style
   * @param {string} style - 'sign' or 'orange'
   * @returns {string|null} Public URL of reference image or null if not found
   */
  getReferenceImageUrl(style) {
    if (!this.referenceImagesEnabled) {
      return null;
    }
    
    // Map style to filename
    const referenceFiles = {
      'sign': 'yc-sign-reference.jpg',
      'orange': 'yc-orange-reference.jpg'
    };
    
    const filename = referenceFiles[style];
    if (!filename) {
      return null;
    }
    
    // Check if file exists
    const filePath = path.join(this.referenceImagesDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Reference image not found: ${filePath}`);
      return null;
    }
    
    // Generate public URL
    const baseUrl = config.server.baseUrl || `http://localhost:${config.server.port}`;
    return `${baseUrl}/reference-images/${filename}`;
  }
  
  /**
   * Send reference image for the detected style
   * @param {string} chatId - Chat ID
   * @param {string} style - 'sign' or 'orange'
   * @returns {Promise<void>}
   */
  async sendReferenceImage(chatId, style) {
    const referenceUrl = this.getReferenceImageUrl(style);
    
    if (!referenceUrl) {
      console.log(`⚠️  No reference image available for style: ${style}`);
      return;
    }
    
    const styleNames = {
      'sign': 'YC Sign Entrance',
      'orange': 'YC Orange Background'
    };
    
    const message = `📸 Here's what the ${styleNames[style]} looks like! I'll place you in this setting.`;
    
    console.log(`📤 Sending reference image: ${style} (${referenceUrl})`);
    
    try {
      await this.client.sendMediaMessage(
        chatId,
        message,
        referenceUrl,
        { contentType: 'image/jpeg' }
      );
      console.log('✅ Reference image sent successfully');
    } catch (error) {
      console.error('❌ Failed to send reference image:', error.message);
      // Don't throw - reference image is optional
    }
  }

  /**
   * Should include images in conversation history
   * @override
   */
  shouldIncludeImagesInHistory() {
    return true;
  }

  /**
   * Get history limit for YC photographer conversations (needs more context)
   * @override
   */
  getHistoryLimit() {
    return 20;
  }

  /**
   * Process YC Photographer request
   * @param {Object} data - Request data with conversation history
   * @returns {Promise<Object>} Result with response text and optional image
   */
  async processRequest(data) {
    const { userMessage, imageUrl, conversation, chatId } = data;

    // Cache incoming content FIRST (before trying to fetch history)
    if (imageUrl) {
      conversationCache.storeImage(chatId, imageUrl, userMessage);
    }
    if (userMessage && userMessage !== '[Image]') {
      conversationCache.storeRequest(chatId, userMessage);
    }

    // Determine effective image URL (current message, history, or cache)
    const { effectiveImageUrl, imageSource } = this.findEffectiveImage(imageUrl, conversation, chatId);

    // Extract previous style request (from history or cache)
    const previousRequest = this.findPreviousRequest(conversation, chatId);

    if (previousRequest) {
      console.log(`📸 Previous YC photo request: "${previousRequest}"`);
    }

    // Check if we have an image to work with
    if (effectiveImageUrl) {
      // IMAGE MODE: Generate edited image using Gemini
      return await this.processImageMode(
        effectiveImageUrl,
        userMessage,
        imageUrl,
        conversation,
        previousRequest,
        chatId
      );
    } else {
      // TEXT MODE: No image available - use conversational AI
      return await this.processTextMode(userMessage, conversation, chatId);
    }
  }

  /**
   * Find the effective image URL from various sources
   * @param {string|null} currentImageUrl - Image from current message
   * @param {Array} conversation - Conversation history
   * @param {string} chatId - Chat ID
   * @returns {Object} { effectiveImageUrl, imageSource }
   */
  findEffectiveImage(currentImageUrl, conversation, chatId) {
    let effectiveImageUrl = currentImageUrl;
    let imageSource = currentImageUrl ? 'current_message' : null;

    if (!effectiveImageUrl) {
      // Try history first
      effectiveImageUrl = webhookHelpers.findRecentImage(conversation, 5);
      if (effectiveImageUrl) {
        imageSource = 'history';
        console.log(`📸 Using recent image from history`);
      }
    }

    if (!effectiveImageUrl) {
      // Fall back to cache if history didn't help
      effectiveImageUrl = conversationCache.getRecentImage(chatId, 5);
      if (effectiveImageUrl) {
        imageSource = 'cache';
        console.log(`📸 Using recent image from cache (history unavailable)`);
      }
    }

    return { effectiveImageUrl, imageSource };
  }

  /**
   * Find previous YC photo request from history or cache
   * @param {Array} conversation - Conversation history
   * @param {string} chatId - Chat ID
   * @returns {string|null} Previous request or null
   */
  findPreviousRequest(conversation, chatId) {
    // Extract YC photo-related requests from conversation
    let previousRequest = null;
    
    if (conversation.length > 0) {
      const recentMessages = conversation.slice(-10);
      const ycRequests = recentMessages
        .filter(msg => msg.role === 'user' && msg.content && msg.content.trim() !== '[Image]')
        .map(msg => msg.content.trim())
        .filter(content => {
          const lowerContent = content.toLowerCase();
          return lowerContent.includes('yc') || 
                 lowerContent.includes('combinator') || 
                 lowerContent.includes('sign') || 
                 lowerContent.includes('orange') || 
                 lowerContent.includes('background') ||
                 content.length > 15;
        });
      
      if (ycRequests.length > 0) {
        previousRequest = ycRequests[ycRequests.length - 1];
      }
    }

    if (!previousRequest) {
      // Fall back to cache if history didn't provide context
      previousRequest = conversationCache.getRecentRequest(chatId, 5);
      if (previousRequest) {
        console.log(`📸 Using previous request from cache (history unavailable)`);
      }
    }

    return previousRequest;
  }

  /**
   * Process IMAGE mode - generate edited image with YC setting
   * @param {string} effectiveImageUrl - Image URL to edit
   * @param {string} userMessage - User's message
   * @param {string|null} currentImageUrl - Image from current message (if any)
   * @param {Array} conversation - Conversation history
   * @param {string|null} previousRequest - Previous YC photo request
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Result with image URL
   */
  async processImageMode(effectiveImageUrl, userMessage, currentImageUrl, conversation, previousRequest, chatId) {
    console.log('Image available - generating YC photo with Gemini...');

    const isFirstMessage = conversation.length === 0;

    // Detect style for reference image
    let detectedStyle;
    if (!currentImageUrl && effectiveImageUrl && previousRequest) {
      detectedStyle = this.agent.detectStyle(previousRequest);
    } else {
      detectedStyle = this.agent.detectStyle(userMessage || previousRequest || '');
    }
    
    // Get reference image URL for AI generation (if enabled)
    let referenceImageUrl = null;
    if (this.referenceImagesEnabled) {
      console.log(`🎨 Detected style: ${detectedStyle}`);
      referenceImageUrl = this.getReferenceImageUrl(detectedStyle);
      
      if (referenceImageUrl) {
        console.log(`🎨 Will use reference image in AI generation: ${referenceImageUrl}`);
        
        // Send reference image to user first (if enabled and not test mode)
        if (this.sendReferenceToUser && !webhookHelpers.isTestChat(chatId)) {
          console.log(`📤 Sending reference image to user as preview`);
          await this.sendReferenceImage(chatId, detectedStyle);
          
          // Small delay to ensure reference image is sent first
          await new Promise(resolve => setTimeout(resolve, 500));
        } else if (!this.sendReferenceToUser) {
          console.log(`⏭️  Skipping sending reference to user (YC_SEND_REFERENCE_TO_USER=false)`);
        }
      }
    }
    
    // Build prompt with context awareness
    // Include reference image context if using one
    const willUseReferenceImage = !!referenceImageUrl;
    let prompt;
    
    if (!currentImageUrl && effectiveImageUrl && previousRequest) {
      // User is referring to a previous image and previous style
      prompt = `${this.agent.getStylePrompt(detectedStyle, willUseReferenceImage)}\n\nKeep your response brief and enthusiastic.`;
      console.log('📝 Using previous YC style as context (no new image)');
    } else {
      // Build initial prompt
      const basePrompt = this.agent.buildPrompt(userMessage, conversation, isFirstMessage);
      
      // If using reference image, replace the style prompt section with reference-aware version
      if (willUseReferenceImage) {
        const stylePrompt = this.agent.getStylePrompt(detectedStyle, willUseReferenceImage);
        prompt = stylePrompt + '\n\nKeep your text response brief and enthusiastic - describe what you\'ve done in 1-2 sentences.';
      } else {
        prompt = basePrompt;
      }
    }

    console.log('Generated prompt for image editing:');
    console.log('---');
    console.log(prompt);
    console.log('---');

    // Generate edited image using Gemini (with optional reference image)
    const generationOptions = {
      ...this.agent.getGenerationOptions(),
      referenceImageUrl: referenceImageUrl // Pass reference image to AI
    };

    const result = await geminiService.generateEditedImage(
      effectiveImageUrl,
      prompt,
      generationOptions
    );

    console.log('Generated response:', {
      hasText: !!result.text,
      hasImage: !!result.imageData,
      imageSize: result.imageData ? `${result.imageData.length} chars` : 'N/A'
    });

    // Prepare response text
    let responseText = result.text || "📸 Here's your YC photo! Looking great!";

    // If image was generated, save it and send as media message
    if (result.imageData) {
      try {
        // Save base64 image to disk
        const filename = await imageStorage.saveBase64Image(
          result.imageData,
          result.mimeType,
          'yc-photographer'
        );

        // Generate public URL
        const baseUrl = config.server.baseUrl || `http://localhost:${config.server.port}`;
        const imagePublicUrl = imageStorage.generatePublicUrl(filename, baseUrl);

        console.log(`📸 Image saved and available at: ${imagePublicUrl}`);

        // Cache the bot's response for future reference
        conversationCache.storeResponse(chatId, responseText);

        // Get image dimensions for proper display in WhatsApp
        const dimensions = imageStorage.getImageDimensions(filename);
        if (dimensions) {
          console.log(`📐 Image dimensions: ${dimensions.width}x${dimensions.height}`);
        }

        // Send text + image to A1Zap
        console.log(`Preparing to send image message...`);
        console.log(`  Chat ID: ${chatId}`);
        console.log(`  Test mode: ${webhookHelpers.isTestChat(chatId)}`);
        console.log(`  Image URL: ${imagePublicUrl}`);

        if (!webhookHelpers.isTestChat(chatId)) {
          console.log('🚀 Sending media message to A1Zap API...');

          // Build options with dimensions for proper A1Zap image handling
          const mediaOptions = {
            contentType: result.mimeType || 'image/png'
          };

          if (dimensions) {
            mediaOptions.width = dimensions.width;
            mediaOptions.height = dimensions.height;
          }

          await this.client.sendMediaMessage(
            chatId,
            responseText,
            imagePublicUrl,
            mediaOptions
          );
          console.log('✅ Media message sent successfully');
        } else {
          console.log('⚠️  Test mode: Skipping A1Zap send');
        }

        // Return success with image info
        return {
          response: responseText,
          imageUrl: imagePublicUrl
        };

      } catch (imageError) {
        console.error('❌ Error saving/sending image:', imageError);

        // Fall back to text-only response
        responseText += '\n\n(Note: There was an issue processing the generated image)';

        return {
          response: responseText,
          warning: 'Image generation succeeded but image delivery failed'
        };
      }
    } else {
      // No image generated in result - send text-only response
      console.log('⚠️  No image generated in API response');

      return {
        response: responseText
      };
    }
  }

  /**
   * Process TEXT mode - conversational response without image
   * @param {string} userMessage - User's message
   * @param {Array} conversation - Conversation history
   * @param {string} chatId - Chat ID for fallback to cache
   * @returns {Promise<Object>} Result with response text
   */
  async processTextMode(userMessage, conversation, chatId) {
    console.log('No image detected - using conversational AI response...');

    // Build message history for Gemini chat
    let messages = conversation.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // If conversation is empty (history API failed), use cache as fallback
    if (messages.length === 0) {
      console.log('⚠️  No conversation history from API - using cache fallback');
      const cachedContext = conversationCache.getChatContext(chatId);
      
      // Reconstruct conversation from cache with proper interleaving of requests and responses
      if (cachedContext.requests.length > 0 || cachedContext.responses.length > 0) {
        const messageCount = Math.max(cachedContext.requests.length, cachedContext.responses.length);
        console.log(`📝 Rebuilding conversation from cache: ${cachedContext.requests.length} requests, ${cachedContext.responses.length} responses`);
        
        // Interleave user requests and bot responses
        for (let i = 0; i < messageCount; i++) {
          // Add user request
          if (i < cachedContext.requests.length) {
            messages.push({
              role: 'user',
              content: cachedContext.requests[i].text
            });
          }
          
          // Add bot response (if available)
          if (i < cachedContext.responses.length) {
            messages.push({
              role: 'assistant',
              content: cachedContext.responses[i].text
            });
          }
        }
      }
      
      // Add note about cached images
      if (cachedContext.images.length > 0) {
        console.log(`📸 Found ${cachedContext.images.length} cached image(s) - including in context`);
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Check if there are ANY images in recent history
    const hasRecentImages = conversation.some(msg =>
      msg.role === 'user' && msg.imageUrl
    );

    // Enhanced system instruction if images were in history
    let systemInstruction = this.agent.getSystemPrompt();
    if (hasRecentImages) {
      systemInstruction += `\n\nIMPORTANT: The user has shared images in this conversation, but the current message doesn't have an image. If they're asking you to create a YC photo, politely let them know you need them to share the specific image they want you to work on.`;
    }

    // Generate conversational response using Gemini
    const responseText = await geminiService.chat(messages, {
      systemInstruction: systemInstruction,
      temperature: this.agent.getGenerationOptions().temperature,
      maxOutputTokens: this.agent.getGenerationOptions().maxOutputTokens,
      model: 'gemini-2.0-flash-exp' // Use flash model for text conversations
    });

    console.log('AI response generated:', responseText.substring(0, 100) + '...');

    // Cache the bot's response for future reference
    conversationCache.storeResponse(chatId, responseText);

    return {
      response: responseText,
      mode: 'text-conversation'
    };
  }

  /**
   * Override sendResponse to handle image messages specially
   * @override
   */
  async sendResponse(chatId, result) {
    // If result has an imageUrl, the image was already sent in processImageMode
    if (result.imageUrl) {
      console.log('✅ Media message already sent in processImageMode');
      return;
    }

    // Otherwise, use base class implementation for text response
    await super.sendResponse(chatId, result);
  }
}

// Create and export singleton webhook handler
const ycPhotographerWebhook = new YCPhotographerWebhook();
module.exports = ycPhotographerWebhook.createHandler();

