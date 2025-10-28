# Chat Started Event Implementation

This document explains the implementation of the `chat.started` event handler across all agents.

## Overview

A1Zap now fires a `chat.started` event when a user starts a new chat. All agents in this project now automatically send personalized welcome messages when this event is triggered.

## Architecture

The implementation follows a two-level architecture:

### 1. Base Infrastructure (Core)

**BaseWebhook.js** - Handles event routing and common logic:
- Detects `event: 'chat.started'` in webhook payload
- Routes to `handleChatStarted()` method
- Supports both new and legacy payload structures
- Handles test mode detection
- Sends welcome message via A1Zap API

**BaseAgent.js** - Provides default welcome message generation:
- `getWelcomeMessage(userName, isAnonymous)` method
- Creates personalized greetings based on user info
- Can be overridden by agent subclasses

### 2. Agent-Specific Implementation

Each agent provides its own custom welcome message:

- **Brandon Eats Agent** - Food-focused greeting with social links
- **Claude DocuBot Agent** - Document-focused greeting
- **Makeup Artist Agent** - Image editing prompt with examples
- **YC Photographer Agent** - YC photo styles explanation

## Webhook Payload Formats

The implementation supports both payload structures:

### Newer Structure (Preferred)
```json
{
  "event": "chat.started",
  "chatId": "abc123",
  "user": {
    "userName": "John Doe",
    "isAnonymous": false
  }
}
```

### Legacy Structure
```json
{
  "event": "chat.started",
  "chatMetadata": {
    "chatId": "abc123",
    "user": {
      "userName": "John Doe",
      "isAnonymous": false
    }
  }
}
```

## Testing

### Local Testing (Without A1Zap)

Run the test script to verify all agents:

```bash
node tests/test-chat-started.js
```

This will:
- Test all 4 agents (Brandon Eats, Claude DocuBot, Makeup Artist, YC Photographer)
- Test with both named and anonymous users
- Test legacy payload structure compatibility
- Run in test mode (no actual A1Zap API calls)

### Testing with A1Zap

To test with real A1Zap webhook delivery:

1. **Start your server:**
   ```bash
   npm start
   # or
   node server.js
   ```

2. **Expose with ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Configure A1Zap webhook:**
   - Go to your A1Zap agent dashboard
   - Navigate to API settings
   - Set webhook URL to: `https://your-ngrok-url.ngrok.io/webhook/agent-name`
   - Save configuration

4. **Test:**
   - Open your A1Zap agent chat interface
   - Start a new chat
   - You should receive a welcome message immediately

### Manual Testing with curl

Test a specific agent locally:

```bash
# Test Brandon Eats with named user
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{
    "event": "chat.started",
    "chatId": "test-chat-123",
    "user": {
      "userName": "John Doe",
      "isAnonymous": false
    }
  }'

# Test Makeup Artist with anonymous user
curl -X POST http://localhost:3000/webhook/makeup-artist \
  -H "Content-Type: application/json" \
  -d '{
    "event": "chat.started",
    "chatId": "test-chat-456",
    "user": {
      "isAnonymous": true
    }
  }'
```

## Customizing Welcome Messages

To customize a welcome message for an agent:

1. **Open the agent file:**
   ```
   agents/your-agent-name-agent.js
   ```

2. **Edit the `getWelcomeMessage()` method:**
   ```javascript
   getWelcomeMessage(userName, isAnonymous) {
     // Create personalized greeting
     let greeting;
     if (userName && !isAnonymous) {
       const firstName = userName.split(' ')[0];
       greeting = `Hey ${firstName}! 👋`;
     } else {
       greeting = `Hey there! 👋`;
     }

     // Customize your message here
     return `${greeting}

   Your custom welcome message...

   **Features:**
   • Feature 1
   • Feature 2

   How can I help you today?`;
   }
   ```

3. **Restart the server** to apply changes

## Welcome Message Best Practices

Based on the guide and implementation:

✅ **Do:**
- Use personalized greetings with first name when available
- Clearly explain what your agent does
- Provide specific examples of capabilities
- Include relevant links (social media, documentation)
- End with an engaging call to action
- Use markdown for formatting (bold, bullets, links)
- Keep it conversational and friendly

❌ **Don't:**
- Make it too long (users may not read everything)
- Use overly technical language
- Overwhelm with too many options
- Forget to personalize when user data is available
- Use complex markdown that may not render on mobile

## Response Format

When a `chat.started` event is handled successfully, the webhook returns:

```json
{
  "success": true,
  "event": "chat.started",
  "agent": "Agent Name",
  "welcomeMessageSent": true,
  "userName": "John Doe"
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message here",
  "event": "chat.started"
}
```

## Integration with Existing Webhooks

The `chat.started` handler integrates seamlessly with existing webhook logic:

1. **Event is checked first** - Before any message validation
2. **Early return** - If it's a chat.started event, it returns immediately
3. **No interference** - Regular message handling continues unchanged
4. **Test mode aware** - Respects existing `isTestChat()` detection

## Troubleshooting

### Welcome message not sent

1. **Check API configuration:**
   ```bash
   node check-config.js
   ```

2. **Check webhook URL** in A1Zap dashboard

3. **Check server logs** for error messages

4. **Verify chatId** - Must not start with "test-" for real sending

### Wrong welcome message

1. **Verify agent configuration** in webhook routing
2. **Check agent's `getWelcomeMessage()` method**
3. **Restart server** after making changes

### Event not triggered

1. **Verify A1Zap webhook URL** is correctly configured
2. **Check ngrok** is running (if testing locally)
3. **Review A1Zap webhook logs** for delivery status
4. **Test with curl** to verify local webhook works

## Files Modified

This implementation modified the following files:

- `core/BaseWebhook.js` - Added event routing and `handleChatStarted()`
- `core/BaseAgent.js` - Added `getWelcomeMessage()` method
- `agents/brandoneats-agent.js` - Added custom welcome message
- `agents/claude-docubot-agent.js` - Added custom welcome message
- `agents/makeup-artist-agent.js` - Added custom welcome message
- `agents/yc-photographer-agent.js` - Added custom welcome message

## Related Documentation

- Original guide: See the user-provided guide in the project
- Agent personalities: `docs/AGENT_PERSONALITY_GUIDE.md`
- Webhook setup: `docs/RAILWAY_SETUP.md`
- Testing guide: `tests/README.md`

## Future Enhancements

Potential improvements:

- Add welcome message templates
- Support for rich content in welcome messages
- Welcome message A/B testing
- Analytics for welcome message engagement
- Multi-language welcome messages
- Dynamic welcome messages based on user context

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0

