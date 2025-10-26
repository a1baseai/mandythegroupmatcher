// Load environment variables
require('dotenv').config();

module.exports = {
  // Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'your_gemini_api_key_here',
    defaultModel: 'gemini-2.5-flash',
    temperature: 0.7,
    maxOutputTokens: 65565
  },

  // A1Zap API Configuration (General)
  a1zap: {
    apiKey: process.env.A1ZAP_API_KEY || 'your_a1zap_api_key_here',
    agentId: process.env.A1ZAP_AGENT_ID || 'your_agent_id_here',
    apiUrl: 'https://api.a1zap.com/v1/messages/individual'
  },

  // Brandon Eats Specific A1Zap Configuration
  brandonEats: {
    apiKey: process.env.BRANDONEATS_API_KEY || 'oWcnoLaWyz6Essuc3doElcHCSSfgsJ',
    agentId: process.env.BRANDONEATS_AGENT_ID || 'j972wdq9j43c6wda1gga784gxn7qwpzs',
    apiUrl: process.env.BRANDONEATS_API_URL || 'https://api.a1zap.com/v1/messages/individual'
  },

  // Makeup Artist Specific A1Zap Configuration
  makeupArtist: {
    apiKey: process.env.MAKEUP_ARTIST_API_KEY || process.env.A1ZAP_API_KEY || 'your_makeup_artist_api_key_here',
    agentId: process.env.MAKEUP_ARTIST_AGENT_ID || 'j974khr39n4esba376mjawp2jh7t69f3',
    apiUrl: process.env.MAKEUP_ARTIST_API_URL || 'https://api.a1zap.com/v1/messages/individual'
  },

  // Claude AI Configuration
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || 'your_claude_api_key_here',
    defaultModel: 'claude-sonnet-4-5',
    maxTokens: 8192,
    temperature: 0.7,
    // Files API beta header (required for file_id references)
    betaHeaders: ['files-api-2025-04-14']
  },

  // File Registry Configuration
  files: {
    registryPath: './files-registry.json'
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  }
};
