# GitHub Setup Instructions

## Current Status

✅ Git repository is initialized  
✅ Remote is configured: `origin` → `https://github.com/a1baseai/a1zap-image-multiturn-agent.git`  
✅ Changes are committed  
✅ Ready to push!

## Push to GitHub

```bash
git push origin main
```

If you get an authentication error, you may need to:
- Use a personal access token instead of password
- Or configure SSH keys

## After Pushing

### Share with Your Team

1. Give team members access to the GitHub repository
2. They can clone it:
   ```bash
   git clone https://github.com/a1baseai/a1zap-image-multiturn-agent.git
   cd a1zap-image-multiturn-agent
   npm install
   ```

### Deploy to Railway

See `RAILWAY_DEPLOYMENT.md` for complete deployment instructions.

Quick steps:
1. Connect Railway to your GitHub repo
2. Add environment variables in Railway dashboard
3. Update A1Zap webhook URL with Railway domain

## Environment Variables Needed

Make sure your team knows to set these in Railway:

```env
CLAUDE_API_KEY=your_claude_api_key
A1ZAP_API_KEY=your_a1zap_api_key
MANDY_AGENT_ID=your_mandy_agent_id
```

**Never commit `.env` file!** It's already in `.gitignore`.

## Repository Structure

```
├── agents/
│   └── mandy-agent.js          # Mandy's personality
├── core/                        # Base classes
├── services/                    # Business logic
├── webhooks/
│   └── mandy-webhook.js        # Main webhook handler
├── data/                        # User data (gitignored)
├── server.js                    # Express server
├── README.md                    # Complete documentation
├── RAILWAY_DEPLOYMENT.md        # Deployment guide
└── .env                         # Local only (gitignored)
```

## Next Steps

1. **Push to GitHub**: `git push origin main`
2. **Share repository** with your team
3. **Deploy to Railway** (see RAILWAY_DEPLOYMENT.md)
4. **Set webhook URL** in A1Zap to Railway domain

