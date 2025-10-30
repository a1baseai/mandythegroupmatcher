# ZapBank Welcome Carousel Implementation

## Overview

Successfully implemented a two-message welcome flow for the ZapBank agent that triggers on the `chat.started` event:

1. **First Message**: Text-only welcome message with personalized greeting
2. **Second Message**: 3-item product carousel featuring core banking products

## Implementation Details

### Files Modified

#### `webhooks/zapbank-rep-webhook.js`

Added two new methods to the `ZapBankRepWebhook` class:

##### 1. `handleChatStarted()` Override

Overrides the base class method to implement custom welcome flow:

```javascript
async handleChatStarted(req, res) {
  // Extract chatId, userName, and isAnonymous from request
  // Send welcome message from agent.getWelcomeMessage()
  // Immediately follow with sendWelcomeCarousel()
  // Return success response
}
```

**Key Features:**
- Supports both new and legacy payload structures
- Validates chatId presence
- Respects test mode (skips sending for chatIds starting with 'test-')
- Returns comprehensive response with both message statuses

##### 2. `sendWelcomeCarousel()` Method

Sends a 3-item carousel featuring core banking products:

```javascript
async sendWelcomeCarousel(chatId) {
  // Create carousel with 3 items:
  // - Treasury (4.09% APY)
  // - Corporate Cards (2% cashback)
  // - Business Checking ($0 fees)
  // Send via webhookHelpers.sendResponse()
}
```

**Carousel Configuration:**
- **Message text**: "Here's what we offer:"
- **Items**: 3 products
- **Interval**: 4000ms (4 seconds per slide)
- **Images**: Uses static-images/zapbank/ directory

### Carousel Items

1. **💰 Treasury - 4.09% APY**
   - Subtitle: "Earn market-leading returns on idle cash"
   - Description: "FDIC insured, instant access"
   - Image: `/static-images/zapbank/treasury.jpg`

2. **💳 Corporate Cards - 2% Cashback**
   - Subtitle: "Maximize returns on all business spend"
   - Description: "Virtual cards, spending controls, real-time tracking"
   - Image: `/static-images/zapbank/corporate-cards.jpg`

3. **🏦 Business Checking - $0 Fees**
   - Subtitle: "Up to $75M FDIC insurance"
   - Description: "Modern platform built for startups"
   - Image: `/static-images/zapbank/checking.jpg`

## Testing

### Test File

Created comprehensive unit test: `tests/test-zapbank-welcome-carousel.js`

**Features:**
- Mock A1Zap client to capture sent messages
- Tests the complete two-message flow
- Verifies message content, structure, and carousel items
- No server required (pure unit test)

### Test Results

✅ **All tests passing**

```
Total messages sent: 2
✅ Message 1: Welcome text (personalized)
✅ Message 2: Carousel with 3 products
✅ Treasury included
✅ Corporate Cards included
✅ Checking included
```

### Running Tests

```bash
# Run the unit test
node tests/test-zapbank-welcome-carousel.js

# Run full ZapBank agent test suite (requires server running)
node tests/test-zapbank-rep.js
```

## Usage

### Triggering the Welcome Flow

The welcome carousel is automatically sent when a new chat starts:

1. User initiates a new chat with ZapBank agent
2. A1Zap sends `chat.started` webhook event
3. Agent sends welcome message (personalized if user name available)
4. Agent immediately sends carousel with 3 core products

### Webhook Payload

Expected `chat.started` payload:

```json
{
  "event": "chat.started",
  "chatId": "chat-abc123",
  "user": {
    "userName": "John Doe",
    "isAnonymous": false
  }
}
```

Or legacy format:

```json
{
  "event": "chat.started",
  "chatMetadata": {
    "chatId": "chat-abc123",
    "user": {
      "userName": "John Doe",
      "isAnonymous": false
    }
  }
}
```

## Architecture

### Inheritance Structure

```
BaseWebhook (base class)
  ↓
ZapBankRepWebhook (extends)
  ↓
  - handleChatStarted() [override]
  - sendWelcomeCarousel() [new method]
```

### Message Flow

```
chat.started event
  ↓
ZapBankRepWebhook.handleChatStarted()
  ↓
1. Extract chatId, userName, isAnonymous
  ↓
2. Get welcome message from agent
  ↓
3. Send welcome message (client.sendMessage)
  ↓
4. Send welcome carousel (sendWelcomeCarousel)
  ↓
5. Return success response
```

## Configuration

### Image URLs

Images are served from the `static-images/zapbank/` directory:

- Base URL: Set via `config.server.baseUrl` (default: `http://localhost:3000`)
- Full URL pattern: `{baseUrl}/static-images/zapbank/{filename}`

Required images:
- `treasury.jpg` (800x600px recommended)
- `corporate-cards.jpg` (800x600px recommended)
- `checking.jpg` (800x600px recommended)

See `/static-images/zapbank/README.md` for image specifications.

### Test Mode

Chats with IDs starting with `test-` are automatically detected as test chats:
- Messages are logged but not actually sent
- Useful for unit testing without hitting A1Zap API

## Benefits

### User Experience
- **Immediate engagement**: Two messages capture attention
- **Visual appeal**: Carousel showcases products attractively
- **Clear value prop**: Each product highlights key benefits
- **Mobile-friendly**: Carousel works great on small screens

### Business Impact
- **Higher conversion**: Visual product showcase increases interest
- **Better education**: Users see offerings immediately
- **Reduced questions**: Core products shown upfront
- **Professional presentation**: Modern, fintech-style interface

## Future Enhancements

Potential improvements:
1. **Dynamic carousel**: Customize products based on user profile
2. **A/B testing**: Test different product combinations
3. **Analytics**: Track which carousel items get clicked
4. **Seasonal campaigns**: Swap carousel items for promotions
5. **Action buttons**: Add "Learn More" or "Apply Now" buttons to carousel items

## Related Documentation

- [ZapBank Rep Agent](ZAPBANK_REP_AGENT.md) - Full agent documentation
- [Rich Content Guide](AI_AGENT_RICH_MESSAGING_GUIDE.md) - Carousel and rich content patterns
- [Webhook Helpers](WEBHOOK_HELPERS_GUIDE.md) - Helper utilities for webhooks
- [Image Hosting](IMAGE_HOSTING_GUIDE.md) - Image serving and optimization

## Support

For issues or questions:
1. Check test output: `node tests/test-zapbank-welcome-carousel.js`
2. Review server logs for webhook events
3. Verify images are accessible at static URLs
4. Check A1Zap webhook configuration

---

**Implementation Date**: October 29, 2025
**Status**: ✅ Complete and Tested
**Version**: 1.0.0

