# Railway Deployment Guide for Mandy the Group Matchmaker

## Quick Deploy to Railway

### 1. Push to GitHub

```bash
git add .
git commit -m "Cleanup: Mandy-only codebase"
git push origin main
```

### 2. Deploy on Railway

1. Go to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `a1baseai/a1zap-image-multiturn-agent`
5. Railway will auto-detect it's a Node.js app

### 3. Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
CLAUDE_API_KEY=your_claude_api_key_here
A1ZAP_API_KEY=your_a1zap_api_key_here
MANDY_AGENT_ID=your_mandy_agent_id_here
NODE_ENV=production
PORT=3000
```

### 4. Configure Webhook in A1Zap

Once Railway deploys, you'll get a public URL like:
```
https://your-app-name.up.railway.app
```

Update your A1Zap webhook URL to:
```
https://your-app-name.up.railway.app/webhook/mandy
```

### 5. Verify Deployment

Check health endpoint:
```bash
curl https://your-app-name.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "config": {
    "hasClaudeApiKey": true,
    "hasA1ZapApiKey": true
  }
}
```

## Important Notes

### Data Persistence

- Group profiles and matches are stored in `data/` directory
- Railway's file system is **ephemeral** (resets on redeploy)
- For production, consider:
  - Using Railway's **Volume** feature for persistent storage
  - Or migrating to a database (PostgreSQL, MongoDB, etc.)

### Environment Variables

Never commit `.env` file to GitHub! Railway uses environment variables from the dashboard.

### Custom Domain (Optional)

1. In Railway, go to **Settings** → **Networking**
2. Click **"Generate Domain"** or add custom domain
3. Update A1Zap webhook URL with new domain

## Troubleshooting

### Webhook Not Working

1. Check Railway logs: **Deployments** → Click deployment → **View Logs**
2. Verify webhook URL is correct in A1Zap
3. Test health endpoint is accessible
4. Check environment variables are set correctly

### Server Won't Start

1. Check Railway logs for errors
2. Verify all required environment variables are set
3. Check port binding (Railway sets `PORT` automatically)

### Data Lost on Redeploy

Use Railway Volumes or migrate to a database for persistent storage.

