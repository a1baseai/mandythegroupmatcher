# Setup Guide

## Prerequisites

You'll need:
1. **Claude API Key** - Get from [console.anthropic.com](https://console.anthropic.com/)
2. **A1Zap Credentials** - Get from A1Zap app → Make → Agent API
3. **Gemini API Key** (Optional) - Get from [aistudio.google.com](https://aistudio.google.com/apikey)

---

## Step 1: Get Claude API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys → Create Key
4. Copy your key (starts with `sk-ant-`)

---

## Step 2: Get A1Zap Credentials

1. Open A1Zap app
2. Go to **Make** → **Agent API**
3. Create a new agent or select existing
4. Copy both:
   - **API Key**
   - **Agent ID**

---

## Step 3: Configure Environment

### Option A: Replit (Recommended for hosting)

1. Import project to Replit
2. Click 🔒 **Secrets** in sidebar
3. Add these secrets:

```
CLAUDE_API_KEY=sk-ant-your-key-here
A1ZAP_API_KEY=your-a1zap-key
A1ZAP_AGENT_ID=your-agent-id
BASE_URL=https://your-repl-name.repl.co
```

4. Click **Run**

### Option B: Local Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in project root:
```bash
CLAUDE_API_KEY=sk-ant-your-key-here
A1ZAP_API_KEY=your-a1zap-key
A1ZAP_AGENT_ID=your-agent-id
BASE_URL=http://localhost:3000
PORT=3000
```

4. Start the server:
```bash
npm start
```

---

## Step 4: Upload a File

Your agent needs a file to reference. Upload one:

```bash
# Upload your own file
npm run upload /path/to/your/file.csv

# Or use the included sample
npm run upload files/brandoneats.csv
```

You should see:
```
✅ File uploaded successfully!
📄 File ID: file_abc123xyz
📊 Filename: brandoneats.csv
✓ Set as base file
```

---

## Step 5: Configure A1Zap Webhook

1. Open A1Zap app
2. Go to your agent settings
3. Find **Webhook URL** field
4. Enter your webhook URL:

**For generic file operations:**
```
https://your-server.com/webhook/claude
```

**For Brandon Eats data analysis:**
```
https://your-server.com/webhook/brandoneats
```

5. Save the settings

---

## Step 6: Test Your Agent

### Test in A1Zap
1. Open a chat with your agent
2. Send a message asking about the uploaded file
3. Agent should respond with information from the file!

### Test Locally
```bash
curl -X POST http://localhost:3000/webhook/claude \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"id": "test-123"},
    "message": {"content": "What data do you have?"},
    "agent": {"id": "agent-123"}
  }'
```

---

## Verify Setup

Check all configurations:
```bash
npm run check
```

Expected output:
```
=== Configuration Status ===
✅ Claude API: Configured
✅ A1Zap API: Configured
✅ A1Zap Agent: Configured
✅ Base File: brandoneats.csv (file_abc123)
✅ Server URL: https://your-server.com
```

---

## Common Issues

### "Claude API key not configured"
**Solution:** Set `CLAUDE_API_KEY` in environment variables or `.env` file

### "No base file set"
**Solution:** Upload a file with `npm run upload /path/to/file.csv`

### "Webhook not responding"
**Solution:** 
- Check server is running: `npm start`
- Verify webhook URL in A1Zap matches your server URL
- Check server logs for errors

### "Agent doesn't use file context"
**Solution:**
- Verify base file is set: `curl http://localhost:3000/files/base`
- Make sure you're using the correct webhook endpoint (`/webhook/claude` or `/webhook/brandoneats`)

---

## Next Steps

✅ Setup complete! Now you can:

1. **Customize Personality** - Edit `agents/brandoneats-agent.js` or `agents/claude-docubot-agent.js`
2. **Upload More Files** - Use `npm run upload` to add documents
3. **Use Rich Content** - See `RICH_CONTENT_GUIDE.md` for social embeds
4. **Deploy to Production** - Use Replit, Heroku, or your preferred host

---

## Architecture Overview

```
User Message (A1Zap)
    ↓
Webhook Handler (your server)
    ↓
Load Agent Config (personality, settings)
    ↓
Fetch Conversation History
    ↓
Claude API (with uploaded file)
    ↓
Generate Response
    ↓
Send Response (A1Zap)
```

**The file is attached to your server's webhook endpoint, not to individual A1Zap agents. Any agent using your webhook will have access to the uploaded file.**

---

Need help? Check the main `README.md` or see other guides in the docs folder.

