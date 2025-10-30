# Zap Bank Representative Agent

## Overview

The Zap Bank Representative Agent is a modern fintech-style conversational AI designed to act as a sales advisor for Zap Bank. It features a friendly, tech-savvy personality that proactively recommends banking products based on user needs, while automatically delivering rich interactive content like product carousels, product cards, and call-to-action buttons.

## Agent Details

- **Agent Name**: Zap Bank Advisor
- **Role**: Banking Solutions Specialist
- **Model**: Claude Sonnet 4.5
- **Handle**: `zapbank-rep`
- **Webhook Path**: `/webhook/zapbank-rep`

## Personality & Communication Style

The agent embodies a **modern fintech vibe** - think companies like Stripe, Ramp, or Mercury:

- **Conversational**: Chats like you're texting a founder friend, not reading a bank brochure
- **Startup-friendly**: Uses terms like "runway," "burn rate," "scaling," "bootstrapped"
- **Emoji usage**: Natural use of relevant emojis (💰 💳 📊 🚀 ⚡) without overdoing it
- **Mobile-first**: Assumes users are on their phone - concise and scannable responses
- **Confident but helpful**: Knowledgeable without being pushy

## Product Knowledge Base

The agent has deep knowledge of these Zap Bank features:

### 1. Checking & Savings Accounts
- **$0 ACH fees** (completely free transfers)
- Up to **$75M FDIC insurance**
- Modern banking platform built for businesses
- Real-time balance updates and notifications

### 2. Treasury 💰
- **4.09% APY** on idle cash (market-leading rate)
- Automatic sweep of idle funds
- FDIC insured
- Perfect for parking runway or reserves

### 3. Corporate Cards 💳
- Up to **2% cashback** on all spend with Rho Platinum
- Virtual cards for online subscriptions
- Granular spending controls per card/employee
- Real-time transaction notifications

### 4. Expense Management 📊
- Eliminate expense reports completely
- Automatic receipt capture via mobile app
- Real-time categorization
- Seamless integration with cards

### 5. Bill Pay 💸
- Pay hundreds of vendors in minutes
- **Zero fees** (no matter how many payments)
- Schedule recurring payments
- Vendor management system

### 6. Invoice Generator 📄
- Generate professional, vendor-ready invoices fast
- Customizable templates
- Track payment status
- Export to accounting software

### 7. SAFE Note Generator 📝
- Generate SAFE notes in minutes (perfect for fundraising)
- YC-standard templates
- Legal compliance built-in
- Easy customization for your terms

### 8. Rho Partner Portal 🤝
- Built specifically for accountant advisors
- Manage multiple client accounts
- Streamlined workflows
- Help your clients grow

### 9. Accounting Integrations 🔗
- QuickBooks, Xero, NetSuite support
- Automatic transaction sync
- Close books faster (save hours monthly)
- Real-time reconciliation

## Rich Content Features

The agent automatically sends rich interactive content based on conversation context:

### Product Carousel 📸

**Triggers when:**
- User asks "what products" or "what features"
- Response mentions 3+ different products
- Discussing Zap Bank overview

**Contains:**
- 5 swipeable cards showcasing top features
- Each card has image, title, subtitle, and description
- Auto-scrolls every 4 seconds

**Example triggers:**
- "Tell me about Zap Bank"
- "What products do you offer?"
- "What features are available?"

### Product Cards 💳

**Triggers when discussing specific products:**
- **Treasury account**: When mentioning 4.09% APY
- **Corporate Cards**: When discussing 2% cashback
- **Checking Account**: When discussing $0 fees

**Contains:**
- Product name and description
- Key benefit highlighted
- Product image
- Rating display
- Price information ($0 for accounts)

**Example triggers:**
- "Tell me about your Treasury account"
- "How do corporate cards work?"
- "I need a business checking account"

### CTA Buttons 🔘

**Triggers when:**
- User shows interest ("sounds good", "tell me more")
- User asks "how to get started" or "how to sign up"
- Response includes application language

**Contains:**
- 3 action buttons:
  - 🎯 **Apply Now** (primary) - Direct to application
  - 📚 **Learn More** (secondary) - Product details
  - 📅 **Schedule Demo** (outline) - Book a call

**Example triggers:**
- "How do I get started?"
- "Sounds good, what's next?"
- "I'm interested in applying"

## Proactive Recommendation Strategy

The agent doesn't just answer questions - it actively helps users find the right solutions:

### Qualifying Questions
- Asks about business size, needs, and pain points
- Learns about current banking setup
- Identifies opportunities to add value

### Product Matching
- **Cash management pain** → Treasury account
- **High fees** → Checking & Bill Pay
- **Team spend chaos** → Corporate Cards + Expense Management
- **Manual reconciliation** → Accounting Integrations
- **Fundraising** → SAFE Note Generator

### Quantified Benefits
- Shows real numbers: "$0 fees = save $500/month"
- Calculates returns: "4.09% on $100K = $4,090/year"
- Makes impact tangible and immediate

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Zap Bank Rep Agent
ZAPBANK_REP_AGENT_ID=your_zapbank_agent_id_here
ZAPBANK_REP_API_KEY=your_zapbank_api_key_here
ZAPBANK_REP_API_URL=https://api.a1zap.com/v1/messages/individual
```

### 2. Configure Webhook in A1Zap

1. Go to your A1Zap dashboard
2. Create or select the Zap Bank agent
3. Set webhook URL to: `https://your-domain.com/webhook/zapbank-rep`
4. Copy the Agent ID and API Key to your `.env` file

### 3. Start the Server

```bash
npm start
```

The agent will register automatically and be available at `/webhook/zapbank-rep`.

## Testing

Run the test script to verify everything works:

```bash
node tests/test-zapbank-rep.js
```

This will:
1. Send a welcome message (chat.started event)
2. Test basic conversation
3. Trigger product carousel
4. Trigger product card
5. Test various scenarios
6. Trigger CTA buttons

Expected outputs:
- Conversational responses with modern fintech tone
- Product carousel after asking about products
- Treasury product card when discussing Treasury
- CTA buttons when asking "how to get started"

## Example Conversations

### Example 1: High Fees Pain Point

**User**: "We're spending too much on banking fees"

**Agent**: "Oof, I feel that! 💸 Traditional banks really nickel and dime you.

With Zap Bank, you get:
• **$0 ACH fees** (unlimited transfers, zero cost)
• **$0 Bill Pay fees** (pay hundreds of vendors for free)
• Modern platform without the legacy bank bloat

Most startups save $500-1,000/month just on fees alone. What's your current setup like?"

### Example 2: Idle Cash

**User**: "We have about $200K sitting in our account"

**Agent**: "Whoa - that's a lot of cash earning 0%! 😱

Quick math: $200K at **4.09% APY** in our Treasury account = **$8,180/year** in interest. That's basically free money while your cash sits there.

It's FDIC insured, and you can access it whenever you need. Want to learn more about setting that up?"

*[Automatically sends Treasury product card with details]*

### Example 3: Getting Started

**User**: "How do I get started?"

**Agent**: "Super easy! 🚀

The whole process takes about 10 minutes:
1. Apply online (basic company info + ID verification)
2. Get approved (usually same day)
3. Start using your accounts immediately

You can literally apply right now. Want me to send you the signup link?"

*[Automatically sends CTA buttons: Apply Now, Learn More, Schedule Demo]*

## File Structure

```
agents/
  └── zapbank-rep-agent.js       # Agent configuration & personality

webhooks/
  └── zapbank-rep-webhook.js     # Webhook handler with rich content logic

tests/
  └── test-zapbank-rep.js        # Test script for verification

docs/
  └── ZAPBANK_REP_AGENT.md       # This documentation file
```

## Customization

### Changing Personality

Edit the system prompt in `agents/zapbank-rep-agent.js`:

```javascript
getSystemPrompt() {
  return `You are a Zap Bank Advisor...
  
  // Modify personality guidelines here
  Your Personality & Communication Style:
  - Modern fintech vibe (or change to formal, playful, etc.)
  - Startup-friendly language (or corporate, technical, etc.)
  ...
}
```

### Adding New Products

Update the product knowledge section in the system prompt and add new product card types in the webhook handler.

### Customizing Rich Content

Modify the rich content logic in `webhooks/zapbank-rep-webhook.js`:

- `shouldSendProductCarousel()` - Change carousel triggers
- `detectProductCardOpportunity()` - Add new product card types
- `shouldSendCTAButtons()` - Modify CTA triggers
- `sendProductCarousel()` - Update carousel items
- `sendProductCard()` - Add new product cards

## Architecture

The Zap Bank Rep agent follows the clean architecture pattern:

1. **BaseAgent** (core/BaseAgent.js)
   - Provides common agent functionality
   - Manages configuration and validation

2. **ZapBankRepAgent** (agents/zapbank-rep-agent.js)
   - Extends BaseAgent
   - Defines personality and system prompt
   - Contains product knowledge

3. **BaseWebhook** (core/BaseWebhook.js)
   - Handles webhook lifecycle
   - Manages conversation history
   - Handles errors and duplicate detection

4. **ZapBankRepWebhook** (webhooks/zapbank-rep-webhook.js)
   - Extends BaseWebhook
   - Implements agent-specific logic
   - Handles rich content delivery

5. **BaseA1ZapClient** (core/BaseA1ZapClient.js)
   - Unified messaging client
   - Handles API communication

## Troubleshooting

### Agent not responding

1. Check environment variables are set correctly
2. Verify webhook URL is configured in A1Zap
3. Check server logs for errors
4. Test with `node tests/test-zapbank-rep.js`

### Rich content not appearing

1. Ensure webhook is receiving responses
2. Check logs for rich content triggers
3. Verify A1Zap supports rich content for your agent
4. Test with specific trigger phrases

### Wrong personality/tone

1. Edit system prompt in `agents/zapbank-rep-agent.js`
2. Adjust temperature in generation options
3. Add more specific examples in system prompt

## Future Enhancements

Potential improvements:

- [ ] Add more product types (loans, credit lines, etc.)
- [ ] Implement form cards for lead capture
- [ ] Add quick reply buttons for common questions
- [ ] Create industry-specific product recommendations
- [ ] Add A/B testing for different personalities
- [ ] Implement conversation analytics
- [ ] Add multi-language support

## Support

For questions or issues:

1. Check the logs in the console
2. Run the test script for diagnostics
3. Review the system prompt for behavior tweaks
4. Consult the main README.md for general architecture

