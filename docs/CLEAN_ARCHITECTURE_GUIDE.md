# Clean Architecture Guide

**Version**: 3.0.0  
**Last Updated**: October 26, 2025

## Overview

This application uses a clean architecture with base classes to eliminate code duplication and make it easy to add new AI agents. This guide explains how the architecture works and how to use it.

## Core Concepts

### Base Classes

The system is built on 4 core base classes in the `/core` directory:

1. **BaseAgent** - Abstract class for AI agent configurations
2. **BaseWebhook** - Abstract class for webhook handlers
3. **BaseA1ZapClient** - Unified messaging client
4. **AgentRegistry** - Central agent management

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    server.js                        │
│  - Initializes AgentRegistry                        │
│  - Registers all agents                             │
│  - Sets up Express routes                           │
└──────────────────┬──────────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Claude   │ │ Brandon  │ │ Makeup   │
│ Agent    │ │ Eats     │ │ Artist   │
│          │ │ Agent    │ │ Agent    │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     │ extends    │ extends    │ extends
     │            │            │
     └────────────┼────────────┘
                  │
           ┌──────▼──────┐
           │  BaseAgent  │
           └─────────────┘

Each agent has a corresponding webhook:

┌──────────┐      ┌──────────────┐      ┌──────────────┐
│ Claude   │      │ BaseA1Zap    │      │ Claude       │
│ Webhook  ├─────▶│ Client       ├─────▶│ Service      │
└────┬─────┘      └──────────────┘      └──────────────┘
     │
     │ extends
     │
┌────▼────────┐
│ BaseWebhook │
└─────────────┘
```

## Using BaseAgent

### Purpose
BaseAgent provides common functionality for all AI agents:
- Metadata (name, role, description)
- Model selection (Claude or Gemini)
- Generation options
- Validation

### Creating a New Agent

```javascript
const BaseAgent = require('../core/BaseAgent');

class MyAgent extends BaseAgent {
  constructor() {
    super({
      name: 'My Agent Name',           // Display name
      role: 'My Agent Role',            // What the agent does
      description: '...',               // Detailed description
      model: 'claude',                  // 'claude' or 'gemini'
      generationOptions: {              // AI generation settings
        temperature: 0.7,
        maxTokens: 4096
      },
      metadata: {                       // Optional custom data
        category: 'utility',
        version: '1.0.0'
      }
    });
  }

  /**
   * REQUIRED: Define your agent's system prompt
   */
  getSystemPrompt() {
    return `You are a helpful AI assistant that...
    
Your capabilities:
- Capability 1
- Capability 2

Guidelines:
- Be helpful and concise
- Use examples when appropriate`;
  }

  /**
   * OPTIONAL: Override to customize generation options
   */
  getGenerationOptions() {
    return {
      ...this.generationOptions,
      temperature: 0.8  // Override default
    };
  }
}

// Export as singleton
module.exports = new MyAgent();
```

## Using BaseWebhook

### Purpose
BaseWebhook handles all common webhook logic:
- Request validation
- Message deduplication
- Conversation history fetching
- Error handling
- Test mode detection

### Creating a New Webhook

```javascript
const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const myAgent = require('../agents/my-agent');
const config = require('../config');

class MyWebhook extends BaseWebhook {
  constructor() {
    // Initialize A1Zap client for this agent
    const client = new BaseA1ZapClient(config.agents.myAgent);
    
    // Pass agent and client to base class
    super(myAgent, client);
  }

  /**
   * REQUIRED: Implement your agent-specific logic
   * The base class handles everything else!
   */
  async processRequest(data) {
    const { 
      userMessage,     // Current user message
      conversation,    // Message history
      chatId,          // WhatsApp chat ID
      imageUrl,        // Image URL (if any)
      agentId          // Agent ID
    } = data;

    // Your agent logic here
    const response = await someAIService.chat(conversation, {
      systemPrompt: this.agent.getSystemPrompt(),
      ...this.agent.getGenerationOptions()
    });

    // Return result
    return {
      response: response,          // Required: text to send
      richContentBlocks: [],       // Optional: rich content
      someCustomData: '...'        // Optional: custom data
    };
  }

  /**
   * OPTIONAL: Override to include images in history
   */
  shouldIncludeImagesInHistory() {
    return true;  // Default: false
  }

  /**
   * OPTIONAL: Override to change history limit
   */
  getHistoryLimit() {
    return 20;  // Default: 10
  }

  /**
   * OPTIONAL: Override to customize error message
   */
  getErrorMessage() {
    return "Sorry, something went wrong!";
  }
}

// Export handler function
const myWebhook = new MyWebhook();
module.exports = myWebhook.createHandler();
```

### What the Base Class Handles

You don't need to implement:
- ✅ Request validation
- ✅ Duplicate message detection
- ✅ Conversation history fetching
- ✅ Error handling and user notifications
- ✅ Test mode detection
- ✅ Response sending
- ✅ Logging

You only implement:
- ⚙️ `processRequest(data)` - Your agent's core logic

## Using BaseA1ZapClient

### Purpose
Unified client for sending messages to A1Zap (WhatsApp). Replaces 3 duplicate implementations.

### Usage

```javascript
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const config = require('../config');

// Create client
const client = new BaseA1ZapClient({
  apiKey: config.agents.myAgent.apiKey,
  agentId: config.agents.myAgent.agentId,
  apiUrl: config.agents.myAgent.apiUrl,
  agentName: 'my-agent'  // For logging
});

// Send text message
await client.sendMessage(chatId, 'Hello!');

// Send message with rich content
await client.sendMessage(chatId, 'Check this out!', richContentBlocks);

// Send media message
await client.sendMediaMessage(
  chatId,
  'Here is your image!',
  imageUrl,
  { width: 1024, height: 768, contentType: 'image/png' }
);

// Get message history
const messages = await client.getMessageHistory(chatId, 20);
```

## Using AgentRegistry

### Purpose
Central registry for managing all agents. Provides single source of truth.

### Usage in server.js

```javascript
const AgentRegistry = require('./core/AgentRegistry');

// Create registry
const agentRegistry = new AgentRegistry();

// Register agents
agentRegistry.register('claude-docubot', claudeAgent, claudeWebhook);
agentRegistry.register('brandoneats', brandonEatsAgent, brandonEatsWebhook);
agentRegistry.register('makeup-artist', makeupAgent, makeupWebhook);

// Validate required agents
agentRegistry.validateRequired(['claude-docubot', 'brandoneats']);

// List all agents
const agents = agentRegistry.listAgents();

// Get specific agent
const agent = agentRegistry.getAgent('claude-docubot');

// Print summary
agentRegistry.printSummary();
```

## Adding a New Agent: Step-by-Step

### Step 1: Create Agent Config

File: `agents/translator-agent.js`

```javascript
const BaseAgent = require('../core/BaseAgent');

class TranslatorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Translator',
      role: 'Language Translation Specialist',
      description: 'Translates text between languages',
      model: 'claude',
      generationOptions: {
        temperature: 0.3,
        maxTokens: 2048
      }
    });
  }
  
  getSystemPrompt() {
    return `You are a professional translator...`;
  }
}

module.exports = new TranslatorAgent();
```

### Step 2: Create Webhook Handler

File: `webhooks/translator-webhook.js`

```javascript
const BaseWebhook = require('../core/BaseWebhook');
const BaseA1ZapClient = require('../core/BaseA1ZapClient');
const claudeService = require('../services/claude-service');
const translatorAgent = require('../agents/translator-agent');
const config = require('../config');

class TranslatorWebhook extends BaseWebhook {
  constructor() {
    const client = new BaseA1ZapClient(config.agents.translator);
    super(translatorAgent, client);
  }

  async processRequest(data) {
    const { userMessage, conversation } = data;
    
    const response = await claudeService.chat(
      [...conversation, { role: 'user', content: userMessage }],
      {
        systemPrompt: this.agent.getSystemPrompt(),
        ...this.agent.getGenerationOptions()
      }
    );

    return { response };
  }
}

const translatorWebhook = new TranslatorWebhook();
module.exports = translatorWebhook.createHandler();
```

### Step 3: Add Configuration

File: `config.js`

```javascript
agents: {
  // ... existing agents ...
  
  translator: {
    apiKey: process.env.TRANSLATOR_API_KEY || process.env.A1ZAP_API_KEY,
    agentId: process.env.TRANSLATOR_AGENT_ID,
    apiUrl: 'https://api.a1zap.com/v1/messages/individual',
    agentName: 'translator'
  }
}
```

### Step 4: Register in Server

File: `server.js`

```javascript
// Import
const translatorAgent = require('./agents/translator-agent');
const translatorWebhook = require('./webhooks/translator-webhook');

// Register
agentRegistry.register('translator', translatorAgent, translatorWebhook);

// Add route
app.post('/webhook/translator', translatorWebhook);
```

### Step 5: Done! ✅

Your new agent is ready. Total time: ~30 minutes.

## Best Practices

### 1. Keep System Prompts in getSystemPrompt()
```javascript
// ✅ Good
getSystemPrompt() {
  return `You are a ${this.name}...`;
}

// ❌ Bad - hardcoded in constructor
constructor() {
  this.systemPrompt = `...`;  // Don't do this
}
```

### 2. Use Agent Methods, Not Direct Properties
```javascript
// ✅ Good
const prompt = this.agent.getSystemPrompt();
const options = this.agent.getGenerationOptions();

// ❌ Bad
const prompt = this.agent.systemPrompt;  // May not exist
```

### 3. Let Base Class Handle Common Logic
```javascript
// ✅ Good - let base class handle it
class MyWebhook extends BaseWebhook {
  async processRequest(data) {
    // Just your logic
  }
}

// ❌ Bad - duplicating base class logic
class MyWebhook extends BaseWebhook {
  async handle(req, res) {
    // Validation, deduplication, error handling...
    // Don't reimplement this!
  }
}
```

### 4. Return Clean Results from processRequest
```javascript
// ✅ Good
return {
  response: 'Hello!',
  richContentBlocks: [...],
  customData: {...}
};

// ❌ Bad - don't send responses directly
await client.sendMessage(chatId, 'Hello!');
return { response: 'Hello!' };  // Don't do both!
```

### 5. Use AgentRegistry for All Agents
```javascript
// ✅ Good
agentRegistry.register('my-agent', myAgent, myWebhook);

// ❌ Bad - bypassing registry
app.post('/webhook/my-agent', myWebhook);  // Register in registry first!
```

## Common Patterns

### Pattern 1: Agent with Custom Methods

```javascript
class MyAgent extends BaseAgent {
  // ... constructor, getSystemPrompt ...
  
  // Add custom methods
  buildContextualPrompt(userMessage, context) {
    return `${context}\n\n${userMessage}`;
  }
  
  shouldIncludeMedia(message) {
    return message.toLowerCase().includes('image');
  }
}
```

### Pattern 2: Webhook with Preprocessing

```javascript
class MyWebhook extends BaseWebhook {
  async processRequest(data) {
    // Preprocess input
    const cleanedMessage = this.preprocessMessage(data.userMessage);
    
    // Call AI service
    const response = await aiService.chat(cleanedMessage);
    
    // Postprocess output
    const formattedResponse = this.formatResponse(response);
    
    return { response: formattedResponse };
  }
  
  preprocessMessage(message) {
    return message.trim().toLowerCase();
  }
  
  formatResponse(response) {
    return `✨ ${response}`;
  }
}
```

### Pattern 3: Multi-Mode Agent

```javascript
class MyWebhook extends BaseWebhook {
  async processRequest(data) {
    if (data.imageUrl) {
      return await this.processImageMode(data);
    } else {
      return await this.processTextMode(data);
    }
  }
  
  async processImageMode(data) {
    // Image processing logic
  }
  
  async processTextMode(data) {
    // Text processing logic
  }
}
```

## Troubleshooting

### Issue: "BaseAgent is abstract and cannot be instantiated directly"

**Cause**: Trying to create `new BaseAgent()` directly.  
**Solution**: Always extend BaseAgent:

```javascript
class MyAgent extends BaseAgent { ... }
```

### Issue: "getSystemPrompt() must be implemented by subclass"

**Cause**: Forgot to implement required method.  
**Solution**: Add getSystemPrompt() method:

```javascript
getSystemPrompt() {
  return `Your system prompt here`;
}
```

### Issue: Agent not listed in registry

**Cause**: Forgot to register agent.  
**Solution**: Add to server.js:

```javascript
agentRegistry.register('my-agent', myAgent, myWebhook);
```

### Issue: Messages not sending

**Cause**: Test mode or missing API keys.  
**Solutions**:
1. Check chatId doesn't start with "test-"
2. Verify API keys in config
3. Check logs for client errors

## Resources

- Main README: `/README.md`
- Migration Guide: `/ARCHITECTURE_MIGRATION.md`
- Agent Personality Guide: `/docs/AGENT_PERSONALITY_GUIDE.md`
- Setup Guide: `/docs/SETUP.md`

## Questions?

The architecture is designed to be self-documenting. Check:
1. Base class files for detailed JSDoc comments
2. Existing agents for examples
3. This guide for patterns

---

**Last Updated**: October 26, 2025  
**Architecture Version**: 3.0.0

