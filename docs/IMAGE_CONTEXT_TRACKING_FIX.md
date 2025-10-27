# Image Context Tracking Fix

## Problem

The makeup artist agent wasn't tracking previous images and makeup requests, causing issues like:

1. User: "Apply it to this image too" → Agent asks what makeup to apply (ignoring previous style)
2. User: "Yes" (confirming a change) → Agent asks them to upload an image (ignoring context)
3. User shares multiple images in sequence → Agent doesn't remember earlier images

## Root Cause Analysis

The conversation history was being tracked, but:

1. **Images weren't included in history** - `processMessageHistory` only tracked text content, completely ignoring `media` fields
2. **Previous makeup requests weren't extracted** - No logic to identify what makeup style was requested before
3. **Reference phrases weren't detected** - Phrases like "apply it", "same style", "this image too" weren't recognized
4. **No fallback to recent images** - When user says "Yes" without an image, the system didn't look for recent images

## Solution Implemented

### 1. Enhanced `webhook-helpers.js`

Added three new helper functions:

#### `processMessageHistory` (Enhanced)
```javascript
processMessageHistory(messageHistory, agentId, includeImages = false)
```
- New parameter: `includeImages` - when `true`, tracks `imageUrl` from `msg.media.url`
- Now captures image-only messages (user sends image without text)
- Backward compatible (defaults to `false` for other agents)

#### `findRecentImage` (New)
```javascript
findRecentImage(conversation, lookbackLimit = 5)
```
- Searches backward through conversation history for user-uploaded images
- Returns the most recent image URL within the lookback limit
- Useful when user says "Yes" or similar without attaching a new image

#### `extractPreviousMakeupRequest` (New)
```javascript
extractPreviousMakeupRequest(conversation, lookbackLimit = 10)
```
- Finds the most recent substantive makeup request from the user
- Filters out trivial messages like "yes", "ok" 
- Looks for makeup-related keywords (lipstick, eye, glam, blue, slim, etc.)
- Returns the full text of the previous request

### 2. Updated `makeup-artist-webhook.js`

Enhanced the webhook handler to:

1. **Fetch history with images enabled**:
   ```javascript
   const conversation = await webhookHelpers.fetchAndProcessHistory(
     a1zapClient, chatId, agentId, 20, true  // true = include images
   );
   ```

2. **Fallback to recent images**:
   ```javascript
   let effectiveImageUrl = imageUrl;
   if (!effectiveImageUrl) {
     effectiveImageUrl = webhookHelpers.findRecentImage(conversation, 5);
   }
   ```

3. **Extract previous context**:
   ```javascript
   const previousRequest = webhookHelpers.extractPreviousMakeupRequest(conversation, 10);
   ```

4. **Smart prompt building**:
   - If user sends text without image but there's a recent image and previous request
   - Use the previous request as the makeup style to apply

### 3. Enhanced `makeup-artist-agent.js` Prompt Building

Updated `buildPrompt` function to:

1. **Detect reference phrases**:
   - "apply it"
   - "same"
   - "this image too"
   - "do the same"
   - "like before"
   - "yes" (when there's a previous makeup request)

2. **Use previous makeup style when appropriate**:
   ```javascript
   if ((!hasSubstantialMessage || isReferencingPrevious) && previousMakeupStyle) {
     return `Apply this makeup style: ${previousMakeupStyle}
     
     Keep your text response brief and friendly - describe what you've done in 1-2 sentences.`;
   }
   ```

## Testing

### Unit Tests

Run the image context tracking test:
```bash
node tests/test-image-context-tracking.js
```

Expected results:
- ✅ Find recent image from history
- ✅ Extract previous makeup request
- ✅ Build prompt referencing previous style
- ✅ Process history with image URLs
- ✅ Handle "Yes" with context

### Integration Test

To verify if the A1Zap API actually returns media fields in message history:

```bash
node tests/test-history-media-field.js <REAL_CHAT_ID>
```

Replace `<REAL_CHAT_ID>` with an actual chat ID from a makeup artist conversation.

**This test will reveal:**
- ✅ If media fields are included in the API response
- ✅ What the media field structure looks like
- ✅ If our image tracking logic works end-to-end

### Manual Testing

1. Start the server: `npm start`
2. Send an image with makeup request: "Natural makeup with pink lipstick"
3. Agent should apply makeup and respond
4. Send another image with: "Apply it to this image too"
5. **Expected**: Agent applies the same "natural makeup with pink lipstick" style
6. Send a new request: "Make the lips blue"
7. Agent confirms: "Would you like me to proceed?"
8. Reply: "Yes"
9. **Expected**: Agent applies blue lips to the most recent image

## Potential Issues

### Issue: API May Not Return Media in History

Many chat APIs don't include media attachments in history endpoints for performance reasons.

**If `test-history-media-field.js` shows NO media fields:**

This is a **backend limitation** and requires a different solution:

#### Option A: Local Image Cache
Store recent images in memory with chat context:
```javascript
const imageCache = new Map(); // chatId -> [recent images]
```

#### Option B: Session-Based Tracking
Track images per chat session in Redis or a database

#### Option C: Request API Enhancement
Contact A1Zap team to request media inclusion in history endpoint

#### Option D: Parse from Content
If images are referenced in message content (e.g., `"[Image: url]"`), parse them

### Issue: Memory Limitations

If tracking images for many chats, we'll need to:
- Implement cache expiration (TTL)
- Limit number of images stored per chat
- Consider persistent storage for longer conversations

## Files Changed

### Modified
- `/services/webhook-helpers.js` - Added image tracking helpers
- `/webhooks/makeup-artist-webhook.js` - Integrated image context tracking
- `/agents/makeup-artist-agent.js` - Enhanced prompt building

### Created
- `/tests/test-image-context-tracking.js` - Unit tests
- `/tests/test-history-media-field.js` - Integration test
- `/tests/debug-message-history.js` - Debug utility
- `/IMAGE_CONTEXT_TRACKING_FIX.md` - This document

## Next Steps

1. **Run the integration test** with a real chat ID:
   ```bash
   node tests/test-history-media-field.js <CHAT_ID>
   ```

2. **If media is NOT in history**: Implement image caching solution (Option A above)

3. **If media IS in history**: Test the full flow manually to verify everything works

4. **Deploy and monitor**: Watch for logs showing "📸 Found recent image" and "💄 Found previous makeup request"

## Success Criteria

The fix is working when:

✅ User says "Apply it to this image too" → Agent uses previous makeup style  
✅ User says "Yes" after a makeup request → Agent applies to recent image  
✅ User shares multiple images → Agent can reference earlier ones  
✅ No more "What kind of makeup would you like?" when context is clear  
✅ Logs show image tracking: `📸 Found recent image from N messages ago`  
✅ Logs show context tracking: `💄 Found previous makeup request: "..."`  

