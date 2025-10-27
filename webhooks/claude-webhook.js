const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const claudeService = require('../services/claude-service');
const claudeDocubotAgent = require('../agents/claude-docubot-agent');
const fileRegistry = require('../services/file-registry');
const config = require('../config');

/**
 * Claude DocuBot webhook handler with file reference support
 * Uses Claude with Files API to provide document-aware responses
 */
class ClaudeWebhook extends BaseWebhook {
  constructor() {
    // Create A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.claudeDocubot);
    
    // Initialize base webhook
    super(claudeDocubotAgent, client);
  }

  /**
   * Process Claude DocuBot request
   * @param {Object} data - Request data with conversation history
   * @returns {Promise<Object>} Result with response text
   */
  async processRequest(data) {
    const { userMessage, conversation } = data;

    // Check if base file is set for claude-docubot agent
    const baseFileId = fileRegistry.getBaseFile('claude-docubot');
    if (baseFileId) {
      const fileInfo = fileRegistry.getFileById(baseFileId);
      console.log(`📄 Using base file for Claude DocuBot: ${fileInfo?.filename || baseFileId}`);
    } else {
      console.warn('⚠️  No base file set for Claude DocuBot - responses will not have document context');
    }

    // Add the current message to conversation
    const fullConversation = [...conversation, { role: 'user', content: String(userMessage) }];

    // Generate response using Claude with file context
    console.log('Generating response with Claude...');
    let response;

    if (fullConversation.length > 1) {
      // Use chat with history
      response = await claudeService.chatWithBaseFile(fullConversation, {
        ...this.agent.getGenerationOptions(),
        systemPrompt: this.agent.getSystemPrompt(),
        agentName: 'claude-docubot'
      });
    } else {
      // First message - use generateWithBaseFile
      response = await claudeService.generateWithBaseFile(
        `${this.agent.getSystemPrompt()}\n\nUser: ${userMessage}\n\nAssistant:`,
        {
          ...this.agent.getGenerationOptions(),
          agentName: 'claude-docubot'
        }
      );
    }

    console.log('Generated response:', response);

    return {
      response,
      baseFile: baseFileId ? fileRegistry.getFileById(baseFileId)?.filename : null
    };
  }
}

// Create and export singleton webhook handler
const claudeWebhook = new ClaudeWebhook();
module.exports = claudeWebhook.createHandler();

