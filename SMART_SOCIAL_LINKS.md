# 🎥 Smart Social Links - Intelligent TikTok Integration

## Overview

Your BrandyEats bot now automatically detects when it mentions restaurants/places from your CSV file and sends relevant TikTok videos as a follow-up message using rich content blocks!

## How It Works

### The Flow

1. **User asks a question** → "What's good to eat in Saigon?"
2. **Bot responds with text** → Claude analyzes the CSV and provides recommendations
3. **Smart Detection** → Another Claude call analyzes the response to identify which restaurants were mentioned
4. **Automatic Follow-up** → If restaurants with TikTok links are found, bot sends a second message with embedded videos

### Example

**User:** "Where should I eat in Saigon?"

**Bot Response 1 (Text):**
```
I'd recommend checking out Rau Má Mix for a unique Vietnamese drink experience, 
and Ocean Palace in Quan 1 for authentic Chinese dim sum!
```

**Bot Response 2 (Rich Content - Automatic):**
```
🎥 Here are some videos about these places!
[Embedded TikTok video for Rau Má Mix]
[Embedded TikTok video for Ocean Palace]
```

## Features

### ✅ Intelligent Detection
- Uses Claude AI to analyze the bot's response
- Detects mentioned restaurant names even with variations/misspellings
- Only sends videos that are actually relevant

### ✅ Automatic & Seamless
- No user action required
- Happens automatically after the text response
- Only sends if relevant places are mentioned

### ✅ Rich Content Display
- Videos appear as embedded TikTok players
- Same format as the "a1" Easter egg
- Professional, native WhatsApp experience

### ✅ Smart Limits
- Maximum 5 videos per response (prevents spam)
- Only sends if links are found
- Graceful error handling

## Technical Implementation

### Files Created/Modified

**New:**
- `services/social-link-extractor.js` - CSV parsing and Claude-based matching service

**Modified:**
- `webhooks/brandoneats-webhook.js` - Integrated social link extraction after main response

### Architecture

```
User Message
    ↓
Claude Analysis (with CSV context)
    ↓
Text Response Sent
    ↓
Social Link Extractor
    ├─ Load CSV data (cached)
    ├─ Claude analyzes which restaurants were mentioned
    └─ Return matching TikTok links
    ↓
Rich Content Message Sent (if links found)
```

## The Social Link Extractor Service

### Key Functions

#### `loadSocialLinks()`
- Parses `files/brandoneats.csv`
- Handles quoted fields with commas properly
- Caches results for performance
- Returns array of restaurant objects with TikTok links

#### `detectMentionedRestaurants(responseText, allLinks)`
- Uses Claude AI for intelligent matching
- Sends Claude the response text and list of all restaurant names
- Claude identifies which restaurants are actually mentioned
- Handles variations, misspellings, and partial matches

#### `extractRelevantSocialLinks(responseText)`
- Main function called by webhook
- Combines CSV loading + Claude detection
- Returns array of relevant links with name and URL
- Limits to 5 links maximum

### CSV Format

The service reads from `files/brandoneats.csv`:

```csv
Name,Type,City,TikTok Link,Transcript,Available
Rau Má Mix,Eat,Saigon,https://www.tiktok.com/@brandneweats/video/...,transcript,yes
Ocean Palace,Eat,Saigon,https://www.tiktok.com/@brandneweats/video/...,transcript,yes
```

**Required columns:**
- Column 0: Name (restaurant/place name)
- Column 3: TikTok Link (must start with http)

## Testing

### Test Suite

```bash
# Run all tests
node test-social-links.js

# Run specific test
node test-social-links.js 1        # Load CSV
node test-social-links.js extract  # Test extraction with mentions
node test-social-links.js partial  # Test partial matching
node test-social-links.js multiple # Test multiple restaurants
```

### Test Cases

1. **Load CSV** - Verifies CSV parsing works correctly
2. **Extract with Mentions** - Tests detection when restaurants are mentioned
3. **Extract without Mentions** - Verifies no false positives
4. **Partial Match** - Tests Claude's ability to match variations
5. **Multiple Restaurants** - Tests handling of multiple mentions

### Manual Testing

Test via webhook:
```bash
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"id": "test-social"},
    "message": {"content": "Tell me about Rau Má Mix", "id": "test-123"},
    "agent": {"id": "j972wdq9j43c6wda1gga784gxn7qwpzs"}
  }'
```

Or in WhatsApp:
1. Ask about a specific restaurant: "Tell me about Ocean Palace"
2. Ask for recommendations: "Where should I eat in Saigon?"
3. Check if relevant TikTok videos appear as follow-up

## Configuration

### Adjust Maximum Links

Edit `services/social-link-extractor.js` line ~150:
```javascript
const limitedLinks = relevantLinks.slice(0, 5); // Change 5 to your preferred max
```

### Customize Follow-up Message

Edit `webhooks/brandoneats-webhook.js` lines ~229-231:
```javascript
const socialMessage = relevantLinks.length === 1
  ? `🎥 Here's a video about ${relevantLinks[0].name}!`
  : `🎥 Here are some videos about these places!`;
```

### Change Platforms

Currently supports TikTok from CSV. To add Instagram/YouTube:
1. Add columns to CSV
2. Update CSV parsing in `social-link-extractor.js`
3. Detect platform from URL or column
4. Use appropriate `platform` value in rich content blocks

### Clear Cache

If you update the CSV file:
```javascript
const socialLinkExtractor = require('./services/social-link-extractor');
socialLinkExtractor.clearCache();
```

Or restart the server (cache clears on restart).

## Console Output

### When Links Are Found

```
🔍 Checking for relevant social media links...
📊 Loading social links from CSV...
✅ Loaded 156 social links from CSV
🤖 Using Claude to detect mentioned restaurants...
✅ Claude identified 2 mentioned restaurants: [ 'Rau Má Mix', 'Ocean Palace' ]
✅ Found 2 relevant social links
   - Rau Má Mix: https://www.tiktok.com/@brandneweats/video/...
   - Ocean Palace: https://www.tiktok.com/@brandneweats/video/...
📹 Found 2 relevant TikTok links, sending follow-up message...
📤 Sending Brandon Eats response to chat j123abc
   Rich Content Blocks: 2 blocks
✅ Brandon Eats message sent successfully
✅ Social media links sent successfully
```

### When No Links Are Found

```
🔍 Checking for relevant social media links...
📊 Loading social links from CSV...
✅ Loaded 156 social links from CSV (cached)
🤖 Using Claude to detect mentioned restaurants...
✅ Claude identified 0 mentioned restaurants: []
ℹ️  No restaurants mentioned in response
ℹ️  No relevant social media links found for this response
```

## Error Handling

The system is designed to be fault-tolerant:

### CSV Loading Errors
- If CSV file not found → Logs warning, returns empty array
- If CSV parsing fails → Logs error, continues without links
- Errors don't break the main webhook response

### Claude Detection Errors
- If Claude API fails → Logs error, returns empty array
- If response unparseable → Returns empty array
- Main text response still sends successfully

### Sending Errors
- If rich content sending fails → Logs error, doesn't retry
- Main response always completes successfully
- User gets text response even if videos fail

## Performance

### Optimizations

**CSV Caching:**
- CSV parsed once and cached in memory
- Subsequent requests use cache (fast)
- Cache cleared on server restart

**Async Processing:**
- Social link extraction happens after main response sent
- Doesn't slow down initial reply
- Follow-up message sent immediately after

**Claude Efficiency:**
- Low temperature (0.3) for consistent extraction
- Max 500 tokens for quick response
- Simple prompt for fast processing

### Typical Timing

- Main response: ~2-5 seconds (Claude analysis of user query)
- Social link detection: ~2-3 seconds (Claude extraction + sending)
- Total: ~4-8 seconds for both messages

## Limitations

1. **TikTok Only** - Currently only supports TikTok links from CSV
2. **CSV Format** - Requires specific column order (Name, Type, City, TikTok Link...)
3. **5 Link Maximum** - Hard-coded limit to prevent overwhelming users
4. **Exact CSV Match** - Restaurant names must exist in CSV to be found
5. **Claude Dependent** - Requires Claude API for intelligent matching

## Future Enhancements

Potential improvements:

- Support multiple social platforms (Instagram, YouTube)
- Add fuzzy matching for better name detection
- Include video thumbnails or descriptions
- Allow user to request "show me videos" for more links
- Add analytics to track which videos are most relevant
- Support other file formats (JSON, database)

## Troubleshooting

### No videos appearing

**Check:**
1. Is the CSV file present at `files/brandoneats.csv`?
2. Are restaurant names in the CSV spelled correctly?
3. Do the TikTok links start with `https://`?
4. Check console logs for errors
5. Run test suite: `node test-social-links.js`

### Wrong videos appearing

**Check:**
1. Run test with the specific response text
2. Check Claude's detection output in console
3. Verify restaurant names in CSV match what bot says
4. Test Claude detection separately

### Videos not sending

**Check:**
1. Is `chatId` starting with "test-"? (test mode skips sending)
2. Check A1Zap API key and agent ID
3. Check console for sending errors
4. Verify rich content API is working (test with "a1" Easter egg)

## Related Features

- **A1 Easter Egg** - Test rich content with "a1" command
- **Rich Content API** - Full documentation in `RICH_CONTENT_GUIDE.md`
- **BrandyEats Agent** - Main agent configuration

## Commands Reference

```bash
# Test social link extraction
node test-social-links.js

# Test specific functionality
node test-social-links.js load      # Test CSV loading
node test-social-links.js extract   # Test extraction with mentions
node test-social-links.js partial   # Test partial name matching

# Test webhook (no videos sent)
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{"chat":{"id":"test-123"},"message":{"content":"Tell me about Rau Má Mix","id":"msg-123"},"agent":{"id":"j972wdq9j43c6wda1gga784gxn7qwpzs"}}'

# Clear cache (in Node REPL or code)
const extractor = require('./services/social-link-extractor');
extractor.clearCache();
```

## Summary

You now have intelligent, automatic TikTok video integration! The bot analyzes its own responses, detects mentioned restaurants, and sends relevant videos as a follow-up message. It's smart, automatic, and enhances the user experience with visual content.

**Try it:** Ask your bot about restaurants in Saigon and watch the magic happen! 🎥✨

