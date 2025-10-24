const claudeService = require('../services/claude-service');
const a1zapClient = require('../services/a1zap-client');
const claudeDocubotAgent = require('../agents/claude-docubot-agent');
const fileRegistry = require('../services/file-registry');

/**
 * Claude DocuBot webhook handler with file reference support
 * Uses the claude-docubot-agent configuration
 */
async function claudeWebhookHandler(req, res) {
  try {
    console.log('\n=== Claude Webhook Received ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Extract webhook data
    const { chat, message, agent } = req.body;

    if (!chat?.id) {
      return res.status(400).json({
        success: false,
        error: 'Missing chat.id in webhook payload'
      });
    }

    if (!message?.content) {
      return res.status(400).json({
        success: false,
        error: 'Missing message.content in webhook payload'
      });
    }

    const chatId = chat.id;
    const agentId = agent?.id;
    const userMessage = message.content;

    console.log(`Processing message from chat ${chatId}: "${userMessage}"`);

    // Check if base file is set for claude-docubot agent
    const baseFileId = fileRegistry.getBaseFile('claude-docubot');
    if (baseFileId) {
      const fileInfo = fileRegistry.getFileById(baseFileId);
      console.log(`📄 Using base file for Claude DocuBot: ${fileInfo?.filename || baseFileId}`);
    } else {
      console.warn('⚠️  No base file set for Claude DocuBot - responses will not have document context');
    }

    // Build conversation array
    const conversation = [];

    // Fetch message history (last 10 messages)
    let messageHistory = [];
    if (chatId && agentId) {
      try {
        console.log('Fetching message history for chatId:', chatId);
        const history = await a1zapClient.getMessageHistory(chatId, 10);

        if (history && history.length > 0) {
          messageHistory = history;
          console.log(`Retrieved ${messageHistory.length} messages from history`);

          // Convert message history to conversation format
          messageHistory.forEach(msg => {
            if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
              const role = msg.isAgent || msg.senderId === agentId ? 'assistant' : 'user';
              const content = msg.senderName && !msg.isAgent
                ? `${msg.senderName}: ${msg.content}`
                : msg.content;

              conversation.push({
                role: role,
                content: String(content)
              });
            }
          });
        }
      } catch (error) {
        console.warn('Failed to fetch message history:', error.message);
        // Continue without history - don't fail the entire request
      }
    }

    // Add the current message to conversation
    conversation.push({ role: 'user', content: String(userMessage) });

    // Generate response using Claude with file context
    console.log('Generating response with Claude...');
    let response;
    
    if (conversation.length > 1) {
      // Use chat with history
      response = await claudeService.chatWithBaseFile(conversation, {
        ...claudeDocubotAgent.generationOptions,
        systemPrompt: claudeDocubotAgent.systemPrompt
      });
    } else {
      // First message - use generateWithBaseFile
      response = await claudeService.generateWithBaseFile(
        `${claudeDocubotAgent.systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
        claudeDocubotAgent.generationOptions
      );
    }

    console.log('Generated response:', response);

    // Send response back to A1Zap (skip for test chats)
    let sendResult = null;
    if (!chatId.startsWith('test-')) {
      try {
        sendResult = await a1zapClient.sendMessage(chatId, response);
      } catch (sendError) {
        console.error('Failed to send message to A1Zap:', sendError.message);
        // Don't fail the request if sending fails
      }
    } else {
      console.log('⚠️  Test mode: Skipping A1Zap send');
    }

    // Return success
    res.json({
      success: true,
      agent: claudeDocubotAgent.name,
      response: response,
      baseFile: baseFileId ? fileRegistry.getFileById(baseFileId)?.filename : null,
      testMode: chatId.startsWith('test-')
    });

  } catch (error) {
    console.error('\n=== Claude Webhook Error ===');
    console.error('Error:', error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = claudeWebhookHandler;

