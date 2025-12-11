const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const claudeService = require('../services/claude-service');
const mandyAgent = require('../agents/mandy-agent');
const groupProfileStorage = require('../services/group-profile-storage');
const webhookHelpers = require('../services/webhook-helpers');
const config = require('../config');

/**
 * Mandy the Group Matchmaker Webhook Handler
 * Manages interview flow: asks questions one at a time, validates answers, and saves profiles
 */
class MandyWebhook extends BaseWebhook {
  constructor() {
    // Create A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.mandy);

    // Initialize base webhook
    super(mandyAgent, client);
    
    // Track which chats have received our welcome message
    this.welcomeMessagesSent = new Set();
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
          console.error('❌ [Mandy] ERROR sending welcome message!');
          console.error('='.repeat(80));
          console.error('Error message:', sendError.message);
          console.error('Error stack:', sendError.stack);
          if (sendError.response) {
            console.error('\n📋 Full API Error Response:');
            console.error('   Status:', sendError.response.status);
            console.error('   Status Text:', sendError.response.statusText);
            console.error('   Headers:', JSON.stringify(sendError.response.headers, null, 2));
            console.error('   Data:', JSON.stringify(sendError.response.data, null, 2));
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
   * Process Mandy request - handles interview flow
   * @param {Object} data - Request data with conversation history
   * @returns {Promise<Object>} Result with response text
   */
  async processRequest(data) {
    const { userMessage, conversation, chatId, messageId } = data;
    
    // Log for debugging duplicate responses
    console.log(`\n[Mandy] Processing request:`);
    console.log(`  Chat ID: ${chatId}`);
    console.log(`  Message ID: ${messageId || 'MISSING'}`);
    console.log(`  User Message: "${userMessage?.substring(0, 100)}..."`);
    console.log(`  Conversation length: ${conversation?.length || 0}`);
    
    // Check conversation history for agent messages (to detect if A1Zap is generating responses)
    if (conversation && conversation.length > 0) {
      const agentMessages = conversation.filter(msg => msg.role === 'assistant');
      if (agentMessages.length > 0) {
        console.log(`  ⚠️  Found ${agentMessages.length} agent messages in history`);
        agentMessages.slice(-3).forEach((msg, idx) => {
          const content = msg.content?.substring(0, 80) || '';
          console.log(`    Agent msg ${idx + 1}: "${content}..."`);
          
          // Detect if A1Zap is generating unwanted messages
          const unwantedPatterns = [
            'what brings you',
            'how can you help',
            'what can i help',
            'friendly go-to',
            'connecting people'
          ];
          const hasUnwanted = unwantedPatterns.some(pattern => 
            content.toLowerCase().includes(pattern)
          );
          if (hasUnwanted) {
            console.log(`    ⚠️  WARNING: This looks like an A1Zap-generated message!`);
          }
        });
      }
    }

    // Get current interview state
    let interviewState = groupProfileStorage.getInterviewState(chatId);
    
    // CRITICAL: Log interview state for debugging
    if (interviewState) {
      console.log(`📊 [Mandy] Interview state exists: questionNumber=${interviewState.questionNumber}, waitingForClarification=${interviewState.waitingForClarification}`);
    } else {
      console.log(`📊 [Mandy] No interview state - will start interview`);
    }
    
    // Additional deduplication: track recent responses per chat to prevent duplicates
    if (!this.recentResponses) {
      this.recentResponses = new Map(); // chatId -> { lastResponse, timestamp }
    }
    
    // Check if we just sent a response for this chat (within last 2 seconds)
    // DISABLED for now - this was causing false positives
    // const recentResponse = this.recentResponses.get(chatId);
    // if (recentResponse && (Date.now() - recentResponse.timestamp < 2000)) {
    //   console.log(`⚠️  [Mandy] Duplicate request detected (same chat, recent response) - skipping`);
    //   return {
    //     response: null,
    //     sent: true
    //   };
    // }

    // If no state exists, this is the start - ALWAYS start the interview immediately
    // IMPORTANT: Do NOT use AI to generate responses here - only use handleStart logic
    // Do NOT generate welcome messages - that's handled by chat.started event
    // ALWAYS return a response to prevent A1Zap from generating fallback messages
    if (!interviewState) {
      // If userMessage is empty or just whitespace, start interview anyway (they might have sent an empty message)
      if (!userMessage || userMessage.trim().length === 0) {
        console.log(`⚠️  [Mandy] Empty user message - starting interview anyway to prevent A1Zap fallback`);
        const interviewState = {
          questionNumber: 1,
          answers: {},
          waitingForClarification: false,
          clarificationQuestion: null,
          startedAt: new Date().toISOString()
        };
        groupProfileStorage.setInterviewState(chatId, interviewState);
        const questions = mandyAgent.getQuestions();
        return {
          response: questions[0],
          sent: false
        };
      }
      
      // Check if this looks like an auto-generated greeting from A1Zap (specific patterns)
      const lowerMessage = userMessage.toLowerCase().trim();
      const autoGreetingPatterns = [
        'what are we working on', 
        'how can you help', 'what can you do', 'what can i help you with',
        'what brings you', 'what brings you in', 'what brings you in today'
      ];
      
      const isAutoGreeting = autoGreetingPatterns.some(pattern => 
        lowerMessage === pattern || lowerMessage.startsWith(pattern + ' ') || lowerMessage.includes(pattern)
      );
      
      if (isAutoGreeting) {
        // Start interview immediately without responding to the greeting
        console.log(`⚠️  [Mandy] Detected A1Zap auto-greeting - starting interview immediately`);
        const interviewState = {
          questionNumber: 1,
          answers: {},
          waitingForClarification: false,
          clarificationQuestion: null,
          startedAt: new Date().toISOString()
        };
        groupProfileStorage.setInterviewState(chatId, interviewState);
        const questions = mandyAgent.getQuestions();
        return {
          response: questions[0],
          sent: false
        };
      }
      
      // For any other message, start the interview immediately
      // This will automatically begin asking questions
      // ALWAYS return a response to prevent A1Zap from generating fallback messages
      return await this.handleStart(chatId, userMessage);
    }

    // CRITICAL: During interview (questions 1-10), NEVER use AI - only use structured questions
    // If interview is complete (questionNumber > 10), handle post-interview messages
    if (interviewState.questionNumber > 10) {
      console.log(`✅ [Mandy] Interview complete (questionNumber: ${interviewState.questionNumber}) - using post-interview handler`);
      return await this.handlePostInterview(chatId, userMessage);
    }

    // Validate interview state
    if (!interviewState.questionNumber || interviewState.questionNumber < 1 || interviewState.questionNumber > 10) {
      console.error(`❌ [Mandy] Invalid interview state - questionNumber: ${interviewState.questionNumber}, resetting to question 1`);
      // Reset and start over
      const questions = mandyAgent.getQuestions();
      interviewState = {
        questionNumber: 1,
        answers: {},
        waitingForClarification: false,
        clarificationQuestion: null,
        startedAt: new Date().toISOString()
      };
      groupProfileStorage.setInterviewState(chatId, interviewState);
      return {
        response: questions[0],
        sent: false
      };
    }

    // CRITICAL: During interview, we MUST use structured questions only
    // NEVER use AI to generate conversational responses during the interview
    console.log(`✅ [Mandy] Processing interview question ${interviewState.questionNumber}/10 - using structured questions only`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   User message: "${userMessage}"`);
    console.log(`   Full interview state:`, JSON.stringify({
      questionNumber: interviewState.questionNumber,
      answersCount: Object.keys(interviewState.answers || {}).length,
      waitingForClarification: interviewState.waitingForClarification,
      groupName: interviewState.groupName
    }, null, 2));
    
    // WRAPPER: Ensure we ALWAYS return a valid response, no matter what happens
    let result;
    try {
      console.log(`🔄 [Mandy] Calling processQuestionAnswer...`);
      const processResult = await this.processQuestionAnswer(chatId, userMessage, conversation, interviewState);
      
      console.log(`✅ [Mandy] processQuestionAnswer returned`);
      console.log(`   Type: ${typeof processResult}`);
      console.log(`   Is null: ${processResult === null}`);
      console.log(`   Is undefined: ${processResult === undefined}`);
      
      if (processResult) {
        console.log(`   Keys: ${Object.keys(processResult).join(', ')}`);
        console.log(`   Has response: ${processResult.hasOwnProperty('response')}`);
        console.log(`   Response value: ${processResult.response === null ? 'NULL' : processResult.response === undefined ? 'UNDEFINED' : `"${String(processResult.response).substring(0, 50)}"`}`);
        console.log(`   Sent flag: ${processResult.sent}`);
      }
      
      // Validate result
      if (!processResult) {
        throw new Error('processQuestionAnswer returned null or undefined');
      }
      if (typeof processResult !== 'object') {
        throw new Error(`processQuestionAnswer returned non-object: ${typeof processResult} (value: ${processResult})`);
      }
      if (!processResult.hasOwnProperty('response')) {
        throw new Error('processQuestionAnswer result missing "response" property');
      }
      if (processResult.response === null || processResult.response === undefined) {
        throw new Error(`processQuestionAnswer result.response is ${processResult.response === null ? 'null' : 'undefined'}`);
      }
      if (typeof processResult.response !== 'string' || processResult.response.trim().length === 0) {
        throw new Error(`processQuestionAnswer result.response is invalid: "${processResult.response}"`);
      }
      
      // Result is valid
      result = processResult;
      console.log(`✅ [Mandy] Result validation passed`);
      
    } catch (error) {
      console.error(`\n${'='.repeat(80)}`);
      console.error(`❌ [Mandy] CRITICAL ERROR in processQuestionAnswer`);
      console.error(`${'='.repeat(80)}`);
      console.error(`   Error type: ${error.constructor.name}`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack:`);
      console.error(error.stack);
      console.error(`   Chat ID: ${chatId}`);
      console.error(`   Question number: ${interviewState.questionNumber}`);
      console.error(`   User message: "${userMessage}"`);
      console.error(`${'='.repeat(80)}\n`);
      
      // Create guaranteed-valid fallback response
      const questions = mandyAgent.getQuestions();
      if (!questions || questions.length === 0) {
        result = {
          response: "I'm having technical difficulties. Please try again in a moment.",
          sent: false,
          error: error.message
        };
      } else {
        const currentQuestionIndex = interviewState.questionNumber - 1;
        if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
          result = {
            response: questions[currentQuestionIndex],
            sent: false,
            error: error.message
          };
          console.log(`✅ [Mandy] Using fallback: re-asking current question`);
        } else {
          result = {
            response: "I encountered an error processing your answer. Could you try answering that again?",
            sent: false,
            error: error.message
          };
          console.log(`✅ [Mandy] Using fallback: generic error message`);
        }
      }
    }
    
    // CRITICAL: Final safety check - ensure result is ALWAYS valid before returning
    if (!result) {
      console.error(`❌ [Mandy] FATAL: result is still null/undefined after error handling!`);
      result = {
        response: "I'm having trouble processing your answer. Please try again.",
        sent: false
      };
    }
    
    if (typeof result !== 'object') {
      console.error(`❌ [Mandy] FATAL: result is not an object: ${typeof result}`);
      result = {
        response: "I'm having trouble processing your answer. Please try again.",
        sent: false
      };
    }
    
    if (!result.hasOwnProperty('response') || result.response === null || result.response === undefined) {
      console.error(`❌ [Mandy] FATAL: result.response is invalid!`);
      console.error(`   Result:`, JSON.stringify(result, null, 2));
      
      const questions = mandyAgent.getQuestions();
      const currentQuestionIndex = interviewState.questionNumber - 1;
      if (questions && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        result.response = questions[currentQuestionIndex];
      } else {
        result.response = "I didn't catch that. Could you answer the question?";
      }
      result.sent = false;
    }
    
    // Ensure response is a non-empty string
    if (typeof result.response !== 'string' || result.response.trim().length === 0) {
      console.error(`❌ [Mandy] FATAL: result.response is empty or not a string!`);
      const questions = mandyAgent.getQuestions();
      const currentQuestionIndex = interviewState.questionNumber - 1;
      if (questions && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        result.response = questions[currentQuestionIndex];
      } else {
        result.response = "I didn't catch that. Could you answer the question?";
      }
      result.sent = false;
    }
    
    // Ensure sent flag is explicitly set
    if (result.sent === undefined || result.sent === null) {
      result.sent = false;
    }
    
    // Final log
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ [Mandy] FINAL RESULT (guaranteed valid)`);
    console.log(`${'='.repeat(80)}`);
    console.log(`   Response length: ${result.response.length} chars`);
    console.log(`   Response preview: "${result.response.substring(0, 100)}"`);
    console.log(`   Sent flag: ${result.sent}`);
    console.log(`   Has error field: ${result.hasOwnProperty('error')}`);
    console.log(`${'='.repeat(80)}\n`);
    
    return result;
    
    // Track this response to prevent duplicates
    if (result && result.response) {
      this.recentResponses.set(chatId, {
        lastResponse: result.response.substring(0, 50),
        timestamp: Date.now()
      });
      
      // Clean up old entries (older than 10 seconds)
      for (const [cid, resp] of this.recentResponses.entries()) {
        if (Date.now() - resp.timestamp > 10000) {
          this.recentResponses.delete(cid);
        }
      }
    }
    
    return result;
  }

  /**
   * Handle the start of the interview - check if group is ready
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User message
   * @returns {Promise<Object>} Response
   */
  async handleStart(chatId, userMessage) {
    // Welcome message should already be sent via chat.started event
    // Start the interview automatically - any message means they're ready to start
    
    const lowerMessage = userMessage.toLowerCase().trim();
    const readyKeywords = ['ready', 'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'let\'s go', 'let\'s start', 'start'];
    const notReadyKeywords = ['not ready', 'wait', 'hold on', 'not yet', 'later'];

    // Check if they explicitly say NOT ready
    const isNotReady = notReadyKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isNotReady) {
      console.log(`ℹ️  [Mandy] User said not ready - message: "${userMessage}"`);
      return {
        response: "No worries! Just let me know when all your groupmates are here and you're ready to start. I'll be here! 😊",
        sent: false
      };
    }

    // Otherwise, start the interview automatically
    // Any message (except "not ready") means they want to start
    console.log(`✅ [Mandy] Starting interview automatically for chat ${chatId}`);
    console.log(`  User message: "${userMessage}"`);
    
    // Initialize interview state
    const interviewState = {
      questionNumber: 1,
      answers: {},
      waitingForClarification: false,
      clarificationQuestion: null,
      startedAt: new Date().toISOString()
    };
    groupProfileStorage.setInterviewState(chatId, interviewState);
    console.log(`✅ [Mandy] Interview state initialized - questionNumber: 1`);

    // Ask first question
    const questions = mandyAgent.getQuestions();
    console.log(`✅ [Mandy] Asking question 1: "${questions[0]}"`);
    console.log(`✅ [Mandy] Total questions available: ${questions.length}`);
    
    return {
      response: questions[0],
      sent: false
    };
  }

  /**
   * Process answer to current question
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User's answer
   * @param {Array} conversation - Conversation history
   * @param {Object} interviewState - Current interview state
   * @returns {Promise<Object>} Response
   */
  async processQuestionAnswer(chatId, userMessage, conversation, interviewState) {
    // Validate inputs
    if (!chatId) {
      throw new Error('Missing chatId in processQuestionAnswer');
    }
    if (!interviewState) {
      throw new Error('Missing interviewState in processQuestionAnswer');
    }
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error(`Invalid userMessage in processQuestionAnswer: ${typeof userMessage}`);
    }
    
    const questions = mandyAgent.getQuestions();
    if (!questions || questions.length !== 10) {
      throw new Error(`Invalid questions array: expected 10, got ${questions?.length || 0}`);
    }
    
    const currentQuestionIndex = interviewState.questionNumber - 1;
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
      throw new Error(`Invalid questionNumber: ${interviewState.questionNumber} (index: ${currentQuestionIndex})`);
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    
    console.log(`\n[Mandy] Processing question answer:`);
    console.log(`  Chat ID: ${chatId}`);
    console.log(`  Current question number: ${interviewState.questionNumber}`);
    console.log(`  Current question: "${currentQuestion}"`);
    console.log(`  User answer: "${userMessage.substring(0, 100)}..."`);
    console.log(`  Interview state:`, JSON.stringify({
      questionNumber: interviewState.questionNumber,
      waitingForClarification: interviewState.waitingForClarification,
      answersCount: Object.keys(interviewState.answers || {}).length
    }));

    // If we're waiting for clarification, process that first
    if (interviewState.waitingForClarification) {
      return await this.handleClarification(chatId, userMessage, conversation, interviewState);
    }

    // Validate the answer using AI
    console.log(`🔍 [Mandy] Validating answer for question ${interviewState.questionNumber}...`);
    let validationResult;
    try {
      validationResult = await this.validateAnswer(
        currentQuestion,
        userMessage,
        interviewState.questionNumber,
        interviewState
      );
      console.log(`✅ [Mandy] Validation result: isValid=${validationResult.isValid}`);
    } catch (error) {
      console.error(`❌ [Mandy] Validation error:`, error);
      // On validation error, accept the answer and continue
      validationResult = { isValid: true };
    }

    if (!validationResult.isValid) {
      // Answer needs clarification
      console.log(`⚠️  [Mandy] Answer needs clarification - setting clarification state`);
      interviewState.waitingForClarification = true;
      interviewState.clarificationQuestion = validationResult.clarificationQuestion;
      groupProfileStorage.setInterviewState(chatId, interviewState);

      return {
        response: validationResult.clarificationQuestion || "Could you tell me a bit more about that?",
        sent: false
      };
    }

    console.log(`✅ [Mandy] Answer validated - proceeding to save...`);

    // Special handling for question 1 (group name) - check uniqueness BEFORE saving
    if (interviewState.questionNumber === 1) {
      const groupName = userMessage.trim();
      if (groupProfileStorage.groupNameExists(groupName)) {
        interviewState.waitingForClarification = true;
        interviewState.clarificationQuestion = `Hmm, it looks like there's already a group with that name! Could you choose a different group name?`;
        groupProfileStorage.setInterviewState(chatId, interviewState);
        return {
          response: `Hmm, it looks like there's already a group with that name! Could you choose a different group name?`,
          sent: false
        };
      }
      interviewState.groupName = groupName;
      console.log(`✅ [Mandy] Group name set: "${groupName}"`);
    }

    // Answer is valid - save it
    const answerKey = this.getAnswerKey(interviewState.questionNumber);
    interviewState.answers[answerKey] = userMessage;
    console.log(`✅ [Mandy] Answer saved: ${answerKey} = "${userMessage.substring(0, 50)}..."`);

    // Move to next question
    const previousQuestionNumber = interviewState.questionNumber;
    interviewState.questionNumber++;
    interviewState.waitingForClarification = false;
    interviewState.clarificationQuestion = null;

    console.log(`✅ [Mandy] Moved from question ${previousQuestionNumber} to question ${interviewState.questionNumber}`);

    // Check if we're done
    if (interviewState.questionNumber > 10) {
      // Interview complete - save profile
      console.log(`🎉 [Mandy] Interview complete - all 10 questions answered!`);
      return await this.completeInterview(chatId, interviewState);
    }

    // Ask next question
    const nextQuestion = questions[interviewState.questionNumber - 1];
    if (!nextQuestion) {
      console.error(`❌ [Mandy] ERROR: No question found for index ${interviewState.questionNumber - 1}`);
      return {
        response: "I'm having trouble finding the next question. Please try again.",
        sent: false
      };
    }

    // Save state BEFORE returning response
    groupProfileStorage.setInterviewState(chatId, interviewState);
    console.log(`✅ [Mandy] Interview state saved: questionNumber=${interviewState.questionNumber}`);

    // Acknowledge answer with fun, contextual response and ask next question
    // CRITICAL: This MUST always get an acknowledgment, even if AI fails
    let acknowledgment;
    try {
      console.log(`🔄 [Mandy] Getting acknowledgment for question ${previousQuestionNumber}...`);
      
      // For question 1 (group name) and question 3 (ideal day), use quick pattern-based acknowledgment to avoid delays
      if (previousQuestionNumber === 1) {
        const funResponses = [
          `"${userMessage.trim()}" - I love it! 😄`,
          `"${userMessage.trim()}" sounds like a crew! 🔥`,
          `Ooh, "${userMessage.trim()}" - that's going on the list! ✨`,
          `"${userMessage.trim()}" - iconic name choice! 💫`,
          `"${userMessage.trim()}" - I can already tell this group has vibes! 🎉`
        ];
        acknowledgment = funResponses[Math.floor(Math.random() * funResponses.length)];
        console.log(`✅ [Mandy] Using quick pattern-based acknowledgment for question 1`);
      } else if (previousQuestionNumber === 3) {
        // Quick pattern-based acknowledgment for question 3 (ideal day) to avoid AI delays
        const answerLower = userMessage.toLowerCase();
        if (answerLower.includes('beach') || answerLower.includes('ocean') || answerLower.includes('water')) {
          acknowledgment = `Beach vibes? I'm already jealous! 🏖️`;
        } else if (answerLower.includes('burrito') || answerLower.includes('burritos')) {
          acknowledgment = `Burrito connoisseur? I respect the dedication! 🌯`;
        } else if (answerLower.includes('coffee') || answerLower.includes('cafe')) {
          acknowledgment = `Coffee shop adventures? A group after my own heart! ☕`;
        } else if (answerLower.includes('travel') || answerLower.includes('trip') || answerLower.includes('explore')) {
          acknowledgment = `Wanderlust crew? I'm here for it! ✈️`;
        } else if (answerLower.includes('chill') || answerLower.includes('relax') || answerLower.includes('netflix')) {
          acknowledgment = `Chill vibes only? That's valid! 😌`;
        } else if (answerLower.includes('eat') || answerLower.includes('food') || answerLower.includes('taco') || answerLower.includes('tacos')) {
          acknowledgment = `Foodie vibes? Now I'm hungry! 🍽️`;
        } else {
          acknowledgment = `That sounds like such a good time! 😊`;
        }
        console.log(`✅ [Mandy] Using quick pattern-based acknowledgment for question 3`);
      } else {
        // Generate AI-powered contextual acknowledgment with timeout for other questions
        // getFunAcknowledgment already has its own timeout and fallback, but add extra safety
        const overallTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Overall acknowledgment timeout')), 6000)
        );
        
        acknowledgment = await Promise.race([
          this.getFunAcknowledgment(previousQuestionNumber, userMessage, interviewState.answers),
          overallTimeout
        ]);
      }
      
      // Validate acknowledgment
      if (!acknowledgment || typeof acknowledgment !== 'string' || acknowledgment.trim().length === 0) {
        throw new Error('Acknowledgment is empty or invalid');
      }
      
      console.log(`✅ [Mandy] Got acknowledgment: "${acknowledgment.substring(0, 50)}..."`);
    } catch (error) {
      console.error(`❌ [Mandy] Error or timeout getting acknowledgment:`, error.message);
      console.error(`   Question: ${previousQuestionNumber}, Answer: "${userMessage.substring(0, 50)}"`);
      console.error(`   Using fallback acknowledgment...`);
      // Fallback to simple acknowledgment - this should NEVER fail
      try {
        acknowledgment = this.getAcknowledgment(previousQuestionNumber);
        if (!acknowledgment || acknowledgment.trim().length === 0) {
          acknowledgment = "Got it! 😊"; // Ultimate fallback
        }
      } catch (fallbackError) {
        console.error(`❌ [Mandy] Even fallback acknowledgment failed! Using ultimate fallback.`);
        acknowledgment = "Got it! 😊";
      }
    }
    
    const responseText = `${acknowledgment}\n\n${nextQuestion}`;
    
    console.log(`✅ [Mandy] Returning response with question ${interviewState.questionNumber}: "${nextQuestion.substring(0, 50)}..."`);
    
    return {
      response: responseText,
      sent: false
    };
  }

  /**
   * Handle clarification follow-up
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User's clarification
   * @param {Array} conversation - Conversation history
   * @param {Object} interviewState - Current interview state
   * @returns {Promise<Object>} Response
   */
  async handleClarification(chatId, userMessage, conversation, interviewState) {
    const questions = mandyAgent.getQuestions();
    const currentQuestionIndex = interviewState.questionNumber - 1;
    const currentQuestion = questions[currentQuestionIndex];

    // Validate the clarification answer
    const validationResult = await this.validateAnswer(
      currentQuestion,
      userMessage,
      interviewState.questionNumber,
      interviewState
    );

    if (!validationResult.isValid) {
      // Check if we've already asked for clarification on this question
      // If so, accept the answer anyway to prevent infinite loops
      if (interviewState.clarificationCount >= 1) {
        console.log(`⚠️  [Mandy] Already asked for clarification once - accepting answer to prevent loop`);
        // Fall through to accept it
      } else {
        // First clarification request
        interviewState.clarificationCount = (interviewState.clarificationCount || 0) + 1;
        interviewState.waitingForClarification = true;
        interviewState.clarificationQuestion = validationResult.clarificationQuestion;
        groupProfileStorage.setInterviewState(chatId, interviewState);
        return {
          response: validationResult.clarificationQuestion || "Could you tell me a bit more about that?",
          sent: false
        };
      }
    }
    
    // Reset clarification count when we get a valid answer
    interviewState.clarificationCount = 0;

    // Special handling for question 1 (group name) - check uniqueness BEFORE saving
    if (interviewState.questionNumber === 1) {
      const groupName = userMessage.trim();
      if (groupProfileStorage.groupNameExists(groupName)) {
        return {
          response: `That name is also taken! Could you try a different one? Maybe add your year or something unique?`,
          sent: false
        };
      }
      interviewState.groupName = groupName;
    }

    // Clarification is good - save answer
    const answerKey = this.getAnswerKey(interviewState.questionNumber);
    interviewState.answers[answerKey] = userMessage;

    // Move to next question
    interviewState.questionNumber++;
    interviewState.waitingForClarification = false;
    interviewState.clarificationQuestion = null;

    if (interviewState.questionNumber > 10) {
      return await this.completeInterview(chatId, interviewState);
    }

    const nextQuestion = questions[interviewState.questionNumber - 1];
    groupProfileStorage.setInterviewState(chatId, interviewState);

    // Use fun acknowledgment (same as regular flow) with timeout protection
    const previousQuestionNumber = interviewState.questionNumber - 1;
    let acknowledgment;
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Acknowledgment timeout')), 5000)
      );
      
      acknowledgment = await Promise.race([
        this.getFunAcknowledgment(previousQuestionNumber, userMessage, interviewState.answers),
        timeoutPromise
      ]);
    } catch (error) {
      console.error(`❌ [Mandy] Error or timeout getting acknowledgment in clarification:`, error.message);
      // Fallback to simple acknowledgment
      acknowledgment = "Perfect! Thanks for clarifying! 😊";
    }
    
    const responseText = `${acknowledgment}\n\n${nextQuestion}`;

    return {
      response: responseText,
      sent: false
    };
  }

  /**
   * Validate an answer using AI with fallback logic
   * @param {string} question - The question asked
   * @param {string} answer - The user's answer
   * @param {number} questionNumber - Question number (1-10)
   * @returns {Promise<Object>} { isValid, clarificationQuestion }
   */
  async validateAnswer(question, answer, questionNumber, interviewState = null) {
    const trimmedAnswer = (answer || '').trim();
    
    // Pre-validation: Check for clearly valid answers before AI validation
    // This prevents AI from incorrectly rejecting valid answers
    
    // Question 2: Group size - must be a number (extract number from text like "3 people")
    if (questionNumber === 2) {
      // Extract the first number from the answer (handles "3 people", "5 members", etc.)
      const numberMatch = trimmedAnswer.match(/\d+/);
      if (numberMatch) {
        const numericValue = parseInt(numberMatch[0], 10);
        if (!isNaN(numericValue) && numericValue > 0 && numericValue <= 100) {
          console.log(`✅ [Mandy] Question 2 pre-validation passed: "${trimmedAnswer}" -> extracted ${numericValue}`);
          return { isValid: true };
        }
      }
      // If no valid number found, proceed to AI validation for better error message
      console.log(`⚠️  [Mandy] Question 2 pre-validation failed: "${trimmedAnswer}" - no valid number found`);
    }
    
    // Question 8: Emoji - check if it contains emoji or emoji description
    if (questionNumber === 8) {
      // Basic emoji detection (Unicode emoji range or common emoji descriptions)
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
      const emojiKeywords = ['emoji', 'smile', 'happy', 'sad', 'angry', 'heart', 'star', 'fire', 'thumbs'];
      const hasEmoji = emojiRegex.test(trimmedAnswer);
      const hasEmojiKeyword = emojiKeywords.some(keyword => 
        trimmedAnswer.toLowerCase().includes(keyword)
      );
      
      if (hasEmoji || hasEmojiKeyword || trimmedAnswer.length <= 20) {
        // Emoji, emoji keyword, or short description - likely valid
        console.log(`✅ [Mandy] Question 8 pre-validation passed: "${trimmedAnswer}"`);
        return { isValid: true };
      }
    }
    
    // Question 1: Group name - must not be just "yes", "ok", etc.
    if (questionNumber === 1) {
      const lowerAnswer = trimmedAnswer.toLowerCase();
      const invalidNames = ['yes', 'ok', 'okay', 'sure', 'ready', 'yep', 'yeah', 'yup'];
      if (invalidNames.includes(lowerAnswer) || trimmedAnswer.length < 2) {
        console.log(`⚠️  [Mandy] Question 1 pre-validation failed: "${trimmedAnswer}" is not a valid group name`);
        return {
          isValid: false,
          clarificationQuestion: "That doesn't sound like a group name! What would you like to call your group?"
        };
      }
      // If it looks like a name (more than 2 chars, not just yes/no), pre-validate as good
      if (trimmedAnswer.length >= 2) {
        console.log(`✅ [Mandy] Question 1 pre-validation passed: "${trimmedAnswer}"`);
        // Still run AI validation to check for uniqueness, but this helps catch obvious cases
      }
    }

    // Get group size for question 4 validation
    let groupSize = null;
    if (questionNumber === 4 && interviewState && interviewState.answers && interviewState.answers.q2) {
      groupSize = parseInt(interviewState.answers.q2) || null;
    }
    
    // AI validation for more nuanced cases
    const validationPrompt = `You are validating answers for a group matchmaking interview.

Question ${questionNumber}: "${question}"
Answer: "${answer}"
${questionNumber === 4 && groupSize ? `GROUP SIZE: ${groupSize} people` : ''}

Determine if this answer:
1. Makes sense in the context of the question
2. Is clear and understandable
3. Provides meaningful information

If the answer is unclear, confusing, too vague, or doesn't make sense, provide a friendly follow-up question to clarify.
If the answer is good, respond with "VALID".

Special rules:
- For question 1 (group name): Must be a name, not just "yes" or "ok"
- For question 2 (group size): Should be a number (1-100). Examples: "4", "5", "10" are all VALID
- For question 4 (fictional group): 
  * If group size is 1, individual characters are VALID (e.g., "Paul Atreides", "Harry Potter")
  * If group size is 2+, duos/groups are VALID (e.g., "Naruto and Sasuke" for 2 people, "The Fellowship" for multiple)
  * Accept any fictional character(s), group, or team reference
- For question 8 (emoji): Should be an emoji or emoji description. Examples: "🎨", "smiley face", "happy" are all VALID
- For question 9 (Roman Empire): This is asking about a random thing the group thinks about too much (meme reference). 
  * ANY substantive answer is VALID - could be a word, phrase, concept, object, etc.
  * Examples: "Pensées", "Coffee", "That one scene from that movie", "Pizza", "Philosophy" - ALL VALID
  * Only reject if it's completely empty or just "yes/no"
- For question 10 (side quest): ANY story or description is VALID - be VERY lenient
- Other questions: Should be substantive answers, not just "yes/no"

CRITICAL: 
- For question 2, ANY numeric answer (like "4", "5", "10") is VALID. Only reject if it's clearly not a number.
- For question 4, be VERY lenient - accept individual characters for solo groups, and duos/groups for multiple people.
- For questions 9 and 10, be EXTREMELY lenient - accept almost any non-empty answer. These are open-ended questions.

Respond in this format:
If valid: "VALID"
If needs clarification: "CLARIFY: [your friendly follow-up question here]"

Your response:`;

    try {
      console.log(`🤖 [Mandy] Running AI validation for question ${questionNumber}: "${trimmedAnswer.substring(0, 50)}..."`);
      
      const response = await claudeService.generateText(validationPrompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      const trimmed = response.trim().toUpperCase();
      console.log(`🤖 [Mandy] AI validation response: "${response.substring(0, 100)}..."`);

      if (trimmed.startsWith('VALID')) {
        console.log(`✅ [Mandy] AI validation: VALID`);
        return { isValid: true };
      } else if (trimmed.startsWith('CLARIFY:')) {
        const clarificationQuestion = response.substring(8).trim();
        console.log(`⚠️  [Mandy] AI validation: NEEDS CLARIFICATION`);
        console.log(`   Clarification question: "${clarificationQuestion}"`);
        
        // Fallback: If AI rejected but answer is clearly valid, accept it anyway
        // This is a safety net for AI validation failures
        if (questionNumber === 2) {
          // Extract number from text (handles "3 people", "5 members", etc.)
          const numberMatch = trimmedAnswer.match(/\d+/);
          if (numberMatch) {
            const numericValue = parseInt(numberMatch[0], 10);
            if (!isNaN(numericValue) && numericValue > 0 && numericValue <= 100) {
              console.log(`✅ [Mandy] FALLBACK: AI rejected but answer contains valid number (${numericValue}) - accepting anyway`);
              return { isValid: true };
            }
          }
        }
        
        // For questions 9 and 10, be VERY lenient - accept almost anything non-empty
        if (questionNumber === 9 || questionNumber === 10) {
          if (trimmedAnswer.length > 0 && trimmedAnswer.length < 500) {
            console.log(`✅ [Mandy] FALLBACK: AI asked for clarification on Q${questionNumber}, but answer is non-empty - accepting anyway (lenient for open-ended questions)`);
            return { isValid: true };
          }
        }
        
        return {
          isValid: false,
          clarificationQuestion: clarificationQuestion || "Could you tell me a bit more about that?"
        };
      } else {
        // Default to valid if unclear response from AI
        console.log(`⚠️  [Mandy] AI validation: UNCLEAR RESPONSE, defaulting to VALID`);
        return { isValid: true };
      }
    } catch (error) {
      console.error(`❌ [Mandy] Error validating answer for question ${questionNumber}:`, error.message);
      console.error(`   Answer was: "${trimmedAnswer}"`);
      
      // On error, use fallback validation
      if (questionNumber === 2) {
        // Extract number from text (handles "3 people", "5 members", etc.)
        const numberMatch = trimmedAnswer.match(/\d+/);
        if (numberMatch) {
          const numericValue = parseInt(numberMatch[0], 10);
          if (!isNaN(numericValue) && numericValue > 0 && numericValue <= 100) {
            console.log(`✅ [Mandy] ERROR FALLBACK: Answer contains valid number (${numericValue}) - accepting`);
            return { isValid: true };
          }
        }
      }
      
      // For other questions, be more lenient on error
      if (trimmedAnswer.length > 0) {
        console.log(`✅ [Mandy] ERROR FALLBACK: Answer has content - accepting on error`);
        return { isValid: true };
      }
      
      // On error with empty answer, ask for clarification
      return {
        isValid: false,
        clarificationQuestion: "I didn't catch that! Could you answer the question?"
      };
    }
  }

  /**
   * Complete the interview and save the profile
   * @param {string} chatId - Chat ID
   * @param {Object} interviewState - Completed interview state
   * @returns {Promise<Object>} Response
   */
  async completeInterview(chatId, interviewState) {
    // Verify all 10 answers are present before saving
    const requiredAnswers = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
    const missingAnswers = requiredAnswers.filter(key => !interviewState.answers[key]);
    
    if (missingAnswers.length > 0) {
      console.error(`❌ Cannot save profile - missing answers: ${missingAnswers.join(', ')}`);
      // Ask for the missing answers
      const missingQuestionNumbers = missingAnswers.map(key => parseInt(key.substring(1)));
      const questions = mandyAgent.getQuestions();
      const nextMissingQuestion = questions[missingQuestionNumbers[0] - 1];
      
      return {
        response: `Oops! I need to ask you one more question:\n\n${nextMissingQuestion}`,
        sent: false
      };
    }

    // Verify group name exists
    if (!interviewState.groupName) {
      console.error('❌ Cannot save profile - missing group name');
      return {
        response: "I need your group name to save your profile. What's your group name?",
        sent: false
      };
    }

    // Create profile object
    const profile = {
      groupName: interviewState.groupName,
      chatId: chatId,
      answers: {
        question1: interviewState.answers.q1, // Group name
        question2: interviewState.answers.q2, // Group size
        question3: interviewState.answers.q3, // Ideal day
        question4: interviewState.answers.q4, // Fiction group
        question5: interviewState.answers.q5, // Music taste
        question6: interviewState.answers.q6, // Disliked celebrity
        question7: interviewState.answers.q7, // Origin story
        question8: interviewState.answers.q8, // Emoji
        question9: interviewState.answers.q9, // Roman Empire
        question10: interviewState.answers.q10 // Side quest
      },
      metadata: {
        startedAt: interviewState.startedAt,
        completedAt: new Date().toISOString()
      }
    };

    // Save profile (only saves when all 10 questions are answered)
    const savedProfile = groupProfileStorage.saveGroupProfile(profile);

    // Clear interview state
    groupProfileStorage.clearInterviewState(chatId);

    return {
      response: `🎉 Amazing! I've created your group's profile. Thanks for answering all my questions!\n\nYour group "${savedProfile.groupName}" is now in the matching pool. I'll let you know when we find a great match for you! 💫\n\nFeel free to chat with me anytime if you want to update your profile or just say hi! 😊`,
      sent: false
    };
  }

  /**
   * Handle messages after interview is complete
   * @param {string} chatId - Chat ID
   * @param {string} userMessage - User message
   * @returns {Promise<Object>} Response
   */
  async handlePostInterview(chatId, userMessage) {
    // Use AI to generate a friendly response, but keep it brief
    // IMPORTANT: Never generate welcome messages or greetings
    // Keep responses simple and direct to prevent A1Zap from generating its own
    const fullConversation = [
      { role: 'user', content: userMessage }
    ];

    const response = await claudeService.chatWithBaseFile(fullConversation, {
      ...mandyAgent.getGenerationOptions(),
      systemPrompt: mandyAgent.getSystemPrompt() + "\n\nCRITICAL RESTRICTIONS:\n- The interview is complete. The group profile has been saved.\n- Be friendly and conversational but BRIEF (1-2 sentences max).\n- You can answer questions about the matching process or just chat.\n- Do NOT ask any more interview questions.\n- NEVER generate welcome messages, greetings, or introductions.\n- NEVER say things like 'what brings you in today' or 'how can I help'.\n- Keep responses short and direct to prevent A1Zap from generating duplicate responses.",
      agentName: 'mandy',
      temperature: 0.5, // Lower temperature for more consistent responses
      maxTokens: 150 // Limit response length
    });

    return {
      response,
      sent: false
    };
  }

  /**
   * Get answer key for question number
   * @param {number} questionNumber - Question number (1-10)
   * @returns {string} Answer key (q1, q2, etc.)
   */
  getAnswerKey(questionNumber) {
    return `q${questionNumber}`;
  }

  /**
   * Get acknowledgment message for a question
   * @param {number} questionNumber - Question number (1-10)
   * @returns {string} Acknowledgment
   */
  getAcknowledgment(questionNumber) {
    const acknowledgments = [
      "Got it!",
      "Nice!",
      "Love it!",
      "That's awesome!",
      "Cool!",
      "Haha, noted!",
      "Perfect!",
      "Love that!",
      "That's great!",
      "Amazing!"
    ];
    return acknowledgments[questionNumber - 1] || "Thanks!";
  }

  /**
   * Get fun, contextual acknowledgment based on the answer using AI
   * @param {number} questionNumber - Question number (1-10)
   * @param {string} answer - User's answer
   * @param {Object} allAnswers - All answers collected so far
   * @returns {Promise<string>} Fun acknowledgment
   */
  async getFunAcknowledgment(questionNumber, answer, allAnswers) {
    const answerLower = (answer || '').toLowerCase().trim();
    
    // Use AI to generate contextual, funny acknowledgments
    // CRITICAL: This MUST always return a string, even if AI fails
    try {
      const groupSize = allAnswers?.q2 ? parseInt(allAnswers.q2) || null : null;
      const questions = mandyAgent.getQuestions();
      const questionText = questions[questionNumber - 1] || '';
      
      const acknowledgmentPrompt = `You are Mandy, a fun and playful Group Matchmaker Helper. After a user answers a question, you need to give a brief, funny, contextual acknowledgment that shows you actually understood what they said.

QUESTION ${questionNumber}: ${questionText}
USER'S ANSWER: "${answer}"
${groupSize ? `GROUP SIZE: ${groupSize} people` : ''}
${questionNumber > 1 ? `PREVIOUS ANSWERS: ${JSON.stringify(allAnswers).substring(0, 200)}` : ''}

Your task: Write a SHORT (1 sentence max), funny, playful acknowledgment that:
- Shows you understood their specific answer (not generic)
- Makes a clever joke, reference, or witty remark about what they said
- Uses emojis naturally (1-2 max)
- Feels alive and engaged - like you're actually reading their answer

CRITICAL: 
- For question 4 (fictional group), if group size is 1, individual characters are valid. If group size is 2+, duos/groups are valid (like "Naruto and Sasuke" for 2 people).
- Reference specific details from their answer (character names, places, activities, etc.)
- Be funny but friendly - roast them playfully if appropriate
- Keep it brief - this is just an acknowledgment before the next question

Examples:
- Answer: "eating burritos" → "Burrito connoisseur? I respect the dedication! 🌯"
- Answer: "eating tacos on a beach" → "Tacos AND beach? You're living my dream life! 🌮🏖️"
- Answer: "Paul Atreides" (group of 1) → "The Kwisatz Haderach? You're ambitious! 🔮"
- Answer: "Naruto and Sasuke" (group of 2) → "Naruto and Sasuke? That friendship arc hits different! 🍜"
- Answer: "The Sopranos" → "Tony Soprano vibes? I'm simultaneously scared and impressed! 😅"

Write ONLY the acknowledgment text (no quotation marks, no explanation):`;

      console.log(`🤖 [Mandy] Generating contextual acknowledgment for question ${questionNumber}...`);
      const startTime = Date.now();
      
      // Add timeout to prevent hanging - if AI takes too long, use fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI acknowledgment generation timeout')), 4000)
      );
      
      let aiAcknowledgment;
      try {
        aiAcknowledgment = await Promise.race([
          claudeService.generateText(acknowledgmentPrompt, {
            temperature: 0.8, // Higher temperature for more creative/funny responses
            maxTokens: 100 // Keep it short
          }),
          timeoutPromise
        ]);
      } catch (raceError) {
        // If it's a timeout, throw it to be caught by outer try-catch
        if (raceError.message.includes('timeout')) {
          const elapsed = Date.now() - startTime;
          console.error(`⏱️  [Mandy] AI acknowledgment timed out after ${elapsed}ms - using fallback`);
          throw raceError;
        }
        // Other errors - log and throw
        console.error(`❌ [Mandy] AI acknowledgment generation error:`, raceError.message);
        throw raceError;
      }
      
      const cleanedAck = (aiAcknowledgment || '').trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      console.log(`✅ [Mandy] AI generated acknowledgment: "${cleanedAck}"`);
      
      if (cleanedAck.length > 0 && cleanedAck.length < 200) {
        return cleanedAck;
      } else {
        console.log(`⚠️  [Mandy] AI acknowledgment invalid (length: ${cleanedAck.length}), using fallback`);
        // Fall through to fallback
      }
    } catch (error) {
      console.error(`❌ [Mandy] Error generating AI acknowledgment:`, error.message);
      console.error(`   Question: ${questionNumber}, Answer: "${answer}"`);
      console.error(`   Continuing with fallback acknowledgment...`);
      // Fall through to fallback
    }
    
    // Fallback to pattern-based responses if AI fails
    // Question 1: Group Name
    if (questionNumber === 1) {
      const funResponses = [
        `"${answer}" - I love it! 😄`,
        `"${answer}" sounds like a crew! 🔥`,
        `Ooh, "${answer}" - that's going on the list! ✨`,
        `"${answer}" - iconic name choice! 💫`,
        `"${answer}" - I can already tell this group has vibes! 🎉`
      ];
      return funResponses[Math.floor(Math.random() * funResponses.length)];
    }
    
    // Question 2: Group Size
    if (questionNumber === 2) {
      const numMatch = answer.match(/\d+/);
      const size = numMatch ? parseInt(numMatch[0]) : 0;
      if (size === 1) {
        return `Just you? Bold move, I respect it! 😎`;
      } else if (size === 2) {
        return `A dynamic duo! Love to see it! 👯`;
      } else if (size >= 3 && size <= 5) {
        return `Perfect size! ${size} is the sweet spot! 🎯`;
      } else if (size > 5 && size <= 10) {
        return `Whoa, ${size} people? That's a whole squad! 🔥`;
      } else if (size > 10) {
        return `${size}?! That's not a group, that's a MOVEMENT! 🚀`;
      }
      return `Nice crew size! 👌`;
    }
    
    // Question 3: Ideal Day
    if (questionNumber === 3) {
      if (answerLower.includes('burrito') || answerLower.includes('burritos')) {
        return `Burrito connoisseur? I respect the dedication! 🌯`;
      } else if (answerLower.includes('beach') || answerLower.includes('ocean') || answerLower.includes('water')) {
        return `Beach vibes? I'm already jealous! 🏖️`;
      } else if (answerLower.includes('coffee') || answerLower.includes('cafe')) {
        return `Coffee shop adventures? A group after my own heart! ☕`;
      } else if (answerLower.includes('travel') || answerLower.includes('trip') || answerLower.includes('explore')) {
        return `Wanderlust crew? I'm here for it! ✈️`;
      } else if (answerLower.includes('chill') || answerLower.includes('relax') || answerLower.includes('netflix')) {
        return `Chill vibes only? That's valid! 😌`;
      } else if (answerLower.includes('eat') || answerLower.includes('food') || answerLower.includes('taco') || answerLower.includes('tacos')) {
        return `Foodie vibes? Now I'm hungry! 🍽️`;
      }
      return `That sounds like such a good time! 😊`;
    }
    
    // Question 4: Fiction Group - accepts individuals (group size 1) or groups/duos (size 2+)
    if (questionNumber === 4) {
      const groupSize = allAnswers?.q2 ? parseInt(allAnswers.q2) || null : null;
      
      // For groups of 1, individual characters are valid
      // For groups of 2+, duos/trios/groups are valid (like "Naruto and Sasuke" for 2)
      if (groupSize === 1) {
        // Individual character is fine
        if (answerLower.includes('harry potter') || answerLower.includes('harry')) {
          return `The chosen one! Perfect for a solo act! 🧙`;
        } else if (answerLower.includes('paul') || answerLower.includes('atreides') || answerLower.includes('dune')) {
          return `Kwisatz Haderach vibes? You're ambitious! 🔮`;
        }
        return `Great character choice for a solo group! 💫`;
      } else {
        // Group of 2+ can be duos, trios, or groups
        if (answerLower.includes('naruto') && answerLower.includes('sasuke')) {
          return `Naruto and Sasuke? That friendship arc hits different! 🍜`;
        } else if (answerLower.includes('harry potter') || answerLower.includes('hogwarts')) {
          return `Wizards unite! 🧙✨`;
        } else if (answerLower.includes('suits') || answerLower.includes('harvey') || answerLower.includes('mike')) {
          return `Lawyer energy? I'm intimidated (in a good way)! ⚖️`;
        } else if (answerLower.includes('friends') || answerLower.includes('central perk')) {
          return `The one where you're all Friends? Classic! 👯`;
        } else if (answerLower.includes('sopranos') || answerLower.includes('tony soprano')) {
          return `Tony Soprano vibes? I'm simultaneously scared and impressed! 😅`;
        } else if (answerLower.includes('star wars') || answerLower.includes('jedi')) {
          return `May the force be with your group! ⭐`;
        }
        return `That's such a good pick! Love the reference! 💫`;
      }
    }
    
    // Question 5: Music Taste
    if (questionNumber === 5) {
      if (answerLower.includes('rock') || answerLower.includes('indie')) {
        return `Indie rock? Y'all have taste! 🎸`;
      } else if (answerLower.includes('pop') || answerLower.includes('mainstream')) {
        return `Pop bangers? Can't go wrong with that! 🎵`;
      } else if (answerLower.includes('rap') || answerLower.includes('hip hop')) {
        return `Rap vibes? That's fire! 🔥`;
      } else if (answerLower.includes('country')) {
        return `Country music? Unexpected but I'm here for it! 🤠`;
      }
      return `Great music taste! Now I want to hear your playlist! 🎧`;
    }
    
    // Question 6: Disliked Celebrity
    if (questionNumber === 6) {
      const roasts = [
        `Not a ${answer} fan? Haha, noted! 😂`,
        `${answer}? Oof, fair enough! 😅`,
        `Avoiding ${answer} at all costs? I respect it! 🙈`,
        `${answer}? Yikes, I'll make a note of that! 📝`,
        `Not ${answer}? That's valid! 😄`
      ];
      return roasts[Math.floor(Math.random() * roasts.length)];
    }
    
    // Question 7: Origin Story
    if (questionNumber === 7) {
      if (answerLower.includes('drunk') || answerLower.includes('party') || answerLower.includes('bar')) {
        return `Alcohol was involved? The best origin stories usually are! 🍻`;
      } else if (answerLower.includes('met') || answerLower.includes('found')) {
        return `That's such a good origin story! 🎬`;
      } else if (answerLower.includes('college') || answerLower.includes('school') || answerLower.includes('class')) {
        return `Academic meet-cute? Love it! 📚`;
      }
      return `That's iconic! I'm already invested in this story! 📖`;
    }
    
    // Question 8: Emoji
    if (questionNumber === 8) {
      const emojiResponses = [
        `That emoji is SO you guys! ${answer}`,
        `${answer} - perfection! Couldn't have picked better!`,
        `That emoji captures the vibes! ${answer} ✨`,
        `${answer} - chef's kiss! 👨‍🍳💋`,
        `I can see it! ${answer} fits perfectly! 💯`
      ];
      return emojiResponses[Math.floor(Math.random() * emojiResponses.length)];
    }
    
    // Question 9: Roman Empire
    if (questionNumber === 9) {
      if (answerLower.includes('viper') || answerLower.includes('zootopia') || answerLower.includes('window')) {
        return `Window viper? I need to see this meme immediately! 😂`;
      } else if (answerLower.includes('rome') || answerLower.includes('roman') || answerLower.includes('ancient')) {
        return `Actual Roman Empire facts? That's dedication! 🏛️`;
      } else if (answerLower.length > 50) {
        return `That's... specific. I love the passion! 😄`;
      }
      return `That's such a random but amazing thing to think about! Love it! 🤔`;
    }
    
    // Question 10: Side Quest
    if (questionNumber === 10) {
      if (answerLower.includes('lost') || answerLower.includes('get lost') || answerLower.includes('lost')) {
        return `Got lost together? That's when you know it's real! 🗺️`;
      } else if (answerLower.includes('travel') || answerLower.includes('trip') || answerLower.includes('went to')) {
        return `Travel side quest? Now THAT'S an adventure! ✈️`;
      } else if (answerLower.includes('drove') || answerLower.includes('road trip')) {
        return `Road trip chaos? The best kind of side quest! 🚗`;
      }
      return `That sounds absolutely unhinged (in the best way)! 🔥`;
    }
    
    // Fallback for any other question
    const fallbacks = [
      "Love it!",
      "That's awesome!",
      "Haha, noted!",
      "Perfect!",
      "That's great! 😊"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
      console.log('✅ [Mandy] Message already sent by agent logic');
      return;
    }

    // If result has an imageUrl, it was already sent by agent-specific logic
    if (result.imageUrl) {
      console.log('✅ [Mandy] Media message already sent by agent logic');
      return;
    }

    // CRITICAL: Always send a response to prevent A1Zap from generating its own
    if (result.response) {
      console.log(`✅ [Mandy] Sending response immediately to prevent A1Zap fallback`);
      await webhookHelpers.sendResponse(
        this.client,
        chatId,
        result.response,
        result.richContentBlocks || null
      );
    } else {
      // If no response, this should never happen, but send a default to prevent A1Zap fallback
      console.error(`❌ [Mandy] ERROR: No response in result! This should not happen.`);
      console.error(`   Result:`, JSON.stringify(result, null, 2));
      // Don't send a default - let it fail so we can debug
    }
  }
}

// Create and export singleton webhook handler
const mandyWebhook = new MandyWebhook();
module.exports = mandyWebhook.createHandler();

