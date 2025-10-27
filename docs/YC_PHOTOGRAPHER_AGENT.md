# Yash the YC Photographer Agent

## Overview

The YC Photographer agent is an AI-powered image editing agent that places people in iconic Y Combinator settings. Built using the same architecture as the Makeup Artist agent, it leverages Gemini's image generation capabilities to transform photos.

## Features

### Two Signature Styles

1. **YC Sign Photo** (Default)
   - Places subjects in front of the iconic Y Combinator office sign
   - Outdoor entrance setting with natural lighting
   - Professional but approachable atmosphere
   
2. **Orange Background Studio**
   - Places subjects in front of the famous YC orange background wall
   - Features distinctive acoustic foam panels
   - Clean studio setup with professional lighting

### Automatic Style Detection

The agent automatically detects which style you want based on keywords in your message:

**YC Sign Keywords:** "sign", "entrance", "door", "outside", "outdoor"
**Orange Background Keywords:** "orange", "background", "wall", "foam", "panel", "studio", "indoor"

If no specific keywords are detected, it defaults to the YC sign style.

### Multi-Turn Conversations

- Supports iterative editing across conversation turns
- Tracks previous style requests
- Recognizes "same style" and "this one too" requests
- Maintains conversation context even when A1Zap history is unavailable

### Multiple People Support

- **Group Photos**: Automatically detects and includes ALL people in the image
- **Natural Poses**: Each person gets a unique pose with variety
- **Mix of Styles**: Combines professional poses (arms crossed, confident stance) with fun poses (peace signs, thumbs up, pointing at sign)
- **Authentic Energy**: Captures the excitement and camaraderie of startup teams
- **Works for**: Co-founders, full teams, pairs, or solo portraits

## Usage Examples

### Basic Usage

```
User: [sends photo]
Yash: 📸 Here's your YC photo! Looking great in front of the sign!

User: Can I see the orange background version?
Yash: 📸 Here you go with the iconic YC orange background!

User: [sends another photo] Same style
Yash: 📸 Another great shot with the orange background!
```

### Style-Specific Requests

```
User: [sends photo] Put me in front of the YC sign
Yash: 📸 Perfect! You're all set in front of the famous YC entrance!

User: [sends photo] Give me the orange studio look
Yash: 📸 There you go - classic YC orange background with foam panels!
```

### Group Photo Examples

```
User: [sends team photo with 3 co-founders] YC sign please!
Yash: 📸 Love the team energy! Here's your founding team in front of the YC sign!
      [All 3 people appear with varied natural poses]

User: [sends photo with 2 people] Orange background for our co-founder photo
Yash: 📸 Perfect co-founder vibes! You two look great in front of the orange wall!
      [Both people visible with mix of professional and casual poses]
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# YC Photographer Agent (Yash)
YC_PHOTOGRAPHER_API_KEY=your_yc_photographer_api_key_here
YC_PHOTOGRAPHER_AGENT_ID=your_yc_photographer_agent_id_here
YC_PHOTOGRAPHER_API_URL=https://api.a1zap.com/v1/messages/individual

# Optional: Send reference images before edited photos
YC_SEND_REFERENCE_IMAGES=true
```

If not specified, the agent will fall back to the default `A1ZAP_API_KEY`.

### Reference Images Feature (Optional)

The agent can send a reference image showing the YC setting **before** sending the edited photo. This helps users understand what they're getting.

**To enable:**
1. Set `YC_SEND_REFERENCE_IMAGES=true` in your `.env`
2. Place reference images in the `reference-images/` directory:
   - `yc-sign-reference.jpg` - Photo of YC sign entrance
   - `yc-orange-reference.jpg` - Photo of YC orange background

**Example flow:**
```
User: [sends photo] "Can I get the orange background?"

Agent: 📸 Here's what the YC Orange Background looks like! I'll place you in this setting.
       [sends reference image]
       
Agent: Here you go! Looking fantastic in front of the YC orange wall! 🧡
       [sends edited photo]
```

See `reference-images/README.md` for detailed setup instructions.

### Webhook Endpoint

The agent is registered at:
```
POST /webhook/yc-photographer
```

## Technical Architecture

### Agent Class
- **File:** `agents/yc-photographer-agent.js`
- **Extends:** `BaseAgent`
- **Model:** `gemini-2.5-flash-image`
- **Key Methods:**
  - `buildPrompt()` - Builds context-aware prompts
  - `detectStyle()` - Automatically detects requested style
  - `getStylePrompt()` - Returns detailed style-specific prompts

### Webhook Handler
- **File:** `webhooks/yc-photographer-webhook.js`
- **Extends:** `BaseWebhook`
- **Features:**
  - IMAGE mode: Generates edited images
  - TEXT mode: Conversational responses
  - Image context tracking (current, history, cache)
  - Multi-turn conversation support

### Image Generation

Uses Gemini's `generateEditedImage()` service with:
- Temperature: 0.7
- Model: gemini-2.5-flash-image
- Automatic image storage in `temp-images/`
- Public URL generation for WhatsApp delivery

## Personality & Style

**Agent Name:** Yash the YC Photographer

**Communication Style:**
- Enthusiastic and friendly
- Professional photographer persona
- Brief and engaging responses
- Uses photographer language ("Great shot!", "Perfect lighting!", "Great group energy!")
- Celebrates team dynamics ("Love the team energy!", "Perfect founder squad!")
- References YC culture and startup energy
- Acknowledges group photos and co-founder teams

**Response Format:**
- Brief text confirmation (1-2 sentences)
- Accompanied by the edited image
- Enthusiastic and celebratory tone

## Integration with A1Zap

The agent integrates seamlessly with A1Zap's messaging API:
- Sends media messages with proper formatting
- Includes image dimensions for optimal display
- Handles both text and image responses
- Supports test mode for development

## Testing

Use the test chat ID pattern to test without sending to A1Zap:
```javascript
if (webhookHelpers.isTestChat(chatId)) {
  // Skip A1Zap send, only log
}
```

## Customization

To customize the agent's personality, edit the `getSystemPrompt()` method in `agents/yc-photographer-agent.js`. See `docs/AGENT_PERSONALITY_GUIDE.md` for detailed instructions.

## Dependencies

- **Gemini Service:** Image generation and conversational AI
- **Image Storage:** Temporary file storage and URL generation
- **Conversation Cache:** Context tracking across messages
- **Webhook Helpers:** Utility functions for webhook handling
- **BaseA1ZapClient:** Unified messaging client

## Files Created

1. `agents/yc-photographer-agent.js` - Agent configuration
2. `webhooks/yc-photographer-webhook.js` - Webhook handler
3. Updated `config.js` - Added ycPhotographer configuration
4. Updated `server.js` - Registered agent in AgentRegistry

## Reference Images

The agent supports sending reference images before generating edited photos (optional feature):

**Configuration:**
- Set `YC_SEND_REFERENCE_IMAGES=true` in `.env`
- Place reference images in `reference-images/`:
  - `yc-sign-reference.jpg`
  - `yc-orange-reference.jpg`

**Benefits:**
- Sets clear expectations
- Shows users what the setting looks like
- Professional onboarding experience
- Reduces confusion between styles

**Implementation:**
- Reference images sent only when feature is enabled
- Automatic style detection determines which reference to send
- 500ms delay ensures proper message ordering
- Fails gracefully if images not found

## Future Enhancements

Potential improvements:
- Add more YC-themed locations (office interior, demo day stage, etc.)
- Support for group photos
- Custom background variations
- Batch processing for multiple images
- Video support for YC pitch scenes
- Additional reference images for different angles

---

Built with ❤️ for the YC community

