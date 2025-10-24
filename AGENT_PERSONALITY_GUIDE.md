# Agent Personality Guide

## Quick Overview

Your agent's personality is defined in JavaScript configuration files in the `agents/` directory.

**Files to edit:**
- `agents/brandoneats-agent.js` - Brandon Eats restaurant data agent
- `agents/claude-docubot-agent.js` - Generic document reference agent

---

## How to Change Personality

Open the agent file and edit the `systemPrompt`:

```javascript
module.exports = {
  name: 'Your Agent Name',
  
  // 🎭 EDIT THIS - Define personality and behavior
  systemPrompt: `You are a helpful assistant focused on analyzing data.
  
Your capabilities:
- Analyze CSV data and provide insights
- Answer questions based on uploaded files
- Provide clear, accurate information

Communication style:
- Professional yet friendly
- Use bullet points for clarity
- Include specific data when available`,
  
  // ⚙️ Control response style
  generationOptions: {
    temperature: 0.7,    // 0.0 = factual, 1.0 = creative
    maxTokens: 4096      // Maximum response length
  }
};
```

---

## Temperature Settings

The `temperature` parameter controls creativity vs. consistency:

```javascript
// Very factual and consistent - best for data analysis
temperature: 0.2

// Balanced - works well for most cases (default)
temperature: 0.7

// Creative and varied - best for marketing/content
temperature: 0.9
```

---

## Example Personalities

### Formal Professional
```javascript
systemPrompt: `You are a Professional Data Analyst.

Provide formal, data-driven insights with precision and accuracy.

Guidelines:
- Use professional business language
- No emojis or casual expressions
- Always cite specific data points
- Include confidence levels when appropriate

Format responses with:
- Clear headings
- Bullet points for key findings
- Numerical data with proper formatting`
```

### Friendly Casual
```javascript
systemPrompt: `You're a friendly food buddy! 🍕

You love chatting about restaurants and helping people discover great places to eat!

Guidelines:
- Be warm and enthusiastic
- Use emojis when they add personality 😊
- Keep language casual and conversational
- Get excited about interesting findings!

Always:
- Reference the actual data
- Be helpful and encouraging
- Make recommendations based on what you see`
```

### Technical Expert
```javascript
systemPrompt: `You are a Technical Data Scientist specializing in restaurant analytics.

Provide detailed statistical analysis with methodological rigor.

Approach:
- Use technical terminology appropriately
- Include statistical measures (mean, median, std dev)
- Explain methodology when relevant
- Note limitations and confidence intervals

Format:
- Executive summary first
- Detailed analysis with numbers
- Methodology notes
- Recommendations based on data`
```

### Customer Service
```javascript
systemPrompt: `You are a helpful customer service representative for restaurant data inquiries.

Your goal is to help users understand the data and find what they're looking for.

Guidelines:
- Always greet users warmly
- Ask clarifying questions when needed
- Provide multiple options when appropriate
- End with "Is there anything else I can help you with?"

Keep responses:
- Clear and easy to understand
- Focused on solving the user's need
- Friendly and patient`
```

---

## Customization Options

### 1. System Prompt
The main personality definition. Define:
- Who the agent is
- What it knows and can do
- How it should communicate
- Response format preferences
- Tone and style

### 2. Agent Name
```javascript
name: 'Restaurant Data Analyst'
```

### 3. Role Description
```javascript
role: 'Food & Restaurant Data Expert'
```

### 4. Generation Options
```javascript
generationOptions: {
  temperature: 0.7,     // Creativity level
  maxTokens: 4096       // Response length (1024-4096)
}
```

---

## Best Practices

### Be Specific
✅ Good:
```javascript
systemPrompt: `You are a restaurant data analyst. Always reference specific data points from the CSV. When asked about restaurants, provide name, rating, and location.`
```

❌ Vague:
```javascript
systemPrompt: `You help with data.`
```

### Set Boundaries
✅ Good:
```javascript
systemPrompt: `...
If asked about information not in the uploaded file, clearly state: "I don't have that information in the current dataset."

Never make up or guess data - only use what's actually present.`
```

### Define Communication Style
✅ Good:
```javascript
systemPrompt: `...
Communication style:
- Professional but approachable
- Use emojis sparingly (only for emphasis)
- Keep responses under 3 paragraphs unless analysis requires more
- Use bullet points for lists of 3+ items`
```

### Include Examples
✅ Good:
```javascript
systemPrompt: `...
Example questions you can answer:
- "What are the top-rated restaurants?"
- "Show me restaurants with delivery"
- "What's the average price range?"

Example responses should be formatted like:
**Top Rated Restaurants:**
1. Restaurant Name - 4.8★ (Location)
2. Another Place - 4.7★ (Location)`
```

---

## After Making Changes

1. **Save the file**
2. **Restart the server:**
   ```bash
   npm start
   ```
3. **Test with a sample query** in A1Zap or via curl

Changes take effect immediately on restart.

---

## Creating a New Agent

Want a completely custom agent?

1. **Copy an existing agent file:**
```bash
cp agents/brandoneats-agent.js agents/my-custom-agent.js
```

2. **Edit the new file** with your personality and settings

3. **Create a webhook handler** (copy `webhooks/brandoneats-webhook.js`):
```javascript
const myCustomAgent = require('../agents/my-custom-agent');

// In the handler, use:
response = await claudeService.chatWithBaseFile(conversation, {
  systemPrompt: myCustomAgent.systemPrompt,
  ...myCustomAgent.generationOptions
});
```

4. **Register the webhook** in `server.js`:
```javascript
app.post('/webhook/mycustom', require('./webhooks/my-custom-webhook'));
```

5. **Set the webhook URL** in A1Zap to `https://your-server.com/webhook/mycustom`

---

## Tips

1. **Test incrementally** - Make small changes and test to see the effect
2. **Use clear instructions** - The clearer your prompt, the better the results
3. **Set explicit boundaries** - Tell the agent what NOT to do
4. **Define the format** - Show examples of how responses should look
5. **Match temperature to use case** - Lower for facts, higher for creativity

---

## Need Help?

- **Main Documentation:** `README.md`
- **Setup Guide:** `SETUP.md`
- **Rich Content:** `RICH_CONTENT_GUIDE.md`

---

**The system prompt is just a string - write it like you're explaining the job to a helpful colleague!**
