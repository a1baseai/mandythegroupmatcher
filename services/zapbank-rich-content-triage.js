/**
 * Zap Bank Rich Content Triage Service
 * 
 * AI-powered decision making for when to send rich content in Zap Bank conversations.
 * Analyzes conversation context to determine if carousels, product cards, or CTA buttons
 * would enhance the user experience.
 * 
 * This service is specific to Zap Bank's products and use cases.
 */

const claudeService = require('./claude-service');
const config = require('../config');

class ZapBankRichContentTriage {
  constructor() {
    this.claudeService = claudeService;
  }

  /**
   * Analyze conversation to determine if rich content should be sent
   * Uses AI to intelligently detect when carousel, product cards, or CTAs would enhance UX
   * 
   * @param {Array} conversationHistory - Previous conversation messages [{role, content}]
   * @param {string} userMessage - Latest user message
   * @param {string} agentResponse - Agent's text response
   * @returns {Promise<Object>} Decision object: { shouldSend, contentType, productType?, reasoning, accompanyingMessage? }
   */
  async analyze(conversationHistory, userMessage, agentResponse) {
    try {
      const systemPrompt = `You are a Rich Content Triage Analyzer for a banking AI assistant. Your job is to analyze conversations and determine if rich content (visual/interactive elements) would enhance the user experience.

AVAILABLE RICH CONTENT TYPES:

1. **carousel** - Photo carousel showing multiple products
   - Use when: User is exploring options, asking for overview, comparing products
   - Example: "What do you offer?", "Tell me about your features"
   - Shows: Treasury, Corporate Cards, Checking, Bill Pay, Integrations

2. **product_card** - Detailed card for specific product
   - Use when: Deep discussion of ONE specific product
   - Products available: 'treasury', 'corporate-cards', 'checking'
   - Example: Discussing "4.09% APY Treasury" in detail

3. **cta_buttons** - Call-to-action buttons (Apply Now, Learn More, Schedule Demo)
   - Use when: User shows genuine interest/readiness for next steps
   - Example: "How do I get started?", "Sounds good", "I'm interested"
   - Must feel natural, not pushy

4. **none** - No rich content needed
   - Use when: Rich content would be distracting, redundant, or premature
   - Example: Just asking questions, early in conversation, already sent content recently

ANALYSIS GUIDELINES:

✅ DO send rich content when:
- It genuinely adds value to the conversation
- User signals interest or exploration
- Timing feels natural (not forced)
- Visual aid would help understanding
- User is ready for next steps (CTAs)

❌ DON'T send rich content when:
- Just answering a simple question
- Too early in the conversation
- Would feel like spam or interruption
- Already sent similar content recently
- User seems to want just information

DECISION PROCESS:
1. Read the full conversation context
2. Understand user's current intent and stage
3. Consider if rich content adds value NOW
4. Choose the most appropriate type (or none)
5. Provide brief reasoning

RESPONSE FORMAT (JSON ONLY):
{
  "shouldSend": true/false,
  "contentType": "carousel" | "product_card" | "cta_buttons" | "none",
  "productType": "treasury" | "corporate-cards" | "checking" | null,
  "reasoning": "Brief explanation of decision",
  "accompanyingMessage": "A short, Zack-style message that flows naturally from the agent's previous response (only if shouldSend is true)"
}

ACCOMPANYING MESSAGE REQUIREMENTS (when shouldSend is true):
- Write in Zack's voice: flirty, spicy, confident, startup-friendly 😏
- Should feel like a natural continuation of the previous response
- Keep it SHORT (1-2 sentences max)
- Use emojis naturally: 👀 🔥 💰 💳 😉
- Examples:
  * "Check these out 👀"
  * "Here's what I'm talking about 🔥"
  * "Let me show you the good stuff 💰"
  * "Take a look at what we've got for you 😉"
  * "Ready to see the magic? 👇"

IMPORTANT:
- Return ONLY valid JSON, no other text
- Be conservative - when in doubt, choose "none"
- productType only needed when contentType is "product_card"
- accompanyingMessage only needed when shouldSend is true
- Consider conversation flow and naturalness
- Avoid overwhelming users with too much rich content`;

      // Build the analysis prompt
      const conversationContext = conversationHistory.length > 0
        ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
        : '(No previous conversation)';

      const analysisPrompt = `CONVERSATION HISTORY:
${conversationContext}

LATEST USER MESSAGE:
${userMessage}

AGENT'S TEXT RESPONSE:
${agentResponse}

Based on this conversation, should we send rich content? If so, what type?

Analyze the context and return your decision as JSON.`;

      const messages = [{
        role: 'user',
        content: analysisPrompt
      }];

      console.log('🤖 Analyzing rich content opportunity with AI...');

      const response = await this.claudeService.client.messages.create({
        model: config.claude.defaultModel,
        max_tokens: 500, // Small response needed
        temperature: 0.3, // Low temperature for consistent decisions
        system: systemPrompt,
        messages: messages
      });

      let jsonResponse = response.content[0].text.trim();
      console.log('📊 AI triage response:', jsonResponse);

      // Strip markdown code blocks if present (Claude sometimes wraps JSON in ```json ... ```)
      if (jsonResponse.startsWith('```')) {
        jsonResponse = jsonResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      }

      // Parse JSON response
      let decision;
      try {
        decision = JSON.parse(jsonResponse);
      } catch (parseError) {
        console.error('❌ Failed to parse AI triage JSON:', parseError.message);
        console.error('Raw response:', jsonResponse);
        // Return safe default
        return {
          shouldSend: false,
          contentType: 'none',
          productType: null,
          reasoning: 'JSON parsing failed'
        };
      }

      // Validate response structure
      if (typeof decision.shouldSend !== 'boolean') {
        console.warn('⚠️  Invalid AI triage response structure');
        return {
          shouldSend: false,
          contentType: 'none',
          productType: null,
          reasoning: 'Invalid response structure'
        };
      }

      console.log(`✅ AI Decision: ${decision.shouldSend ? decision.contentType : 'none'} - ${decision.reasoning}`);
      return decision;

    } catch (error) {
      console.error('❌ Error in AI rich content analysis:', error.message);
      // Safe fallback - don't send rich content on error
      return {
        shouldSend: false,
        contentType: 'none',
        productType: null,
        reasoning: 'Analysis error'
      };
    }
  }
}

// Export singleton instance
module.exports = new ZapBankRichContentTriage();

