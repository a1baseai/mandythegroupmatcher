# Rich Content Guide

## Overview

The Brandon Eats agent supports **rich content messages** using the A1Zap Rich Messages API. Send interactive social media embeds, buttons, and more alongside text messages.

---

## Social Media Embeds

### Sending Social Shares

```javascript
const brandonEatsClient = require('./services/brandoneats-client');

const richContentBlocks = [
  {
    type: 'social_share',
    data: {
      platform: 'instagram',
      url: 'https://www.instagram.com/reel/DQI4QE8jHiL/'
    },
    order: 0
  },
  {
    type: 'social_share',
    data: {
      platform: 'tiktok',
      url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144'
    },
    order: 1
  },
  {
    type: 'social_share',
    data: {
      platform: 'youtube',
      url: 'https://www.youtube.com/shorts/ToobPQS6_ZI'
    },
    order: 2
  }
];

await brandonEatsClient.sendMessage(
  chatId,
  '🔥 Check out these viral videos!',
  richContentBlocks
);
```

### Supported Platforms
- **Instagram** - Posts and Reels
- **TikTok** - Videos
- **YouTube** - Videos and Shorts
- **Facebook** - Posts (experimental)

---

## Automatic Social Link Extraction

The Brandon Eats agent automatically detects restaurant names in responses and sends relevant TikTok videos as follow-up messages.

### How It Works

1. Agent generates response mentioning restaurants
2. System extracts restaurant names from the response
3. Matches names against CSV data
4. Finds TikTok URLs for those restaurants
5. Sends follow-up message with video embeds

### Example

**User:** "What are the best burger places?"

**Agent Response:** "Here are the top burger places: Five Guys, Shake Shack..."

**Automatic Follow-up:** 🎥 System sends TikTok videos for Five Guys and Shake Shack

### Configuration

The social link extractor looks for:
- Restaurant names in agent responses
- Matching entries in CSV data
- TikTok URLs in CSV columns

Supported CSV column names:
- `tiktok_url`
- `tiktok`
- `tiktok_link`
- `social_tiktok`

---

## Manual Social Share Example

### Quick Test Script

```javascript
const brandonEatsClient = require('./services/brandoneats-client');

async function sendSocialShares() {
  const chatId = 'your-chat-id';
  
  const richContent = [
    {
      type: 'social_share',
      data: {
        platform: 'tiktok',
        url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144'
      },
      order: 0
    }
  ];
  
  await brandonEatsClient.sendMessage(
    chatId,
    '🎥 Check out this video!',
    richContent
  );
  
  console.log('✅ Social share sent!');
}

sendSocialShares();
```

---

## Rich Content Block Structure

### Basic Structure
```javascript
{
  type: 'social_share',      // Block type
  data: {
    platform: 'tiktok',      // Social platform
    url: 'https://...'       // Full URL to post/video
  },
  order: 0                   // Display order (0, 1, 2...)
}
```

### Multiple Blocks
```javascript
const richContentBlocks = [
  { type: 'social_share', data: { platform: 'instagram', url: '...' }, order: 0 },
  { type: 'social_share', data: { platform: 'tiktok', url: '...' }, order: 1 },
  { type: 'social_share', data: { platform: 'youtube', url: '...' }, order: 2 }
];
```

The `order` field determines display sequence.

---

## CSV Setup for Auto-Extraction

### Required Columns

Your CSV should include:
1. **Restaurant name column** (e.g., `name`, `restaurant_name`)
2. **TikTok URL column** (e.g., `tiktok_url`, `tiktok`)

### Example CSV Structure

```csv
name,rating,location,tiktok_url
Five Guys,4.5,New York,https://www.tiktok.com/@brandneweats/video/123
Shake Shack,4.7,Manhattan,https://www.tiktok.com/@brandneweats/video/456
In-N-Out,4.8,LA,https://www.tiktok.com/@brandneweats/video/789
```

### Upload Your CSV

```bash
npm run upload files/brandoneats.csv
```

---

## Testing

### Test with Quick Script

```bash
# Set your test chat ID
TEST_CHAT_ID=your_chat_id node test-social-shares-quick.js
```

### Test via API

```bash
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"id": "test-123"},
    "message": {"content": "Tell me about Five Guys"},
    "agent": {"id": "agent-123"}
  }'
```

If "Five Guys" is in your CSV with a TikTok URL, you'll receive:
1. Text response about Five Guys
2. Automatic follow-up with TikTok embed

---

## Customizing Social Extraction

Edit `services/social-link-extractor.js` to customize:

### Change Detection Logic
```javascript
// Modify how restaurant names are extracted
function extractRestaurantNames(text) {
  // Your custom logic here
}
```

### Change Platform
```javascript
// Currently extracts TikTok URLs
// Modify to extract Instagram, YouTube, etc.
const tiktokUrl = row['tiktok_url'] || row['tiktok'];
```

### Change Message Format
```javascript
// In webhooks/brandoneats-webhook.js
const socialMessage = relevantLinks.length === 1
  ? `🎥 Here's a video about ${relevantLinks[0].name}!`
  : `🎥 Here are some videos about these places!`;
```

---

## Troubleshooting

### Social links not appearing?
1. Check CSV has TikTok URLs
2. Verify CSV column name matches expected names
3. Ensure restaurant name in response exactly matches CSV
4. Check server logs for extraction debug info

### Embeds not showing in A1Zap?
1. Verify URL format is correct
2. Check platform is supported
3. Test with sample URLs provided above
4. Ensure A1Zap app is updated

### Too many/few links sent?
1. Adjust detection logic in `social-link-extractor.js`
2. Modify relevance threshold
3. Limit number of links sent per message

---

## Advanced: Other Rich Content Types

A1Zap supports additional rich content types:

### Buttons (Coming Soon)
```javascript
{
  type: 'button',
  data: {
    text: 'View Menu',
    url: 'https://restaurant.com/menu'
  },
  order: 0
}
```

### Cards (Coming Soon)
```javascript
{
  type: 'card',
  data: {
    title: 'Restaurant Name',
    description: 'Great burgers!',
    image: 'https://...',
    url: 'https://...'
  },
  order: 0
}
```

---

## API Reference

### brandonEatsClient.sendMessage(chatId, text, richContentBlocks)

Send a message with optional rich content.

**Parameters:**
- `chatId` (string) - A1Zap chat ID
- `text` (string) - Message text
- `richContentBlocks` (array, optional) - Rich content blocks

**Returns:** Promise<Object>

**Example:**
```javascript
const result = await brandonEatsClient.sendMessage(
  'chat123',
  'Check this out!',
  [{ type: 'social_share', data: { platform: 'tiktok', url: '...' }, order: 0 }]
);
```

---

## Best Practices

1. **Order matters** - Use the `order` field to control display sequence
2. **Limit count** - Don't send more than 3-5 embeds per message
3. **Relevant content** - Only send social content that's relevant to the response
4. **Test URLs** - Verify social URLs are valid before sending
5. **Graceful degradation** - Text message should be useful even without embeds

---

**Questions? Check the main `README.md` or `SETUP.md` for more info.**
