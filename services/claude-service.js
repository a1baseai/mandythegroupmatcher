const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const fileRegistry = require('./file-registry');
const fs = require('fs');
const path = require('path');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.claude.apiKey
    });
  }

  /**
   * Generate text response using Claude
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @param {string} options.systemPrompt - System instruction
   * @param {string|null} options.fileId - File ID to include in context
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt, options = {}) {
    try {
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Add file reference if provided
      if (options.fileId) {
        // Get file info from registry
        const fileInfo = fileRegistry.getFileById(options.fileId);
        
        if (fileInfo) {
          // Try to read from originalPath first, then try relative path
          let fileContent = null;
          let filePath = null;
          
          if (fileInfo.originalPath && fs.existsSync(fileInfo.originalPath)) {
            filePath = fileInfo.originalPath;
          } else if (fileInfo.filename) {
            // Try relative path from project root
            const relativePath = path.join(__dirname, '..', 'files', fileInfo.filename);
            if (fs.existsSync(relativePath)) {
              filePath = relativePath;
            }
          }
          
          if (filePath) {
            // CSV files are not supported as document blocks per Files API docs
            // Read and include content directly as text
            fileContent = fs.readFileSync(filePath, 'utf-8');
            messages[0].content = `Here's the data file (${fileInfo.filename}):\n\n${fileContent}\n\n---\n\n${prompt}`;
            console.log(`✅ Loaded file content from: ${filePath}`);
          } else {
            console.warn(`⚠️  File not found for ID: ${options.fileId} (tried: ${fileInfo.originalPath}, files/${fileInfo.filename})`);
          }
        } else {
          console.warn(`⚠️  File metadata not found for ID: ${options.fileId}`);
        }
      }

      const response = await this.client.messages.create({
        model: options.model || config.claude.defaultModel,
        max_tokens: options.maxTokens || config.claude.maxTokens,
        temperature: options.temperature !== undefined ? options.temperature : config.claude.temperature,
        system: options.systemPrompt || undefined,
        messages: messages
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude text generation error:', error);
      throw error;
    }
  }

  /**
   * Generate response with conversation history
   * @param {Array} messages - Message history [{role, content}]
   * @param {Object} options - Generation options
   * @param {string} options.systemPrompt - System instruction
   * @param {string|null} options.fileId - File ID to include in context
   * @returns {Promise<string>} Generated response
   */
  async chat(messages, options = {}) {
    try {
      // Convert messages to Claude format
      const claudeMessages = messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        
        // Add file reference to the last user message if fileId is provided
        if (isLastMessage && msg.role === 'user' && options.fileId) {
          // Get file info from registry
          const fileInfo = fileRegistry.getFileById(options.fileId);
          
          if (fileInfo) {
            // Try to read from originalPath first, then try relative path
            let fileContent = null;
            let filePath = null;
            
            if (fileInfo.originalPath && fs.existsSync(fileInfo.originalPath)) {
              filePath = fileInfo.originalPath;
            } else if (fileInfo.filename) {
              // Try relative path from project root
              const relativePath = path.join(__dirname, '..', 'files', fileInfo.filename);
              if (fs.existsSync(relativePath)) {
                filePath = relativePath;
              }
            }
            
            if (filePath) {
              // CSV files are not supported as document blocks per Files API docs
              // Read and include content directly as text
              fileContent = fs.readFileSync(filePath, 'utf-8');
              const messageText = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
              console.log(`✅ Loaded file content from: ${filePath}`);
              
              return {
                role: msg.role,
                content: `Here's the data file (${fileInfo.filename}):\n\n${fileContent}\n\n---\n\n${messageText}`
              };
            } else {
              console.warn(`⚠️  File not found for ID: ${options.fileId} (tried: ${fileInfo.originalPath}, files/${fileInfo.filename})`);
            }
          } else {
            console.warn(`⚠️  File metadata not found for ID: ${options.fileId}`);
          }
        }

        // Handle messages that might already have complex content structures
        const content = typeof msg.content === 'string' ? msg.content : msg.content;
        
        return {
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: content
        };
      });

      const response = await this.client.messages.create({
        model: options.model || config.claude.defaultModel,
        max_tokens: options.maxTokens || config.claude.maxTokens,
        temperature: options.temperature !== undefined ? options.temperature : config.claude.temperature,
        system: options.systemPrompt || undefined,
        messages: claudeMessages
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude chat error:', error);
      throw error;
    }
  }

  /**
   * Get the base file ID from registry
   * @param {string} agentName - Optional agent name to get specific agent's file
   * @returns {string|null} Base file ID
   */
  getBaseFileId(agentName = null) {
    return fileRegistry.getBaseFile(agentName);
  }

  /**
   * Generate response with automatic base file inclusion
   * @param {string} prompt - User prompt
   * @param {Object} options - Generation options
   * @param {string} options.agentName - Optional agent name for file lookup
   * @returns {Promise<string>} Generated response
   */
  async generateWithBaseFile(prompt, options = {}) {
    const baseFileId = this.getBaseFileId(options.agentName);
    
    if (!baseFileId) {
      console.warn('⚠️  No base file set. Generating response without file context.');
    }

    return this.generateText(prompt, {
      ...options,
      fileId: baseFileId
    });
  }

  /**
   * Chat with automatic base file inclusion
   * @param {Array} messages - Message history
   * @param {Object} options - Generation options
   * @param {string} options.agentName - Optional agent name for file lookup
   * @returns {Promise<string>} Generated response
   */
  async chatWithBaseFile(messages, options = {}) {
    const baseFileId = this.getBaseFileId(options.agentName);
    
    if (!baseFileId) {
      console.warn('⚠️  No base file set. Generating response without file context.');
    }

    return this.chat(messages, {
      ...options,
      fileId: baseFileId
    });
  }
}

module.exports = new ClaudeService();

