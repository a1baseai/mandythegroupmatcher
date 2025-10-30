# Zap Bank Agent - Environment Setup

## Quick Setup Guide

Add these environment variables to your `.env` file to enable the Zap Bank Representative Agent.

## Required Environment Variables

```bash
# ============================================
# Zap Bank Representative Agent
# ============================================

# Agent ID from A1Zap Dashboard
ZAPBANK_REP_AGENT_ID=your_zapbank_agent_id_here

# API Key for Zap Bank agent
ZAPBANK_REP_API_KEY=your_zapbank_api_key_here

# API URL (default is fine for most cases)
ZAPBANK_REP_API_URL=https://api.a1zap.com/v1/messages/individual
```

## How to Get Your Credentials

### Step 1: Create Agent in A1Zap

1. Go to [A1Zap Dashboard](https://a1zap.com/dashboard)
2. Click **"Create New Agent"**
3. Enter agent details:
   - **Name**: Zap Bank Advisor
   - **Description**: Modern fintech banking sales representative
   - **Type**: Individual Agent

### Step 2: Configure Webhook

1. In your agent settings, find **"Webhook Configuration"**
2. Set webhook URL to: `https://your-domain.com/webhook/zapbank-rep`
   - For local testing: `https://your-ngrok-url.ngrok.io/webhook/zapbank-rep`
3. Copy the **Agent ID** and **API Key** shown

### Step 3: Add to .env File

Paste the credentials into your `.env` file:

```bash
ZAPBANK_REP_AGENT_ID=kg7abc123def456ghi789  # Replace with your actual ID
ZAPBANK_REP_API_KEY=sk_live_abc123xyz789    # Replace with your actual key
```

### Step 4: Restart Server

```bash
npm start
```

You should see:
```
✅ Registered agent: zapbank-rep (Zap Bank Advisor)
```

## Testing Your Setup

### Quick Test

```bash
node tests/test-zapbank-rep.js
```

### Manual Test

Send a POST request to your webhook:

```bash
curl -X POST http://localhost:3000/webhook/zapbank-rep \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "chat": {
      "id": "test-chat-123",
      "type": "individual"
    },
    "message": {
      "id": "msg-123",
      "content": "Tell me about Zap Bank",
      "sender": {
        "id": "user-123",
        "name": "Test User"
      }
    }
  }'
```

Expected response:
- Status 200
- JSON response with agent's greeting and Zap Bank overview

## Troubleshooting

### "Agent not configured" error

**Problem**: Missing or invalid credentials in `.env`

**Solution**: 
1. Check that `ZAPBANK_REP_AGENT_ID` and `ZAPBANK_REP_API_KEY` are set
2. Verify no typos or extra spaces
3. Restart the server after adding variables

### Webhook not receiving messages

**Problem**: A1Zap can't reach your webhook URL

**Solution**:
1. For local development, use ngrok: `ngrok http 3000`
2. Update webhook URL in A1Zap dashboard with ngrok URL
3. Ensure server is running before sending messages

### "Configuration Errors" on startup

**Problem**: Placeholder values still in use

**Solution**:
```bash
# ❌ Wrong (placeholder)
ZAPBANK_REP_AGENT_ID=your_zapbank_agent_id_here

# ✅ Correct (actual ID)
ZAPBANK_REP_AGENT_ID=kg7abc123def456ghi789
```

## Complete .env Example

Here's a complete example with all agents:

```bash
# AI Service APIs
CLAUDE_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSy...

# Base A1Zap (legacy - optional)
A1ZAP_API_KEY=sk_live_...
A1ZAP_AGENT_ID=kg7...

# Claude Docubot Agent
CLAUDE_DOCUBOT_AGENT_ID=kg7abc...
CLAUDE_DOCUBOT_API_KEY=sk_live_abc...

# Brandon Eats Agent
BRANDONEATS_AGENT_ID=kg7def...
BRANDONEATS_API_KEY=sk_live_def...

# Makeup Artist Agent
MAKEUP_ARTIST_AGENT_ID=kg7ghi...
MAKEUP_ARTIST_API_KEY=sk_live_ghi...

# YC Photographer Agent
YC_PHOTOGRAPHER_AGENT_ID=kg7jkl...
YC_PHOTOGRAPHER_API_KEY=sk_live_jkl...

# Zap Bank Rep Agent (NEW!)
ZAPBANK_REP_AGENT_ID=kg7mno...
ZAPBANK_REP_API_KEY=sk_live_mno...

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000
```

## Next Steps

After setup is complete:

1. ✅ **Test the agent**: `node tests/test-zapbank-rep.js`
2. 📖 **Read full docs**: `docs/ZAPBANK_REP_AGENT.md`
3. 🎨 **Customize personality**: Edit `agents/zapbank-rep-agent.js`
4. 🚀 **Deploy**: Push to production when ready

## Security Notes

⚠️ **Never commit your `.env` file to git!**

- Add `.env` to `.gitignore` (should already be there)
- Use environment variables in production (Railway, Heroku, etc.)
- Rotate API keys if accidentally exposed
- Use separate keys for dev/staging/prod environments

## Support

Need help? Check:
- Full documentation: `docs/ZAPBANK_REP_AGENT.md`
- Test script: `tests/test-zapbank-rep.js`
- Main README: `README.md`
- Server logs for detailed error messages

