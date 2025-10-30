# Architecture Refactor: Rich Content Triage

## Overview

Successfully refactored the AI-powered rich content triage system to follow proper separation of concerns. Extracted Zap Bank-specific logic from the generic Claude service into a dedicated agent-specific service.

## Problem

The initial implementation placed Zap Bank-specific business logic (Treasury accounts, Corporate Cards, banking products) inside `services/claude-service.js`, which is meant to be a generic AI service used by all agents.

**Issue:**
```javascript
// services/claude-service.js
async analyzeRichContentOpportunity() {
  // ❌ Contains hardcoded banking products: Treasury, Corporate Cards, etc.
  // ❌ Zap Bank-specific prompts and logic
  // ❌ Not reusable for other agents
}
```

## Solution

Created a dedicated service that properly encapsulates Zap Bank's rich content logic while keeping the Claude service generic.

### Architecture Before

```
services/
└── claude-service.js
    ├── Generic: generateText, chat ✅
    └── Specific: analyzeRichContentOpportunity (Zap Bank) ❌
```

### Architecture After

```
services/
├── claude-service.js
│   └── Generic: generateText, chat, chatWithBaseFile ✅
│
└── zapbank-rich-content-triage.js ✨ NEW
    └── Specific: analyze() - Zap Bank products/prompts ✅
    └── Uses claude-service.client for AI calls
```

## Changes Made

### 1. Created New Service

**File:** `services/zapbank-rich-content-triage.js`

```javascript
class ZapBankRichContentTriage {
  constructor() {
    this.claudeService = require('./claude-service');
  }
  
  async analyze(conversationHistory, userMessage, agentResponse) {
    // Zap Bank-specific system prompt
    // Banking products: Treasury, Corporate Cards, Checking
    // Calls claudeService.client for AI
    // Returns decision: { shouldSend, contentType, productType, reasoning }
  }
}
```

**Features:**
- Contains all Zap Bank-specific rich content logic
- Wraps Claude service for AI calls
- Handles JSON parsing with markdown stripping
- Includes error handling and safe defaults

### 2. Cleaned Claude Service

**File:** `services/claude-service.js`

**Removed:**
- `analyzeRichContentOpportunity()` method (154 lines)
- All Zap Bank-specific logic

**Result:**
- Now purely generic and reusable
- No agent-specific business logic
- Can be used by any agent for AI capabilities

### 3. Updated Webhook

**File:** `webhooks/zapbank-rep-webhook.js`

**Changes:**
```javascript
// Added import
const zapbankRichContentTriage = require('../services/zapbank-rich-content-triage');

// Updated method
async analyzeWithAI(chatId, userMessage, response) {
  const conversation = await webhookHelpers.fetchAndProcessHistory(...);
  
  // Now uses dedicated service
  return await zapbankRichContentTriage.analyze(
    conversation,
    userMessage,
    response
  );
}
```

### 4. Updated Tests

**File:** `tests/test-ai-rich-content-triage.js`

**Changes:**
```javascript
// OLD:
const claudeService = require('../services/claude-service');
const decision = await claudeService.analyzeRichContentOpportunity(...);

// NEW:
const zapbankRichContentTriage = require('../services/zapbank-rich-content-triage');
const decision = await zapbankRichContentTriage.analyze(...);
```

### 5. Updated Documentation

**File:** `docs/AI_RICH_CONTENT_TRIAGE.md`

- Updated all references to use new service
- Added architecture section showing separation of concerns
- Documented pattern for future agents

## Verification

All tests pass with 100% accuracy:

```
✅ All tests completed successfully!

Total Tests: 6/6
Passed (no errors): 6/6
Matched Expected: 6/6
Average Decision Time: 3858ms

Decision Breakdown:
  Carousel: 1
  Product Card: 2
  CTA Buttons: 1
  None: 2
```

## Benefits

### 1. Separation of Concerns ✅
- Generic services stay generic
- Agent-specific logic is properly scoped
- Clear boundaries between layers

### 2. Reusability ✅
- Claude service can be used by any agent
- No contamination with specific business logic
- Easy to understand what each service does

### 3. Scalability ✅
- Pattern established for future agents
- Other agents can create their own triage services
- Example: `makeup-artist-rich-content-triage.js`

### 4. Maintainability ✅
- Easy to test each service independently
- Changes to Zap Bank logic don't affect generic service
- Clear responsibility for each file

### 5. Discoverability ✅
- File name makes it clear what it's for
- Easy to find agent-specific logic
- Follows naming conventions

## Pattern for Future Agents

Other agents can now follow this pattern:

```
services/
├── claude-service.js                     (Generic - all agents use)
├── zapbank-rich-content-triage.js        (Zap Bank specific)
├── makeup-artist-rich-content-triage.js  (Future: Makeup artist)
└── photographer-rich-content-triage.js   (Future: Photographer)
```

Each agent-specific service:
- Contains domain-specific prompts and logic
- Uses generic Claude service for AI calls
- Returns structured decisions for that agent's needs
- Is independently testable

## Files Modified

1. ✨ **CREATED** `services/zapbank-rich-content-triage.js` (172 lines)
2. ✅ **MODIFIED** `services/claude-service.js` (removed 154 lines)
3. ✅ **MODIFIED** `webhooks/zapbank-rep-webhook.js` (updated imports and calls)
4. ✅ **MODIFIED** `tests/test-ai-rich-content-triage.js` (updated imports and calls)
5. ✅ **MODIFIED** `docs/AI_RICH_CONTENT_TRIAGE.md` (architecture documentation)
6. ✨ **CREATED** `docs/ARCHITECTURE_REFACTOR_RICH_CONTENT.md` (this document)

## Conclusion

This refactor demonstrates best practices in software architecture:

- **Single Responsibility Principle**: Each service has one clear purpose
- **Separation of Concerns**: Generic vs specific logic is clearly separated
- **Open/Closed Principle**: Easy to extend with new agents without modifying existing code
- **Dependency Inversion**: Agent services depend on generic service abstraction

The codebase is now cleaner, more maintainable, and sets a clear pattern for future agent development. 🎉

