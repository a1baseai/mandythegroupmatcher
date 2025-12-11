/**
 * Mandy the Group Matchmaker Server
 * 
 * Server for Mandy the Group Matchmaker agent only.
 */

// Load configuration
const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');

// Core architecture
const AgentRegistry = require('./core/AgentRegistry');

// Mandy agent and webhook
const mandyAgent = require('./agents/mandy-agent');
const mandyWebhookHandler = require('./webhooks/mandy-webhook');

// Initialize agent registry
const agentRegistry = new AgentRegistry();
agentRegistry.register('mandy', mandyAgent, mandyWebhookHandler);

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      hasClaudeApiKey: !!config.claude.apiKey && !config.claude.apiKey.includes('your_'),
      hasA1ZapApiKey: !!config.a1zap.apiKey && !config.a1zap.apiKey.includes('your_')
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Mandy the Group Matchmaker',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      mandy: 'POST /webhook/mandy'
    }
  });
});

// Mandy the Group Matchmaker webhook endpoint
app.post('/webhook/mandy', mandyWebhookHandler);

// Start server
const PORT = config.server.port || 3000;
const HOST = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Mandy the Group Matchmaker running on http://${HOST}:${PORT}`);
  console.log(`   Version: 1.0.0`);
  
  // Print agent registry summary
  agentRegistry.printSummary();
  
  console.log(`\nWebhook Endpoints:`);
  console.log(`  POST /webhook/mandy               - Mandy the Group Matchmaker`);
  console.log(`  GET  /health                      - Health check`);
  console.log(`\nConfiguration:`);
  console.log(`  Claude API: ${config.claude.apiKey && !config.claude.apiKey.includes('your_') ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  A1Zap API: ${config.a1zap.apiKey && !config.a1zap.apiKey.includes('your_') ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Mandy Agent ID: ${config.agents.mandy && config.agents.mandy.agentId ? '✅ Configured' : '❌ Not configured'}\n`);
});

// Error handling
server.on('error', (error) => {
  console.error(`❌ Server error:`, error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📴 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📴 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
