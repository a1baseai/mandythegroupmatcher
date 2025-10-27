# Reference Images Feature Implementation

## Overview

The YC Photographer agent uses reference images in two powerful ways:

1. **AI Input**: Reference images are passed to Gemini as input, allowing the AI to see the actual YC setting and match it precisely
2. **User Preview**: Reference images are sent to users to show them what setting they'll be placed in

This dual approach ensures both accurate AI generation AND clear user expectations.

## What Was Implemented

### 1. Gemini Service Enhancement (`services/gemini-service.js`)
- Added `referenceImageUrl` parameter to `generateEditedImage()`
- Fetches and encodes reference image as base64
- Passes reference image to Gemini as **first input** (before user image)
- Enables multi-image composition for accurate results

### 2. Server Updates (`server.js`)
- Added static file serving for `/reference-images` directory
- Reference images are now publicly accessible at: `https://your-domain.com/reference-images/{filename}`

### 3. Webhook Updates (`webhooks/yc-photographer-webhook.js`)

Added multiple new features:

#### A. Reference Image Configuration
```javascript
this.referenceImagesEnabled = process.env.YC_SEND_REFERENCE_IMAGES === 'true' || false;
this.referenceImagesDir = path.join(__dirname, '..', 'reference-images');
```

#### B. `getReferenceImageUrl(style)` Method
- Returns public URL for reference image based on style ('sign' or 'orange')
- Checks if file exists before returning URL
- Returns `null` if feature disabled or file not found

#### C. `sendReferenceImage(chatId, style)` Method
- Sends reference image with descriptive message
- Called automatically before generating edited image
- Fails gracefully if image not available

#### D. Updated `processImageMode()` Method
- Detects which style the user wants
- Gets reference image URL
- **Passes reference image to Gemini** for AI generation (NEW!)
- Also sends reference image to user as preview (if enabled)
- Adds 500ms delay to ensure proper message ordering
- Generates and sends AI-composed photo

### 4. Agent Prompts Update (`agents/yc-photographer-agent.js`)
- Updated `getStylePrompt()` to include `withReferenceImage` parameter
- Prompts now explicitly tell Gemini about the two-image input
- AI instructions adjusted for multi-image composition

### 5. Documentation
- Created `reference-images/README.md` - Detailed setup guide
- Updated `docs/YC_PHOTOGRAPHER_AGENT.md` - Feature documentation
- Added `REFERENCE_IMAGES_AI_ENHANCEMENT.md` - Technical deep dive

## How It Works

### Message Flow

```
1. User sends photo: "Put me in front of the YC sign"
   ↓
2. Agent detects style: "sign"
   ↓
3. [IF ENABLED] Get reference image URL: yc-sign-reference.jpg
   ↓
4. Send reference to user as preview:
   "📸 Here's what the YC Sign Entrance looks like! I'll place you in this setting."
   ↓
5. Wait 500ms
   ↓
6. Pass BOTH images to Gemini:
   - Reference image (YC sign setting)
   - User's photo (person to place)
   - Text prompt (instructions)
   ↓
7. Gemini generates composite image using reference as guide
   ↓
8. Send edited photo:
   "📸 Here's your YC photo! Looking great in front of the sign!"
```

### Style Detection

The agent automatically detects which reference image to send based on keywords:

- **YC Sign** (`yc-sign-reference.jpg`):
  - Keywords: "sign", "entrance", "door", "outside", "outdoor"
  
- **Orange Background** (`yc-orange-reference.jpg`):
  - Keywords: "orange", "background", "wall", "foam", "panel", "studio", "indoor"

## Setup Instructions

### Step 1: Enable the Feature

Add to your `.env` file:
```bash
YC_SEND_REFERENCE_IMAGES=true
```

### Step 2: Add Reference Images

Place these files in the `reference-images/` directory:

1. `yc-sign-reference.jpg` - Photo showing the YC sign entrance
2. `yc-orange-reference.jpg` - Photo showing the YC orange background

**Image Guidelines:**
- Resolution: At least 1024x1024 pixels
- Format: JPEG or PNG (JPEG preferred)
- Clear, well-lit photos
- Front-facing perspective

### Step 3: Restart Server

```bash
npm start
```

## Feature Behavior

### When Enabled (`YC_SEND_REFERENCE_IMAGES=true`)
✅ Reference image sent before edited photo
✅ Style detected automatically from user's message
✅ 500ms delay ensures proper ordering
✅ Works for both styles (sign & orange)

### When Disabled (default)
❌ No reference images sent
✅ Normal behavior - only edited photo is sent
✅ No performance impact

### Graceful Failures
- **Feature disabled**: Skips reference image silently
- **File not found**: Logs warning, continues with edited photo
- **Send error**: Logs error, continues with edited photo
- **Test mode**: Reference images not sent (to avoid confusion during development)

## Benefits

### For AI Accuracy:
1. **Precise Matching** - AI sees the actual YC setting and can match it exactly
2. **Consistent Results** - Every photo uses the same reference for uniform quality
3. **Fewer Hallucinations** - AI doesn't have to guess what YC settings look like
4. **Better Composition** - Understands spatial relationships and lighting from reference

### For User Experience:
1. **User Clarity** - Users understand what they're getting before receiving their photo
2. **Expectation Setting** - Shows the exact YC setting they'll be placed in
3. **Professional Experience** - Enhances the overall agent interaction
4. **Style Education** - Helps users understand the difference between the two styles
5. **Brand Consistency** - Showcases the authentic YC aesthetic

## Examples

### Example 1: YC Sign Request
```
User: [uploads photo] "Put me in front of the YC sign"

Agent: 📸 Here's what the YC Sign Entrance looks like! I'll place you in this setting.
       [sends yc-sign-reference.jpg]
       
       (500ms delay)
       
Agent: 📸 Here's your YC photo! Looking great in front of the sign!
       [sends edited photo]
```

### Example 2: Orange Background Request
```
User: [uploads photo] "Give me the orange background"

Agent: 📸 Here's what the YC Orange Background looks like! I'll place you in this setting.
       [sends yc-orange-reference.jpg]
       
       (500ms delay)
       
Agent: Here you go! Looking fantastic in front of the YC orange wall! 🧡
       [sends edited photo]
```

### Example 3: Multi-turn with Same Style
```
User: [photo 1] "YC sign please"
Agent: [sends reference] → [sends edited photo]

User: [photo 2] "Same style"
Agent: [sends reference] → [sends edited photo]
```

## Technical Details

### File Structure
```
/reference-images/
  ├── README.md
  ├── yc-sign-reference.jpg
  └── yc-orange-reference.jpg
```

### Environment Variables
```bash
# Required for agent to work
YC_PHOTOGRAPHER_API_KEY=your_api_key
YC_PHOTOGRAPHER_AGENT_ID=your_agent_id

# Optional for reference images
YC_SEND_REFERENCE_IMAGES=true
```

### Public Endpoints
- `/reference-images/yc-sign-reference.jpg`
- `/reference-images/yc-orange-reference.jpg`

### Code Locations
- Feature implementation: `webhooks/yc-photographer-webhook.js`
- Server configuration: `server.js` (line 52)
- Documentation: `docs/YC_PHOTOGRAPHER_AGENT.md`
- Setup guide: `reference-images/README.md`

## Testing

### Test with Feature Enabled
1. Set `YC_SEND_REFERENCE_IMAGES=true`
2. Add reference images
3. Send test webhook with image + "Put me in front of YC sign"
4. Verify: reference image sent first, then edited photo

### Test with Feature Disabled
1. Remove or set `YC_SEND_REFERENCE_IMAGES=false`
2. Send test webhook with image
3. Verify: only edited photo sent (no reference)

### Test Missing Reference Images
1. Set `YC_SEND_REFERENCE_IMAGES=true`
2. Don't add reference images
3. Send test webhook
4. Verify: warning logged, edited photo still sent

## Performance Impact

- **Minimal**: Only ~500ms delay when enabled
- **Optional**: Disabled by default
- **Non-blocking**: Reference image failures don't affect edited photo generation
- **Efficient**: Single file system check per request

## Future Enhancements

Potential improvements:
- Support for video reference clips
- Multiple reference angles per style
- User preference storage (don't show reference after first time)
- Reference image caching in WhatsApp
- Interactive reference image carousel

---

**Status**: ✅ Fully implemented and ready to use
**Version**: 1.0.0
**Date**: October 26, 2025

