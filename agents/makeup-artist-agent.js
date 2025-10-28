/**
 * Makeup Artist Agent Configuration
 * Uses Gemini's image generation to apply cosmetic changes to uploaded images
 * Supports multi-turn conversations for iterative refinement
 * 
 * 🎭 CUSTOMIZE YOUR AGENT PERSONALITY HERE!
 * 
 * Edit the 'getSystemPrompt' method below to change how your agent behaves.
 * See docs/AGENT_PERSONALITY_GUIDE.md for detailed examples and instructions.
 */

const BaseAgent = require('../core/BaseAgent');

class MakeupArtistAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Makeup Artist',
      role: 'Professional Makeup Artist & Beauty Consultant',
      description: 'AI makeup artist that applies cosmetic changes to images using advanced image editing',
      model: 'gemini',
      generationOptions: {
        temperature: 0.7,    // Balanced creativity for makeup artistry
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
    return `You are a Professional Makeup Artist and Beauty Consultant with expertise in cosmetic application and enhancement.

Your Purpose:
- Help users enhance their photos with makeup and cosmetic changes
- Provide expert guidance on makeup styles, colors, and techniques
- Apply makeup edits to uploaded images with precision and artistry
- Support iterative refinement through conversation

Your Capabilities:
You can apply various makeup changes including:
- Lipstick (red, pink, nude, berry, coral, mauve, bold colors)
- Eye makeup (eyeshadow, eyeliner, mascara, smokey eyes, natural looks)
- Foundation and skin tone adjustments (evening skin tone, brightening, contouring)
- Blush and highlighter (subtle glow, dramatic contour)
- Eyebrows (shaping, filling, defining)
- Complete makeup looks (natural, glamorous, dramatic, editorial)

Communication Style:
- Friendly, professional, and encouraging
- Provide helpful suggestions when users are unsure
- Explain what changes you're making and why
- Ask clarifying questions if the request is unclear
- Offer complementary suggestions (e.g., "That lipstick would look great with some subtle eyeliner!")

Guidelines:
- Always be respectful and body-positive
- When you receive an image, analyze the current look and suggest enhancements
- For vague requests, suggest 2-3 specific options
- For multi-turn conversations, reference previous edits naturally
- Keep text responses concise - let the image do most of the talking!

Examples of requests you might receive:
- "Add red lipstick"
- "Give me a natural everyday makeup look"
- "Make the eye makeup more dramatic"
- "Can you add some highlighter and make my skin glow?"
- "Try a smokey eye with nude lips"

Remember: You're creating beautiful, confidence-boosting looks!`;
  }

  /**
   * Build a prompt with conversation context for makeup editing
   * Handles multi-turn conversations and references to previous requests
   * @param {string} userMessage - Current user message
   * @param {Array} conversation - Conversation history
   * @param {boolean} isFirstMessage - Whether this is the first message
   * @returns {string} Contextual prompt for image generation
   */
  buildPrompt(userMessage, conversation = [], isFirstMessage = false) {
    // Normalize the user message - treat "[Image]" as empty since it's just a placeholder
    const normalizedMessage = userMessage && userMessage.trim() === '[Image]' ? '' : userMessage;
    
    // Extract makeup-related context from conversation history
    let context = '';
    let previousMakeupStyle = null;
    
    if (!isFirstMessage && conversation.length > 0) {
      // Look for recent makeup requests in the last few messages
      const recentMessages = conversation.slice(-10); // Last 10 messages
      const makeupRequests = recentMessages
        .filter(msg => msg.role === 'user' && msg.content.trim())
        .map(msg => msg.content.trim())
        .filter(content => {
          // Skip "[Image]" placeholder messages
          if (content === '[Image]') return false;
          
          // Filter for makeup-related requests
          const lowerContent = content.toLowerCase();
          return lowerContent.includes('makeup') || 
                 lowerContent.includes('lipstick') || 
                 lowerContent.includes('eye') || 
                 lowerContent.includes('glam') || 
                 lowerContent.includes('natural') || 
                 lowerContent.includes('dramatic') ||
                 lowerContent.includes('contour') ||
                 lowerContent.includes('highlight') ||
                 lowerContent.includes('blush') ||
                 lowerContent.includes('foundation') ||
                 lowerContent.includes('casino') ||
                 lowerContent.includes('royale') ||
                 lowerContent.includes('pink') ||
                 lowerContent.includes('blue') ||
                 lowerContent.includes('red') ||
                 lowerContent.includes('slim') ||
                 content.length > 15; // Include substantial messages
        });
      
      // Get the most recent substantive makeup request for reference
      if (makeupRequests.length > 0) {
        previousMakeupStyle = makeupRequests[makeupRequests.length - 1];
        context = `Previous request context: ${makeupRequests.join(' → ')}\n\n`;
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
      (lowerMessage === 'yes' && previousMakeupStyle);
    
    // If user message is empty or referencing previous, use context
    const hasSubstantialMessage = normalizedMessage && normalizedMessage.trim().length > 5;
    
    if ((!hasSubstantialMessage || isReferencingPrevious) && previousMakeupStyle) {
      return `Apply this makeup style: ${previousMakeupStyle}

Keep your text response brief and friendly - describe what you've done in 1-2 sentences.`;
    }
    
    if (isFirstMessage) {
      // First message - if no substantive request, apply a default natural look
      if (!normalizedMessage || normalizedMessage.length < 5) {
        return `Apply a natural, flattering makeup look to this image. Include subtle enhancements like soft eye makeup, natural-looking foundation, and a touch of color on the lips. Keep your text response brief and friendly - describe what you've done in 1-2 sentences.`;
      }
      
      return `${normalizedMessage}

Please analyze the image and apply the requested makeup changes. Keep your text response brief and friendly - describe what you've done in 1-2 sentences.`;
    }
    
    // If no substantive message and no context, apply a default look
    if ((!normalizedMessage || normalizedMessage.length < 5) && !context) {
      return `Apply a natural, flattering makeup look to this image. Include subtle enhancements like soft eye makeup, natural-looking foundation, and a touch of color on the lips. Keep your text response brief and friendly - describe what you've done in 1-2 sentences.`;
    }
    
    return `${context}${normalizedMessage}

Apply this change to the image. Keep your response brief.`;
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

I'm your **AI Makeup Artist** and I'm here to help you create stunning looks! 💄✨

I can apply professional makeup to your photos using advanced AI image editing. Whether you want a subtle natural look or full glam, I've got you covered!

**What I can do:**
• Apply lipstick in any color (red, pink, nude, bold shades)
• Create eye makeup looks (natural, smokey, dramatic)
• Add foundation, blush, highlighter, and contouring
• Shape and define eyebrows
• Create complete makeup looks for any occasion

**How to get started:**
📸 Just share a photo of yourself (or anyone you'd like to see with makeup)
💬 Tell me what look you want - be specific or ask for suggestions!

**Examples:**
• "Add red lipstick"
• "Give me a natural everyday look"
• "Smokey eye with nude lips"
• "Glam me up for a night out!"

Ready to try? Share a photo and let's create something beautiful! 😊`;
  }
}

// Export a singleton instance
module.exports = new MakeupArtistAgent();
