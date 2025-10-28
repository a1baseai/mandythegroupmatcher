/**
 * YC Photographer Agent Configuration
 * Uses Gemini's image generation to place people in front of Y Combinator locations
 * Supports two styles: YC sign entrance or iconic orange background
 * 
 * 🎭 CUSTOMIZE YOUR AGENT PERSONALITY HERE!
 * 
 * Edit the 'getSystemPrompt' method below to change how your agent behaves.
 */

const BaseAgent = require('../core/BaseAgent');

class YCPhotographerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Yash the YC Photographer',
      role: 'Professional Photographer & Y Combinator Brand Specialist',
      description: 'AI photographer that places people in iconic Y Combinator settings',
      model: 'gemini',
      generationOptions: {
        temperature: 0.7,    // Balanced creativity for photo composition
        maxOutputTokens: 300, // Concise responses
        topP: 0.95,
        model: 'gemini-2.5-flash-image' // Gemini's image generation model
      }
    });
  }

  /**
   * Get the system prompt for this agent
   * 🎭 EDIT THIS to customize your agent's personality and behavior
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are Yash, a professional photographer specializing in Y Combinator brand photography.

Your Purpose:
- Transform user photos by placing them in iconic Y Combinator locations
- Create professional-looking photos that capture the YC aesthetic
- Support two signature styles: YC sign entrance and orange background studio
- Handle both individual portraits and group photos (teams, co-founders, etc.)
- Add natural pose variety - mix of professional and fun/casual styles
- Provide a friendly, enthusiastic photography experience

Your Two Signature Styles:

1. **YC Sign Photo** (Default)
   - Places subject in front of the iconic Y Combinator office sign
   - Outdoor setting at the YC entrance
   - Professional but natural look
   - Keywords: "sign", "entrance", "door", "outside", "outdoor"

2. **Orange Background Studio**
   - Places subject in front of the famous YC orange background wall
   - Features the distinctive acoustic foam panels
   - Clean studio setup with professional lighting
   - Keywords: "orange", "background", "wall", "foam", "panel", "studio", "indoor"

Communication Style:
- Enthusiastic and friendly, like a professional photographer
- Brief and engaging - let the photos do the talking!
- Use photographer language: "Great shot!", "Perfect lighting!", "Love this angle!", "Great group energy!"
- Celebrate team photos: "Love the team energy!", "Perfect founder squad!", "Great co-founder vibes!"
- Offer helpful suggestions when users are unsure which style to choose
- Reference YC culture and startup energy when appropriate

Guidelines:
- Default to YC sign style if the user's request is ambiguous
- Automatically detect which style they want from keywords in their message
- For multi-turn conversations, maintain the same style unless they ask to switch
- Keep responses brief and upbeat
- Celebrate their photos with enthusiasm!

Examples of requests you might receive:
- "Put me in front of the YC sign"
- "Can I get the orange background?"
- "Make it look like I'm at Y Combinator"
- "Give me the YC studio look"
- "Same style but this photo" (use previous style)
- "Team photo with the YC sign" (group photo request)
- "Get our whole founding team in front of the orange wall"

Special Handling:
- For GROUP PHOTOS: Ensure ALL people appear in the final photo with natural, varied poses
- Add authenticity: Mix of professional poses (arms crossed, confident stance) and fun poses (peace signs, pointing, relaxed)
- Keep the YC startup energy: These are founders who are excited and proud!

Remember: You're helping people and teams capture their YC moment!`;
  }

  /**
   * Build a prompt with conversation context for YC photo editing
   * Handles multi-turn conversations and automatic style detection
   * @param {string} userMessage - Current user message
   * @param {Array} conversation - Conversation history
   * @param {boolean} isFirstMessage - Whether this is the first message
   * @returns {string} Contextual prompt for image generation
   */
  buildPrompt(userMessage, conversation = [], isFirstMessage = false) {
    // Normalize the user message - treat "[Image]" as empty since it's just a placeholder
    const normalizedMessage = userMessage && userMessage.trim() === '[Image]' ? '' : userMessage;
    
    // Extract style context from conversation history
    let context = '';
    let previousStyle = null;
    
    if (!isFirstMessage && conversation.length > 0) {
      // Look for recent style requests in the last few messages
      const recentMessages = conversation.slice(-10); // Last 10 messages
      const styleRequests = recentMessages
        .filter(msg => msg.role === 'user' && msg.content.trim())
        .map(msg => msg.content.trim())
        .filter(content => {
          // Skip "[Image]" placeholder messages
          if (content === '[Image]') return false;
          
          // Filter for YC photo-related requests
          const lowerContent = content.toLowerCase();
          return lowerContent.includes('yc') || 
                 lowerContent.includes('combinator') || 
                 lowerContent.includes('sign') || 
                 lowerContent.includes('orange') || 
                 lowerContent.includes('background') || 
                 lowerContent.includes('entrance') ||
                 lowerContent.includes('foam') ||
                 lowerContent.includes('wall') ||
                 lowerContent.includes('studio') ||
                 content.length > 15; // Include substantial messages
        });
      
      // Get the most recent style request for reference
      if (styleRequests.length > 0) {
        previousStyle = styleRequests[styleRequests.length - 1];
        context = `Previous request context: ${styleRequests.join(' → ')}\n\n`;
      }
    }
    
    // Check if user is clearly referring to a previous style
    const lowerMessage = normalizedMessage ? normalizedMessage.toLowerCase() : '';
    const isReferencingPrevious = 
      lowerMessage.includes('apply it') ||
      lowerMessage.includes('same') ||
      lowerMessage.includes('this image too') ||
      lowerMessage.includes('do the same') ||
      lowerMessage.includes('like before') ||
      lowerMessage.includes('this one too') ||
      (lowerMessage === 'yes' && previousStyle);
    
    // If user message is empty or referencing previous, use context
    const hasSubstantialMessage = normalizedMessage && normalizedMessage.trim().length > 5;
    
    if ((!hasSubstantialMessage || isReferencingPrevious) && previousStyle) {
      const detectedStyle = this.detectStyle(previousStyle);
      return `${this.getStylePrompt(detectedStyle)}

Keep your text response brief and enthusiastic - describe what you've done in 1-2 sentences.`;
    }
    
    // Detect which YC style the user wants
    const requestedStyle = this.detectStyle(normalizedMessage);
    
    if (isFirstMessage) {
      // First message - if no substantive request, apply default YC sign style
      if (!normalizedMessage || normalizedMessage.length < 5) {
        return `${this.getStylePrompt('sign')}

Keep your text response brief and enthusiastic - describe what you've done in 1-2 sentences.`;
      }
      
      return `${this.getStylePrompt(requestedStyle)}

Keep your text response brief and enthusiastic - describe what you've done in 1-2 sentences.`;
    }
    
    // If no substantive message and no context, apply default style
    if ((!normalizedMessage || normalizedMessage.length < 5) && !context) {
      return `${this.getStylePrompt('sign')}

Keep your text response brief and enthusiastic - describe what you've done in 1-2 sentences.`;
    }
    
    return `${context}${this.getStylePrompt(requestedStyle)}

Keep your response brief and enthusiastic.`;
  }

  /**
   * Detect which YC style the user wants based on keywords
   * @param {string} message - User's message
   * @returns {string} 'sign' or 'orange'
   */
  detectStyle(message) {
    if (!message) return 'sign'; // Default
    
    const lowerMessage = message.toLowerCase();
    
    // Keywords for orange background
    const orangeKeywords = ['orange', 'background', 'wall', 'foam', 'panel', 'studio', 'indoor'];
    const hasOrangeKeyword = orangeKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Keywords for YC sign
    const signKeywords = ['sign', 'entrance', 'door', 'outside', 'outdoor'];
    const hasSignKeyword = signKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // If both or neither, default to sign
    if (hasOrangeKeyword && !hasSignKeyword) {
      return 'orange';
    }
    
    return 'sign'; // Default to sign
  }

  /**
   * Get the detailed prompt for the requested style
   * @param {string} style - 'sign' or 'orange'
   * @param {boolean} withReferenceImage - Whether a reference image is being provided to the AI
   * @returns {string} Detailed prompt for image generation
   */
  getStylePrompt(style, withReferenceImage = false) {
    if (style === 'orange') {
      const intro = withReferenceImage 
        ? `IMPORTANT: You are provided with TWO separate images in order:

IMAGE 1 (REFERENCE/STYLE IMAGE): Shows the Y Combinator orange background setting that you should recreate
IMAGE 2 (SUBJECT IMAGE): Contains the people who should be placed in that setting

TASK: Take the people from IMAGE 2 and composite them into the setting shown in IMAGE 1. Use IMAGE 1 as your guide for the background, lighting, and overall aesthetic.`
        : `Place ALL people in this image in front of the iconic Y Combinator orange background wall.`;

      return `${intro}

The YC Orange Background should ${withReferenceImage ? 'match the reference and ' : ''}feature:
- Vibrant orange/burnt orange color (match the reference exactly)
- Distinctive acoustic foam panels arranged in a grid pattern on the wall
- Professional studio lighting setup
- Clean, professional photography aesthetic

IMPORTANT - Multiple People Handling:
- If there are MULTIPLE PEOPLE in the image, ensure ALL of them appear in the final photo
- Position them naturally in front of the orange wall (side by side, or in a small group)
- Give each person a unique, natural pose - mix of professional and fun/casual styles
- Pose variety: Some can be professional (arms crossed, hands in pockets, standing straight), others can be fun (peace signs, thumbs up, relaxed casual stance, slight lean)
- Keep it authentic - like a real YC founder photo where people are comfortable and showing personality
- If it's a solo person, give them a confident, natural pose

- Maintain each person's natural appearance, facial features, and proportions
- Create a high-quality, professional photo suitable for a YC profile or announcement
- The orange wall should be visible but the people remain the focal point`;
    }
    
    // Default: YC sign style
    const intro = withReferenceImage
      ? `IMPORTANT: You are provided with TWO separate images in order:

IMAGE 1 (REFERENCE/STYLE IMAGE): Shows the Y Combinator sign entrance setting that you should recreate
IMAGE 2 (SUBJECT IMAGE): Contains the people who should be placed in that setting

TASK: Take the people from IMAGE 2 and composite them into the setting shown in IMAGE 1. Use IMAGE 1 as your guide for the YC sign, outdoor entrance, lighting, and overall aesthetic.`
      : `Place ALL people in this image in front of the famous Y Combinator sign at their office entrance.`;

    return `${intro}

The YC Sign Entrance should ${withReferenceImage ? 'match the reference and ' : ''}feature:
- The iconic "Y Combinator" text sign (match the reference exactly)
- Outdoor entrance setting with natural lighting
- Professional but approachable atmosphere

IMPORTANT - Multiple People Handling:
- If there are MULTIPLE PEOPLE in the image, ensure ALL of them appear in the final photo
- Arrange them naturally in front of the YC sign (side by side, or in a casual group formation)
- Give each person a unique, natural pose - mix of professional and fun/casual styles
- Pose variety: Some can be professional (arms crossed, confident stance), others can be fun (pointing at the sign, peace signs, thumbs up, casual relaxed poses)
- Capture the startup energy - these are founders/team members who are excited to be at YC!
- If it's a solo person, give them a confident, natural pose (maybe pointing at the sign or standing proudly)
- Maintain a consistent and realistic lighting with the reference image and the placement of the people in the image
- Have them look physically at the place, and phyisically interacting with the sign as if it were a photo taken on a great iphone, with taste and composition
- Maintain each person's natural appearance, facial features, and proportions
- But chisel them out a bit more, make subtly fitter, sexier, with better fitting clothes
- Create a high-quality, professional photo that captures the YC startup energy
- The sign should be clearly visible but the people remain the focal point
- Make it feel authentic - like a real photo taken at the YC office, not overly staged`;
  }

  /**
   * Get welcome message for chat.started event
   * @param {string} userName - User's name (if available)
   * @param {boolean} isAnonymous - Whether the user is anonymous
   * @returns {string} Welcome message
   */
  getWelcomeMessage(userName, isAnonymous) {
    let greeting;
    if (userName && !isAnonymous) {
      const firstName = userName.split(' ')[0];
      greeting = `Hey ${firstName}! 👋`;
    } else {
      greeting = `Hey there! 👋`;
    }

    return `${greeting}

I'm **Yash**, your YC Photographer! 📸 I specialize in placing people in iconic Y Combinator settings.

I can transform your photos to make it look like you're at the legendary YC office - perfect for your founder journey!

**My signature styles:**

🏢 **YC Sign Photo**
Place you in front of the famous Y Combinator entrance sign
Great for: LinkedIn, team announcements, founder pride

🟧 **Orange Background Studio**
Put you in front of the iconic YC orange foam wall
Perfect for: Professional headshots, YC Demo Day vibes

**How to get started:**
📸 Share a photo of yourself (or your team!)
💬 Tell me which style you want, or just say "surprise me!"

**Examples:**
• "Put me in front of the YC sign"
• "Orange background please"
• "Team photo with the YC entrance"

Works for both solo shots and team photos - I'll make sure everyone looks great!

Ready to capture your YC moment? Share your photo! 🚀`;
  }
}

// Export a singleton instance
module.exports = new YCPhotographerAgent();

