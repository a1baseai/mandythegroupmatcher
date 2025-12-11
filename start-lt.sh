#!/bin/bash
# Start localtunnel for A1Zap webhooks

echo "🌐 Starting localtunnel for localhost:3000..."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "⚠️  Warning: Server doesn't seem to be running on port 3000"
  echo "   Make sure to run 'npm start' in another terminal first!"
  echo ""
  exit 1
fi

echo "📋 Tunnel starting... The HTTPS URL will appear below:"
echo "   Look for a line like: your url is: https://xxxx.loca.lt"
echo ""
echo "📌 Once you see the URL, update your A1Zap webhook to:"
echo "   https://YOUR-SUBDOMAIN.loca.lt/webhook/mandy"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try with a custom subdomain first (optional - you can change this)
# If it fails, it will try without a subdomain
SUBDOMAIN="${1:-mandy-agent}"

if [ "$SUBDOMAIN" != "" ]; then
  echo "Trying with subdomain: $SUBDOMAIN"
  npx localtunnel --port 3000 --subdomain "$SUBDOMAIN" 2>&1 || {
    echo ""
    echo "⚠️  Subdomain taken or unavailable, trying without subdomain..."
    echo ""
    npx localtunnel --port 3000 2>&1
  }
else
  npx localtunnel --port 3000 2>&1
fi

