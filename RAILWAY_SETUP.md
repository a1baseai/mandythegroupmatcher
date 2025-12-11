# Railway Deployment Guide for Mandy the Group Matchmaker

## 🚀 Quick Deployment Steps

### 1. Deploy on Railway

Your Railway URL: **mandythegroupmatcher-production.up.railway.app**

#### Option A: Deploy from GitHub (Recommended)

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `lukesonson808/mandythegroupmatcher`
5. Railway will auto-detect Node.js and deploy

#### Option B: Deploy with Railway CLI

```bash
railway login
railway link
railway up
```

### 2. Set Environment Variables

In Railway Dashboard → Your Project → **Variables** tab, add these:

```env
CLAUDE_API_KEY=your_claude_api_key_here
A1ZAP_API_KEY=your_a1zap_api_key_here
MANDY_AGENT_ID=your_mandy_agent_id_here
NODE_ENV=production
```

**Important:** Replace the placeholder values with your actual API keys!

### 3. Configure A1Zap Webhook

1. Go to your A1Zap dashboard
2. Navigate to your Mandy agent settings
3. Set the **Webhook URL** to:

```
https://mandythegroupmatcher-production.up.railway.app/webhook/mandy
```

### 4. Verify Deployment

Test the health endpoint:
```bash
curl https://mandythegroupmatcher-production.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "config": {
    "hasClaudeApiKey": true,
    "hasA1ZapApiKey": true
  }
}
```

### 5. Test Mandy Agent

Send a message to Mandy in A1Zap. You should see:
- Welcome message from Mandy
- Interview questions start
- Webhook logs in Railway

## 📋 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_API_KEY` | ✅ Yes | Your Claude API key from Anthropic |
| `A1ZAP_API_KEY` | ✅ Yes | Your A1Zap API key |
| `MANDY_AGENT_ID` | ✅ Yes | Mandy's Agent ID from A1Zap |
| `NODE_ENV` | Optional | Set to `production` for production |
| `PORT` | Auto-set | Railway automatically sets this (don't override) |

## 🔍 Monitoring & Debugging

### View Logs

1. Railway Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **"View Logs"**

### Common Issues

**Agent not responding:**
- ✅ Check environment variables are set correctly
- ✅ Verify webhook URL in A1Zap is correct
- ✅ Check Railway logs for errors
- ✅ Test health endpoint to confirm server is running

**Webhook not receiving requests:**
- ✅ Verify webhook URL in A1Zap: `https://mandythegroupmatcher-production.up.railway.app/webhook/mandy`
- ✅ Check Railway logs for incoming webhook requests
- ✅ Ensure Railway service is running (not paused)

**500 errors:**
- ✅ Check Claude API key is valid
- ✅ Check A1Zap API key is valid
- ✅ Check Mandy Agent ID is correct
- ✅ View Railway logs for detailed error messages

## 📁 Data Persistence

**Important:** Railway's file system is ephemeral (resets on redeploy).

- Group profiles are stored in `data/group-profiles.json`
- Interview states are stored in `data/interview-state.json`
- Matches are stored in `data/matches.json`

**For production, consider:**
- Using Railway **Volumes** for persistent storage
- Or migrating to a database (PostgreSQL, MongoDB, etc.)

To use Railway Volumes:
1. Railway Dashboard → Your Project → **Data** → **+ New** → **Volume**
2. Mount volume at `/app/data`
3. Update code to use mounted volume path

## 🔄 Updating Deployment

When you push to GitHub:
1. Railway will auto-deploy if connected to GitHub
2. Or manually deploy: Railway Dashboard → **Deployments** → **Redeploy**

## 🌐 Custom Domain (Optional)

1. Railway Dashboard → Your Project → **Settings** → **Networking**
2. Click **"Generate Domain"** or add custom domain
3. Update A1Zap webhook URL with new domain

## 📞 Support

- Check Railway logs for errors
- Test health endpoint first
- Verify all environment variables are set
- Ensure webhook URL is correct in A1Zap

---

**Your Railway URL:** `mandythegroupmatcher-production.up.railway.app`  
**Webhook Endpoint:** `https://mandythegroupmatcher-production.up.railway.app/webhook/mandy`

