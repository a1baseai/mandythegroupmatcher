const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const claudeService = require('../services/claude-service');
const mandyAgent = require('../agents/mandy-agent');
const groupProfileStorage = require('../services/group-profile-storage');
const webhookHelpers = require('../services/webhook-helpers');
const MiniAppService = require('../services/mini-app-service');
const config = require('../config');

/**
 * Mandy the Group Matchmaker Webhook Handler
 * Uses natural conversation with full memory to create profiles
 */
class MandyWebhook extends BaseWebhook {
  constructor() {
    // Create A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.mandy);

    // Initialize base webhook
    super(mandyAgent, client);
    
    // Track which chats have received our welcome message
    this.welcomeMessagesSent = new Set();
    
    // Initialize Mini App Service
    this.miniAppService = new MiniAppService(
      config.agents.mandy.apiKey,
      'https://api.a1zap.com'
    );
  }
  
  /**
   * Override handleChatStarted to send our welcome message as the opening message
   * @override
   */
  async handleChatStarted(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('📥 [Mandy] chat.started WEBHOOK RECEIVED');
      console.log('='.repeat(80));
      console.log('Full payload:', JSON.stringify(req.body, null, 2));
      console.log('='.repeat(80) + '\n');
      
      // Support both payload structures (newer and legacy)
      const { chatMetadata, chatId: rootChatId, user: rootUser } = req.body;
      
      const chatId = rootChatId || chatMetadata?.chatId;
      const userName = rootUser?.userName || chatMetadata?.user?.userName;
      const isAnonymous = rootUser?.isAnonymous || chatMetadata?.user?.isAnonymous;
      
      console.log(`🔍 [Mandy] Extracted values:`);
      console.log(`   chatId: ${chatId}`);
      console.log(`   userName: ${userName || 'Anonymous'}`);
      console.log(`   isAnonymous: ${isAnonymous}\n`);
      
      // Validate chatId
      if (!chatId) {
        console.error('❌ [Mandy] Missing chatId in webhook payload!');
        return res.status(400).json({
          success: false,
          error: 'Missing chatId in webhook payload'
        });
      }

      console.log(`👋 [Mandy] Chat started with user: ${userName || 'Anonymous'} (chatId: ${chatId})`);

      // Get welcome message from agent
      const welcomeMessage = this.agent.getWelcomeMessage(userName, isAnonymous);
      console.log(`💬 [Mandy] Welcome message prepared (${welcomeMessage.length} chars):`);
      console.log(`   "${welcomeMessage.substring(0, 100)}..."\n`);

      // Send welcome message as the opening message (skip if test mode)
      if (!webhookHelpers.isTestChat(chatId)) {
        try {
          console.log(`📤 [Mandy] Attempting to send welcome message to chatId: ${chatId}`);
          console.log(`   API Key configured: ${this.client.apiKey && !this.client.apiKey.includes('your_') ? 'YES (' + this.client.apiKey.substring(0, 10) + '...)' : 'NO'}`);
          console.log(`   Agent ID configured: ${this.client.agentId && !this.client.agentId.includes('your_') ? 'YES (' + this.client.agentId + ')' : 'NO'}`);
          console.log(`   API URL: ${this.client.apiUrl}`);
          console.log(`   Welcome message length: ${welcomeMessage.length} chars\n`);
          
          const sendResult = await this.client.sendMessage(chatId, welcomeMessage);
        console.log('✅ [Mandy] Opening welcome message sent successfully!');
        console.log(`   Message: "${welcomeMessage.substring(0, 80)}..."`);
          console.log(`   API Response:`, sendResult ? JSON.stringify(sendResult, null, 2) : 'No response data');
          console.log('');
        
        // Mark as sent so we don't send it again on first user message
        if (!this.welcomeMessagesSent) {
          this.welcomeMessagesSent = new Set();
        }
        this.welcomeMessagesSent.add(chatId);
        } catch (sendError) {
          console.error('\n' + '='.repeat(80));
          console.error('❌ [Mandy] ERROR sending welcome message after retries!');
          console.error('='.repeat(80));
          console.error('Error message:', sendError.message);
          if (sendError.response) {
            console.error('\n📋 Full API Error Response:');
            console.error('   Status:', sendError.response.status);
            console.error('   Status Text:', sendError.response.statusText);
            if (sendError.response.status >= 500) {
              console.error('   ⚠️  A1Zap API server error (5xx) - this is usually temporary');
              console.error('   💡 The welcome message will not be sent, but the chat can continue');
              console.error('   💡 Mandy will respond when the user sends a message');
            }
          }
          console.error('='.repeat(80) + '\n');
          // Don't fail the webhook - still return success so chat can continue
          // The user can still interact and Mandy will respond
        }
      } else {
        console.log('⚠️  [Mandy] Test mode: Skipping welcome message send');
        console.log(`   Would send: "${welcomeMessage.substring(0, 80)}..."`);
      }

      // Return success with debug info
      const response = {
        success: true,
        event: 'chat.started',
        agent: this.agent.name,
        welcomeMessageSent: !webhookHelpers.isTestChat(chatId), // True if we attempted to send (not test mode)
        userName: userName || 'Anonymous',
        debug: {
          chatId: chatId,
          isTestChat: webhookHelpers.isTestChat(chatId),
          apiKeyConfigured: this.client.apiKey && !this.client.apiKey.includes('your_'),
          agentIdConfigured: this.client.agentId && !this.client.agentId.includes('your_')
        }
      };
      
      return res.json(response);

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ ERROR handling chat.started event:');
      console.error('='.repeat(80));
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.response) {
        console.error('API Response status:', error.response.status);
        console.error('API Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('='.repeat(80) + '\n');
      
      return res.status(500).json({
        success: false,
        error: error.message,
        event: 'chat.started',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Count questions asked by assistant in conversation
   * @param {Array} conversation - Conversation history
   * @returns {number} Number of questions asked
   */
  countQuestionsAsked(conversation) {
    try {
      if (!conversation || !Array.isArray(conversation)) {
        return 0;
      }
      
      let questionCount = 0;
      for (const msg of conversation) {
        if (msg && msg.role === 'assistant' && msg.content && typeof msg.content === 'string') {
          const content = msg.content.replace(/^Mandy the Group Matcher:\s*/g, '').trim();
          // Check if message ends with ? (more reliable than keyword matching)
          if (content.includes('?') && content.length > 3) {
            questionCount++;
          }
        }
      }
      return questionCount;
    } catch (error) {
      console.error(`⚠️  [Mandy] Error counting questions:`, error.message);
      return 0; // Safe fallback
    }
  }

  /**
   * Extract group name from conversation or interview state
   * @param {Array} conversation - Conversation history
   * @param {string} chatId - Chat ID to check interview state
   * @returns {string|null} Group name or null
   */
  extractGroupName(conversation, chatId = null) {
    // First check interview state (most reliable)
    if (chatId) {
      const interviewState = groupProfileStorage.getInterviewState(chatId);
      if (interviewState && interviewState.groupName) {
        console.log(`✅ [Mandy] Found group name in interview state: ${interviewState.groupName}`);
        return interviewState.groupName;
      }
    }
    
    if (!conversation || !Array.isArray(conversation)) {
      return null;
    }
    
    // Look for patterns like "we're called X", "our name is X", "call us X", "call me X", etc.
    // Also handle "Just X" or "X and Friends" patterns
    for (const msg of conversation) {
      if (msg.role === 'user' && msg.content) {
        const content = msg.content.trim();
        const patterns = [
          /(?:can\s+you\s+)?call\s+(?:me|us)\s+([A-Za-z0-9\s&]+?)(?:\.|!|\?|$)/i, // "call me Luke", "can you call me Luke"
          /(?:we'?re|we are|our name is|we're called|we go by)\s+([A-Za-z0-9\s&]+?)(?:\.|!|\?|$)/i, // "we're X", "our name is X"
          /(?:name|call us|we're|we are)\s+(?:is|are|:)?\s*([A-Za-z0-9\s&]+?)(?:\.|!|\?|$)/i,
          /^([A-Za-z0-9\s&]{2,50})\s+and\s+friends$/i, // "Luke and Friends"
          /^just\s+([A-Za-z0-9\s&]+?)(?:\s+and|\s+i'?m|\.|!|\?|$)/i, // "Just Luke and I'm flying solo"
          /^([A-Za-z0-9\s&]{2,50})(?:\s+and|\s+i'?m|\.|!|\?|$)/i, // "Luke and I'm flying solo"
          /^([A-Za-z0-9\s&]{2,50})$/ // Just a name by itself
        ];
        
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            let name = match[1].trim();
            // Clean up common suffixes
            name = name.replace(/\s+(and|i'?m|flying|solo).*$/i, '').trim();
            // Remove "and friends" if it's part of the name (we want to keep it)
            // Actually, let's keep "and Friends" if it's there
            if (name.length > 1 && name.length < 50) {
              console.log(`✅ [Mandy] Extracted group name from message: "${name}"`);
              // Store it in interview state for future reference
              if (chatId) {
                const currentState = groupProfileStorage.getInterviewState(chatId) || {};
                groupProfileStorage.setInterviewState(chatId, {
                  ...currentState,
                  groupName: name
                });
              }
              return name;
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Process Mandy request - NEW MINI APP-DRIVEN FLOW
   * @param {Object} data - Request data with conversation history
   * @returns {Promise<Object>} Result with response text
   */
  async processRequest(data) {
    try {
      const { userMessage, conversation, chatId, messageId } = data;
      const requestStartTime = Date.now();
      
      // Log for debugging
      console.log(`\n[Mandy] Processing request (Mini App Flow):`);
      console.log(`  Chat ID: ${chatId}`);
      console.log(`  Message ID: ${messageId || 'MISSING'}`);
      console.log(`  User Message: "${userMessage?.substring(0, 100)}..."`);
      console.log(`  Conversation length: ${conversation?.length || 0}`);
    
      // Validate user message
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        console.warn(`⚠️  [Mandy] Empty or invalid user message`);
        return {
          response: "I didn't catch that! Could you try again? 😊",
          sent: false
        };
      }
      
      // Check if profile already exists for this chat
      const existingProfile = groupProfileStorage.getProfileByChatId(chatId);
      
      if (existingProfile) {
        // Check if we should poll for mini app data and update profile
        const hasMiniAppSessions = existingProfile.miniAppSessions && Object.keys(existingProfile.miniAppSessions).length > 0;
        
        if (hasMiniAppSessions) {
          // Poll for mini app data in background
          this.pollAndUpdateProfileFromMiniApps(chatId, existingProfile).catch(err => {
            console.error(`❌ [Mandy] Error polling mini app data:`, err);
          });
        }
        
        console.log(`✅ [Mandy] Profile already exists for chat ${chatId}`);
        return {
          response: "Your profile is all set! Sit tight and wait for a match! 🎉",
          sent: false
        };
      }
      
      // NEW FLOW: Check if we have group name (check both conversation and interview state)
      const groupName = this.extractGroupName(conversation, chatId);
      const hasGroupName = !!groupName;
      
      // Check if mini apps have been shared
      const interviewState = groupProfileStorage.getInterviewState(chatId);
      const miniAppsShared = interviewState?.miniAppsShared || false;
      
      if (!hasGroupName) {
        // Step 1: Ask for group name - keep it simple
        // ONLY ask if we haven't asked in the last few messages
        const recentMessages = conversation.slice(-3).filter(m => m.role === 'assistant');
        const alreadyAsked = recentMessages.some(m => 
          m.content && m.content.toLowerCase().includes('what should i call')
        );
        
        if (alreadyAsked) {
          // Already asked recently, just wait for response - don't ask again
          console.log(`📝 [Mandy] Already asked for group name recently - waiting for response`);
          return {
            response: null,
            sent: true  // Don't send anything, just wait
          };
        }
        
        console.log(`📝 [Mandy] No group name yet - asking for it`);
        // Don't generate a long response - just ask for name
        return {
          response: `What should I call you/your crew?`,
          sent: false
        };
      }
      
      if (!miniAppsShared) {
        // Step 2: We have group name, now share mini apps IMMEDIATELY
        console.log(`🎮 [Mandy] Group name found: ${groupName} - sharing mini apps NOW`);
        console.log(`  Chat ID: ${chatId}`);
        console.log(`  Group Name: ${groupName}`);
        
        // Check if mini apps are configured
        const miniApps = config.agents.mandy.miniApps || {};
        const availableApps = Object.entries(miniApps).filter(([_, appId]) => appId && !appId.includes('your_'));
        console.log(`  Available mini apps: ${availableApps.length}`);
        
        if (availableApps.length === 0) {
          console.error(`❌ [Mandy] No mini apps configured!`);
          return {
            response: `Oops! I don't have any games set up yet. Let me fix that! 🎮`,
            sent: false
          };
        }
        
        // Mark as shared FIRST to prevent duplicate calls
        groupProfileStorage.setInterviewState(chatId, {
          groupName,
          miniAppsShared: true,
          sharedAt: new Date().toISOString()
        });
        
        // Share mini apps and wait for it to complete
        try {
          console.log(`  Attempting to share ${availableApps.length} mini app(s)...`);
          await this.shareAllMiniApps(chatId, groupName);
          console.log(`  ✅ Mini apps shared successfully`);
          // Links are already sent by shareAllMiniApps, so mark as sent to prevent double message
          // Return null response to prevent base webhook from sending anything
          return {
            response: null,
            sent: true  // Mark as sent since shareAllMiniApps already sent the message
          };
        } catch (err) {
          console.error(`❌ [Mandy] Error sharing mini apps:`, err);
          console.error(`  Error message: ${err.message}`);
          if (err.response) {
            console.error(`  Status: ${err.response.status}`);
            console.error(`  Data:`, JSON.stringify(err.response.data, null, 2));
          }
          
          // Check if it's a 500 error (server issue)
          const isServerError = err.response && err.response.status >= 500;
          if (isServerError) {
            console.error(`  ⚠️  This is an A1Zap API server error - the mini app ID might be correct but the API is having issues`);
          }
          
          // Reset the flag so we can try again
          const state = groupProfileStorage.getInterviewState(chatId);
          if (state) {
            state.miniAppsShared = false;
            groupProfileStorage.setInterviewState(chatId, state);
          }
          
          // Provide helpful error message
          return {
            response: `Having trouble setting up the game right now. The API is returning an error. Can you check with A1Zap support? 🎮`,
            sent: false
          };
        }
      }
      
      // Step 3: Mini apps shared, poll for data and create profile
      console.log(`📊 [Mandy] Mini apps shared - checking for data and creating profile`);
      
      // Poll for data and create profile in background
      this.pollAndCreateProfileFromMiniApps(chatId, groupName).catch(err => {
        console.error(`❌ [Mandy] Error creating profile from mini apps:`, err);
      });
      
      // Keep response minimal - they already have the links
      // Only respond if they're asking something specific
      const userMsgLower = userMessage.toLowerCase();
      if (userMsgLower.includes('link') || userMsgLower.includes('game') || userMsgLower.includes('send') || userMsgLower.includes('where')) {
        return {
          response: `Check above - links are there! 🎮`,
          sent: false
        };
      }
      
      // For most messages after mini apps are shared, just acknowledge briefly or don't respond
      // This prevents double messaging
      if (userMsgLower.length < 20 && (userMsgLower.includes('ok') || userMsgLower.includes('cool') || userMsgLower.includes('thanks') || userMsgLower.includes('got it'))) {
        return {
          response: null,
          sent: true  // Don't send anything for simple acknowledgments
        };
      }
      
      // Otherwise just acknowledge briefly
      return {
        response: `Got it 👍`,
        sent: false
      };
      
    } catch (error) {
      // CRITICAL: Always return a response, even on error
      console.error(`❌ [Mandy] Critical error in processRequest:`, error);
      console.error(`   Stack:`, error.stack);
      return {
        response: "Oops! I had a moment there. Let's try again - what were you saying? 😊",
        sent: false
      };
    }
  }

  /**
   * Clean conversation history - remove agent name prefixes from assistant messages
   * @param {Array} conversation - Raw conversation history
   * @returns {Array} Cleaned conversation
   */
  cleanConversationHistory(conversation) {
    if (!conversation || !Array.isArray(conversation)) {
      return [];
    }
    
    return conversation.map(msg => {
      if (msg.role === 'assistant' && msg.content) {
        // Remove "Mandy the Group Matcher:" or "Mandy the Group Matcher: " prefixes
        let cleaned = msg.content.replace(/^Mandy the Group Matcher:\s*/g, '');
        // Remove multiple instances of the prefix (in case it's duplicated)
        cleaned = cleaned.replace(/Mandy the Group Matcher:\s*/g, '');
        return {
          ...msg,
          content: cleaned.trim()
        };
      }
      return msg;
    });
  }

  /**
   * Generate conversational response with full memory
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User's message
   * @param {Array} conversation - Full conversation history
   * @param {number} questionsAsked - Number of questions already asked
   * @returns {Promise<Object>} Response
   */
  async generateConversationalResponse(chatId, userMessage, conversation, questionsAsked = 0) {
    const startTime = Date.now();
    try {
      // Clean conversation history to remove agent name prefixes
      const cleanedHistory = this.cleanConversationHistory(conversation || []);
      
      // Prepare messages for Claude
      const messages = [...cleanedHistory];
      
      // Check if the last message is already this user message (don't duplicate)
      const lastMsg = messages[messages.length - 1];
      const userMessageAlreadyIncluded = lastMsg && 
        lastMsg.role === 'user' && 
        (lastMsg.content === userMessage || lastMsg.content === `Luke Sonson: ${userMessage}`);
      
      if (!userMessageAlreadyIncluded) {
        // Extract just the content if it has a sender name prefix
        const cleanUserMessage = userMessage.replace(/^[^:]+:\s*/, '');
        messages.push({ role: 'user', content: cleanUserMessage });
      }
      
      console.log(`💬 [Mandy] Generating response with ${messages.length} messages in history`);
      
      // Build enhanced system prompt with question count context
      const baseSystemPrompt = mandyAgent.getSystemPrompt();
      const questionContext = questionsAsked < 8 
        ? `\n\nIMPORTANT CONTEXT: You have asked ${questionsAsked} questions so far. You need to ask exactly 8 questions total (including follow-ups) before the profile can be saved. You have ${8 - questionsAsked} questions remaining. Make sure you ask ONE question in your response (not zero, not multiple).`
        : `\n\nIMPORTANT CONTEXT: You have asked ${questionsAsked} questions. You have reached 8 questions, so if you have enough information (especially group name and group size), you should indicate that the profile is complete. Otherwise, you may ask 1-2 more clarifying questions if absolutely necessary.`;
      
      const enhancedSystemPrompt = baseSystemPrompt + questionContext;
      
      // Generate response using Claude with full conversation history
      // Use timeout with Promise.race to ensure we always get a response
      const claudeResponsePromise = claudeService.chat(messages, {
        systemPrompt: enhancedSystemPrompt,
        ...mandyAgent.getGenerationOptions(),
        temperature: 0.9, // Higher temperature for more personality
        maxTokens: 250, // Reduced tokens for faster responses (still enough for personality)
        timeout: 12000 // 12 second timeout (increased slightly for reliability)
      });
      
      // Add an additional safety timeout to ensure we never hang
      const safetyTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API call exceeded safety timeout')), 15000)
      );
      
      const response = await Promise.race([claudeResponsePromise, safetyTimeout]);
      
      const elapsed = Date.now() - startTime;
      console.log(`⏱️  [Mandy] Response generated in ${elapsed}ms`);
      
      if (!response || response.trim().length === 0) {
        throw new Error('Empty response from Claude');
      }
      
      const trimmedResponse = response.trim();
      console.log(`✅ [Mandy] Generated response: "${trimmedResponse.substring(0, 100)}..."`);

      return {
        response: trimmedResponse,
        sent: false
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [Mandy] Error generating response (took ${elapsed}ms):`, error.message);
      
      // Provide context-aware fallback based on error type
      if (error.message && error.message.includes('timeout')) {
        console.error(`⏱️  [Mandy] Response timed out after ${elapsed}ms`);
      }
      
      // Quick, snappy fallback response
        return {
        response: "Hmm, I'm having a moment! Could you say that again? 😅",
          sent: false
        };
      }
  }

  /**
   * Check if profile is complete based on conversation
   * @param {string} chatId - Chat ID
   * @param {Array} conversation - Conversation history
   * @returns {Promise<Object>} { shouldSave: boolean, confirmationMessage?: string }
   */
  async checkProfileComplete(chatId, conversation) {
    try {
      // Count substantial exchanges (user messages with real content)
      const userMessages = (conversation || []).filter(msg => 
        msg.role === 'user' && 
        msg.content && 
        msg.content.trim().length > 5
      );
      
      // Need at least 8-10 substantial exchanges - fast path for early messages
      if (userMessages.length < 8) {
        return { shouldSave: false };
      }
      
      // Clean conversation before checking
      const cleanedConv = this.cleanConversationHistory(conversation || []);
      
      // Quick timeout check - don't block on this
      const checkPrompt = `Review this conversation and determine if we have enough information to create a good matchmaking profile.

CRITICAL REQUIREMENTS (ALL must be present):
1. Group name (or individual name) - REQUIRED
2. Group size (number of people) - REQUIRED if it's a group
3. At least 6-8 substantial answers about their personality, interests, and preferences

We need to know:
- Name/group name (MUST HAVE)
- Group size/number of people (MUST HAVE if group)
- Their vibe/personality (from multiple questions)
- Their interests and what they like to do
- Their sense of humor and communication style
- At least 6-8 substantial answers

Conversation:
${cleanedConv.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Respond with ONLY "YES" if we have ALL required info (especially name and group size), or "NO" if we're missing required information.`;
      
      // Use short timeout (5 seconds) for profile check - don't block response
      const aiCheck = await Promise.race([
        claudeService.generateText(checkPrompt, {
        temperature: 0.3,
          maxTokens: 10,
          timeout: 5000
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile check timeout')), 5000)
        )
      ]).catch(err => {
        console.warn(`⚠️  [Mandy] Profile check timed out or failed: ${err.message}`);
        return 'NO'; // Default to continuing conversation if check fails
      });
      
      const shouldSave = typeof aiCheck === 'string' && aiCheck.trim().toUpperCase().includes('YES');
      
      if (shouldSave) {
        return {
          shouldSave: true,
          confirmationMessage: "Perfect! I've got a great sense of who you are! I've saved your profile. Sit tight and wait for a match! 🎉"
        };
      }
      
      return { shouldSave: false };
    } catch (error) {
      console.error(`❌ [Mandy] Error checking profile completeness:`, error);
      // Default to not saving if check fails - don't block the response
      return { shouldSave: false };
    }
  }

  /**
   * Save profile from conversation
   * @param {string} chatId - Chat ID
   * @param {Array} conversation - Conversation history
   * @returns {Promise<Object>} Saved profile
   */
  async saveProfileFromConversation(chatId, conversation) {
    try {
      // Extract profile info from conversation using AI
      const extractPrompt = `Extract profile information from this conversation and format it as JSON.

Extract:
- groupName (or name if individual)
- groupSize (number, or null if individual)
- answers object with key information from the conversation (use question1, question2, etc. format for different topics discussed)

Conversation:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Return ONLY valid JSON, no other text.`;
      
      const extractedJson = await claudeService.generateText(extractPrompt, {
        temperature: 0.3,
        maxTokens: 1000
      });
      
      // Parse JSON (handle if wrapped in markdown code blocks)
      let profileData;
      try {
        const cleaned = extractedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        profileData = JSON.parse(cleaned);
      } catch (parseError) {
        console.error(`❌ [Mandy] Error parsing extracted profile:`, parseError);
        // Fallback: create basic profile from conversation
        profileData = {
          groupName: 'Unknown',
          groupSize: null,
          answers: {}
        };
      }
      
      // Ensure required fields
      if (!profileData.groupName) {
        profileData.groupName = 'Unknown';
      }
      
      // Check if group name already exists
      if (groupProfileStorage.groupNameExists(profileData.groupName)) {
        profileData.groupName = `${profileData.groupName}_${Date.now()}`;
      }
      
    const profile = {
        groupName: profileData.groupName,
      chatId: chatId,
        answers: profileData.answers || {},
      metadata: {
          createdAt: new Date().toISOString(),
          source: 'conversational'
      }
    };

    const savedProfile = groupProfileStorage.saveGroupProfile(profile);
      console.log(`✅ [Mandy] Saved profile: ${savedProfile.groupName} (ID: ${savedProfile.id})`);
      
      // Optionally create a mini app session after profile is saved
      // This can be enabled/configured based on your needs
      // await this.autoCreateMiniAppSession(chatId, savedProfile);
      
      return savedProfile;
    } catch (error) {
      console.error(`❌ [Mandy] Error saving profile:`, error);
      throw error;
    }
  }

  /**
   * Create and share a mini app session
   * @param {string} chatId - Chat ID
   * @param {string} microAppId - Mini app ID to create session for
   * @param {string} sessionName - Display name for the session
   * @param {Object} initialData - Initial sharedData (optional)
   * @returns {Promise<Object>} Session info with shareUrl
   */
  async createMiniAppSession(chatId, microAppId, sessionName, initialData = {}) {
    try {
      const sessionKey = this.miniAppService.createSessionKey(chatId, microAppId.substring(0, 8));
      const session = await this.miniAppService.getOrCreateSession(
        microAppId,
        sessionKey,
        sessionName || `Mandy Mini App - ${chatId}`,
        initialData
      );
      
      // Store session info in profile if it exists
      const profile = groupProfileStorage.getProfileByChatId(chatId);
      if (profile) {
        const existingSessions = profile.miniAppSessions || {};
        const updatedSessions = {
          ...existingSessions,
          [microAppId]: {
            instanceId: session.instanceId,
            shareCode: session.shareCode,
            shareUrl: session.shareUrl,
            createdAt: new Date().toISOString()
          }
        };
        groupProfileStorage.updateProfile(chatId, { miniAppSessions: updatedSessions });
      }
      
      return session;
    } catch (error) {
      console.error(`❌ [Mandy] Error creating mini app session:`, error);
      throw error;
    }
  }

  /**
   * Get mini app session data and integrate into profile
   * @param {string} chatId - Chat ID
   * @param {string} microAppId - Mini app ID
   * @returns {Promise<Object|null>} Shared data or null
   */
  async getMiniAppData(chatId, microAppId) {
    try {
      const profile = groupProfileStorage.getProfileByChatId(chatId);
      if (!profile || !profile.miniAppSessions || !profile.miniAppSessions[microAppId]) {
        return null;
      }
      
      const sessionInfo = profile.miniAppSessions[microAppId];
      const sessionData = await this.miniAppService.getSharedData(sessionInfo.instanceId);
      
      return sessionData.sharedData;
    } catch (error) {
      console.error(`❌ [Mandy] Error getting mini app data:`, error);
      return null;
    }
  }

  /**
   * Share all configured mini apps with a group
   * @param {string} chatId - Chat ID
   * @param {string} groupName - Group name
   * @returns {Promise<Array>} Array of created sessions
   */
  async shareAllMiniApps(chatId, groupName) {
    try {
      const miniApps = config.agents.mandy.miniApps || {};
      const availableApps = Object.entries(miniApps).filter(([_, appId]) => appId && !appId.includes('your_'));
      
      if (availableApps.length === 0) {
        console.warn(`⚠️  [Mandy] No mini apps configured - cannot share`);
        return [];
      }
      
      console.log(`🎮 [Mandy] Sharing ${availableApps.length} mini app(s) for ${groupName}`);
      
      const sessions = [];
      const shareUrls = [];
      
      // Create sessions for all mini apps
      for (const [appName, appId] of availableApps) {
        try {
          const sessionName = `${groupName}'s ${appName}`;
          const session = await this.createMiniAppSession(chatId, appId, sessionName);
          sessions.push(session);
          shareUrls.push(`\n🎮 ${appName}: ${session.shareUrl}`);
        } catch (error) {
          console.error(`❌ [Mandy] Error creating session for ${appName}:`, error);
        }
      }
      
      // Send message with all links (include group name acknowledgment)
      if (shareUrls.length > 0) {
        const message = `Got it, ${groupName}! 🎮\n\nHere's your game:\n${shareUrls.join('\n')}`;
        await this.client.sendMessage(chatId, message);
      }
      
      return sessions;
    } catch (error) {
      console.error(`❌ [Mandy] Error sharing mini apps:`, error);
      throw error;
    }
  }

  /**
   * Poll mini app data and create profile from it
   * @param {string} chatId - Chat ID
   * @param {string} groupName - Group name
   * @returns {Promise<Object|null>} Created profile or null
   */
  async pollAndCreateProfileFromMiniApps(chatId, groupName) {
    try {
      // Get interview state to find mini app sessions
      const interviewState = groupProfileStorage.getInterviewState(chatId);
      if (!interviewState || !interviewState.miniAppsShared) {
        console.log(`⚠️  [Mandy] Mini apps not shared yet for ${chatId}`);
        return null;
      }
      
      // Get or create a temporary profile to store session info
      let profile = groupProfileStorage.getProfileByChatId(chatId);
      if (!profile) {
        // Create temporary profile with just group name
        profile = groupProfileStorage.saveGroupProfile({
          groupName,
          chatId,
          answers: {},
          metadata: {
            createdAt: new Date().toISOString(),
            source: 'mini-app-driven',
            status: 'waiting-for-data'
          }
        });
      }
      
      // Poll for mini app data
      const miniAppData = await this.syncMiniAppData(chatId);
      
      if (!miniAppData || Object.keys(miniAppData).length === 0) {
        console.log(`⏳ [Mandy] No mini app data yet for ${groupName} - will check again later`);
        return null;
      }
      
      // Check if we have enough data to create a complete profile
      const hasEnoughData = this.hasEnoughMiniAppData(miniAppData);
      
      if (!hasEnoughData) {
        console.log(`⏳ [Mandy] Not enough mini app data yet for ${groupName}`);
        return null;
      }
      
      // Extract profile from mini app data
      const extractedProfile = await this.extractProfileFromMiniAppData(groupName, chatId, miniAppData);
      
      // Update the profile
      const updatedProfile = groupProfileStorage.updateProfile(chatId, {
        ...extractedProfile,
        metadata: {
          ...profile.metadata,
          status: 'complete',
          completedAt: new Date().toISOString()
        }
      });
      
      console.log(`✅ [Mandy] Profile created from mini app data for ${groupName}`);
      
      // Notify user
      await this.client.sendMessage(chatId, `Awesome! I've got enough data from your mini apps to create your profile! 🎉\n\nYou're all set for matching - sit tight and I'll find you some great matches! 💕`);
      
      return updatedProfile;
    } catch (error) {
      console.error(`❌ [Mandy] Error creating profile from mini apps:`, error);
      return null;
    }
  }

  /**
   * Poll and update existing profile from mini app data
   * @param {string} chatId - Chat ID
   * @param {Object} profile - Existing profile
   * @returns {Promise<Object|null>} Updated profile or null
   */
  async pollAndUpdateProfileFromMiniApps(chatId, profile) {
    try {
      const miniAppData = await this.syncMiniAppData(chatId);
      
      if (!miniAppData || Object.keys(miniAppData).length === 0) {
        return null;
      }
      
      // Extract additional profile data
      const additionalData = await this.extractProfileFromMiniAppData(profile.groupName, chatId, miniAppData);
      
      // Merge with existing profile
      const updatedProfile = groupProfileStorage.updateProfile(chatId, {
        answers: {
          ...profile.answers,
          ...additionalData.answers
        },
        miniAppData: miniAppData
      });
      
      return updatedProfile;
    } catch (error) {
      console.error(`❌ [Mandy] Error updating profile from mini apps:`, error);
      return null;
    }
  }

  /**
   * Check if we have enough mini app data to create a profile
   * @param {Object} miniAppData - Mini app data object
   * @returns {boolean} True if enough data
   */
  hasEnoughMiniAppData(miniAppData) {
    if (!miniAppData || Object.keys(miniAppData).length === 0) {
      return false;
    }
    
    // Check if at least one mini app has substantial data
    for (const [appId, appData] of Object.entries(miniAppData)) {
      if (appData.data) {
        const dataKeys = Object.keys(appData.data);
        // If we have at least some data structure, consider it enough
        // You can customize this logic based on your mini app data structure
        if (dataKeys.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Extract profile information from mini app data using AI
   * @param {string} groupName - Group name
   * @param {string} chatId - Chat ID
   * @param {Object} miniAppData - Mini app data
   * @returns {Promise<Object>} Extracted profile
   */
  async extractProfileFromMiniAppData(groupName, chatId, miniAppData) {
    try {
      const extractPrompt = `Extract group profile information from mini app session data.

Group Name: ${groupName}

Mini App Data:
${JSON.stringify(miniAppData, null, 2)}

Extract and format as JSON:
- groupName: The group name
- groupSize: Number of people (extract from data if available, or null)
- answers: Object with key information extracted from mini app responses
  - Use descriptive keys like: preferences, choices, behaviors, interests, etc.
  - Include any quantitative data (scores, counts, etc.)
  - Include qualitative data (choices, preferences, etc.)

Return ONLY valid JSON, no other text.`;

      const extractedJson = await claudeService.generateText(extractPrompt, {
        temperature: 0.3,
        maxTokens: 2000
      });
      
      // Parse JSON
      let profileData;
      try {
        const cleaned = extractedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        profileData = JSON.parse(cleaned);
      } catch (parseError) {
        console.error(`❌ [Mandy] Error parsing extracted profile:`, parseError);
        // Fallback: create basic profile
        profileData = {
          groupName,
          groupSize: null,
          answers: {}
        };
      }
      
      // Ensure required fields
      if (!profileData.groupName) {
        profileData.groupName = groupName;
      }
      
      return {
        groupName: profileData.groupName,
        chatId,
        answers: profileData.answers || {},
        miniAppData: miniAppData,
        metadata: {
          source: 'mini-app-data',
          extractedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ [Mandy] Error extracting profile from mini app data:`, error);
      // Return basic profile
      return {
        groupName,
        chatId,
        answers: {},
        miniAppData: miniAppData,
        metadata: {
          source: 'mini-app-data',
          error: error.message
        }
      };
    }
  }

  /**
   * Sync mini app data for a profile (fetch latest data and update profile)
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object|null>} Updated mini app data or null
   */
  async syncMiniAppData(chatId) {
    try {
      const profile = groupProfileStorage.getProfileByChatId(chatId);
      if (!profile || !profile.miniAppSessions) {
        return null;
      }
      
      const miniAppData = {};
      
      // Fetch data for each mini app session
      for (const [microAppId, sessionInfo] of Object.entries(profile.miniAppSessions)) {
        try {
          const sessionData = await this.miniAppService.getSharedData(sessionInfo.instanceId);
          if (sessionData.sharedData) {
            miniAppData[microAppId] = {
              data: sessionData.sharedData,
              lastSynced: new Date().toISOString(),
              version: sessionData.sharedDataVersion
            };
          }
        } catch (error) {
          console.warn(`⚠️  [Mandy] Error syncing mini app ${microAppId}:`, error.message);
        }
      }
      
      // Update profile with mini app data
      if (Object.keys(miniAppData).length > 0) {
        groupProfileStorage.updateProfile(chatId, { 
          miniAppData,
          miniAppDataLastSynced: new Date().toISOString()
        });
      }
      
      return miniAppData;
    } catch (error) {
      console.error(`❌ [Mandy] Error syncing mini app data:`, error);
      return null;
    }
  }

  /**
   * Check if user message is requesting a mini app
   * @param {string} userMessage - User's message
   * @returns {Object|null} { microAppId, action } or null
   */
  detectMiniAppRequest(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Check for mini app keywords
    const miniApps = config.agents.mandy.miniApps || {};
    const miniAppKeywords = {};
    
    // Build keyword map from configured apps
    // You can customize this mapping based on your mini app names
    for (const [appName, appId] of Object.entries(miniApps)) {
      if (appId && !appId.includes('your_')) {
        // Map common keywords to app IDs
        const keywords = appName.toLowerCase().split(/[-_\s]+/);
        keywords.forEach(keyword => {
          if (keyword.length > 2) {
            miniAppKeywords[keyword] = appId;
          }
        });
        // Add app name itself
        miniAppKeywords[appName.toLowerCase()] = appId;
      }
    }
    
    for (const [keyword, appId] of Object.entries(miniAppKeywords)) {
      if (message.includes(keyword)) {
        return { microAppId: appId, action: 'share' };
      }
    }
    
    // Check for explicit commands
    if (message.includes('share') && (message.includes('mini app') || message.includes('game'))) {
      // Return first available app or list
      const availableApps = Object.entries(miniApps).filter(([_, appId]) => appId && !appId.includes('your_'));
      if (availableApps.length > 0) {
        return { microAppId: availableApps[0][1], action: 'share' };
      }
    }
    
    return null;
  }

  /**
   * Handle normal chat after profile is saved
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User message
   * @param {Array} conversation - Conversation history
   * @returns {Promise<Object>} Response
   */
  async handleNormalChat(chatId, userMessage, conversation) {
    // Check if user wants to share a mini app
    const miniAppRequest = this.detectMiniAppRequest(userMessage);
    
    if (miniAppRequest && miniAppRequest.microAppId) {
      try {
        const profile = groupProfileStorage.getProfileByChatId(chatId);
        const sessionName = profile 
          ? `${profile.groupName}'s Mini App Session`
          : `Mini App Session - ${chatId}`;
        
        const session = await this.createMiniAppSession(
          chatId,
          miniAppRequest.microAppId,
          sessionName
        );
        
        return {
          response: `Perfect! I've created a mini app session for you! 🎮\n\nJoin here: ${session.shareUrl}\n\nShare this link with your group to play together!`,
          sent: false
        };
      } catch (error) {
        console.error(`❌ [Mandy] Error handling mini app request:`, error);
        return {
          response: "Oops! I had trouble creating that mini app session. Could you try again? 😅",
          sent: false
        };
      }
    }
    
    // Just generate a normal conversational response with full memory
    return await this.generateConversationalResponse(chatId, userMessage, conversation, 0);
  }

  /**
   * Override sendResponse to ensure we ALWAYS send a response quickly
   * This prevents A1Zap from generating its own AI responses
   * @override
   */
  async sendResponse(chatId, result) {
    // Skip sending for test chats
    if (webhookHelpers.isTestChat(chatId)) {
      console.log('⚠️  Test mode: Skipping A1Zap send');
      return;
    }

    // If message was already sent by agent-specific logic, skip sending
    if (result.sent) {
      console.log('✅ [Mandy] Message already sent by agent logic - skipping');
      return;
    }

    // If result has an imageUrl, it was already sent by agent-specific logic
    if (result.imageUrl) {
      console.log('✅ [Mandy] Media message already sent by agent logic');
      return;
    }

    // If response is null or empty, don't send anything
    if (!result || !result.response || result.response.trim().length === 0) {
      console.log('✅ [Mandy] No response to send (null or empty) - skipping');
      return;
    }

    // CRITICAL: Always send a response to prevent A1Zap from generating its own
    console.log(`✅ [Mandy] Sending response immediately to prevent A1Zap fallback`);
    try {
      await webhookHelpers.sendResponse(
        this.client,
        chatId,
        result.response,
        result.richContentBlocks || null
      );
    } catch (sendError) {
      console.error(`❌ [Mandy] Error sending response to A1Zap:`, sendError.message);
      // Try one more time with a simpler message
      try {
        await webhookHelpers.sendResponse(
          this.client,
          chatId,
          "I'm having trouble right now, but I'm here! Could you repeat that? 😊",
          null
        );
      } catch (retryError) {
        console.error(`❌ [Mandy] Even fallback send failed:`, retryError.message);
      }
    }
  }
}

// Create and export singleton webhook handler
const mandyWebhook = new MandyWebhook();
const handler = mandyWebhook.createHandler();

// Export both the handler and the instance for API endpoints
module.exports = handler;
module.exports.instance = mandyWebhook;
