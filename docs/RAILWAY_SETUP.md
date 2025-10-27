# Railway Deployment Setup Guide

This guide covers the Railway configuration needed to deploy this application successfully.

## Quick Start

Your application is configured to work with Railway out of the box. Just ensure these settings are correct in your Railway dashboard.

## Railway Settings Configuration

### Source

- **Source Repo**: Your GitHub repository (e.g., `a1baseai/brandon-test`)
- **Root Directory**: Leave empty (uses repository root)
- **Branch**: `main` (or your preferred production branch)
- **Wait for CI**: Optional - enable if you have GitHub Actions

### Networking

#### Public Networking

Your app needs to be accessible over HTTP. Configure as follows:

- **Port**: `3000`
- **Target Port**: `3000`
- **Domain**: `<your-project>-production.up.railway.app` (auto-generated)

> **Important**: The port must match what your application listens on. This app uses `process.env.PORT || 3000`.

#### Private Networking

- **DNS**: `<service-name>.railway.internal`
- Use this for internal service-to-service communication within Railway

### Build

- **Builder**: Railpack (default)
- **Custom Build Command**: Leave empty (uses `npm install` automatically)
- **Watch Paths**: Optional - add patterns to trigger deployments based on file changes

### Deploy

#### Start Command
- **Custom Start Command**: Leave empty (uses `npm start` from `package.json`)

#### Healthcheck
- **Healthcheck Path**: `/health` (recommended)
  - This endpoint returns service status and API configuration

#### Restart Policy
- **Policy**: On Failure (restart on non-zero exit code)
- **Max Restart Retries**: `10`

#### Regions
- **US West (California, USA)**: 1 replica (or your preferred region)

#### Resource Limits
Configure based on your needs:
- **CPU**: Start with 1-2 vCPU
- **Memory**: Start with 512MB-1GB
- Scale up if needed based on usage

### Environment Variables

Required environment variables (set in Railway Variables tab):

```bash
# AI Service API Keys
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# A1Zap API Configuration (General)
A1ZAP_API_KEY=your_a1zap_api_key_here
A1ZAP_AGENT_ID=your_agent_id_here

# Brandon Eats Specific Configuration
BRANDONEATS_API_KEY=your_brandoneats_api_key
BRANDONEATS_AGENT_ID=your_brandoneats_agent_id
BRANDONEATS_API_URL=https://api.a1zap.com/v1/messages/individual

# Server Configuration (optional - Railway sets PORT automatically)
PORT=3000
BASE_URL=https://your-app.railway.app
```

> **Note**: Railway automatically sets the `RAILWAY_ENVIRONMENT` variable, which the app uses to detect it's running on Railway and bind to `0.0.0.0`.

## Application Endpoints

Once deployed, your application exposes these endpoints:

### Webhooks
- `POST /webhook/claude` - Claude DocuBot (generic file reference agent)
- `POST /webhook/brandoneats` - Brandon Eats data analyst (specialized)

### Health & Status
- `GET /` - Service information and available endpoints
- `GET /health` - Health check with API configuration status

### File Management
- `GET /files/base` - Get base files for all agents
- `GET /files/base/:agent` - Get base file for specific agent (`:agent` = `brandoneats` or `claude-docubot`)
- `GET /files/list` - List all uploaded files

## Common Issues & Solutions

### Issue: Container keeps restarting (SIGTERM loop)

**Symptoms**: Logs show app starting, then immediately "Stopping Container" with SIGTERM

**Causes**:
1. App binding to `localhost` instead of `0.0.0.0`
2. Port mismatch between app and Railway settings

**Solutions**:
1. ✅ App automatically binds to `0.0.0.0` when `RAILWAY_ENVIRONMENT` is detected
2. Ensure Railway "Target Port" matches your app's port (3000)

### Issue: App not accessible via domain

**Symptoms**: Deployment succeeds but domain returns 503 or connection errors

**Solutions**:
1. Check that your app binds to `0.0.0.0` (not `localhost`)
2. Verify Railway "Target Port" is set correctly
3. Check healthcheck endpoint is responding

### Issue: Environment variables not loading

**Symptoms**: Config shows "❌ Not configured" in startup logs

**Solutions**:
1. Go to Railway Variables tab
2. Add all required environment variables
3. Redeploy after adding variables

## Deployment Process

Railway automatically deploys when you push to the connected branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Railway will:
1. Detect the push
2. Pull the latest code
3. Run `npm install`
4. Start the app with `npm start`
5. Perform health check
6. Route traffic to the new deployment

## Monitoring

### Logs
Access logs in Railway dashboard under **Observability → Logs**

Look for these startup messages:
```
🚀 File-Based AI Agent running on http://0.0.0.0:3000
Configuration:
  Gemini API: ✅ Configured
  Claude API: ✅ Configured
  A1Zap API: ✅ Configured
```

### Metrics
Monitor CPU, Memory, and Network usage in **Metrics** tab

### Health Check
Test your deployment:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T02:00:00.000Z",
  "config": {
    "hasGeminiApiKey": true,
    "hasClaudeApiKey": true,
    "hasA1ZapApiKey": true
  }
}
```

## Scaling

To scale your application:

1. **Vertical Scaling**: Increase CPU/Memory in Deploy settings
2. **Horizontal Scaling**: Add more replicas in Regions section
3. **Multi-Region**: Deploy to additional regions for lower latency

## Support

For Railway-specific issues, refer to:
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)

For application issues, check the logs and ensure all environment variables are configured correctly.

