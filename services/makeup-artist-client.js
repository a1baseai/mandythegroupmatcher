const axios = require('axios');
const config = require('../config');

class MakeupArtistClient {
  constructor() {
    this.apiKey = config.makeupArtist.apiKey;
    this.agentId = config.makeupArtist.agentId;
    this.apiUrl = config.makeupArtist.apiUrl;
  }

  /**
   * Send a text message to A1Zap
   * @param {string} chatId - Chat ID to send message to
   * @param {string} content - Message content
   * @returns {Promise<Object>} API response
   */
  async sendMessage(chatId, content) {
    try {
      if (!this.apiKey || this.apiKey === 'your_makeup_artist_api_key_here') {
        throw new Error('Makeup Artist API key is not configured! Set MAKEUP_ARTIST_API_KEY environment variable.');
      }

      const url = `${this.apiUrl}/${this.agentId}/send`;

      const response = await axios.post(
        url,
        {
          chatId,
          content,
          metadata: {
            source: 'makeup-artist-agent'
          }
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Message sent to A1Zap:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message to A1Zap:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a message with media (image) to A1Zap
   * @param {string} chatId - Chat ID to send message to
   * @param {string} content - Message content
   * @param {string} mediaUrl - URL of the media to send
   * @param {Object} options - Optional parameters
   * @param {number} options.width - Image width in pixels
   * @param {number} options.height - Image height in pixels
   * @param {string} options.contentType - MIME type (default: 'image/png')
   * @returns {Promise<Object>} API response
   */
  async sendMediaMessage(chatId, content, mediaUrl, options = {}) {
    try {
      if (!this.apiKey || this.apiKey === 'your_makeup_artist_api_key_here') {
        throw new Error('Makeup Artist API key is not configured! Set MAKEUP_ARTIST_API_KEY environment variable.');
      }

      const url = `${this.apiUrl}/${this.agentId}/send`;

      console.log('📤 A1Zap API Request Details:');
      console.log(`   URL: ${url}`);
      console.log(`   Chat ID: ${chatId}`);
      console.log(`   Media URL: ${mediaUrl}`);
      console.log(`   Content length: ${content.length} chars`);

      // Build media object according to A1Zap API spec
      const media = {
        url: mediaUrl,
        contentType: options.contentType || 'image/png'
      };

      // Add dimensions if provided (recommended by A1Zap for proper image display)
      if (options.width && options.height) {
        media.width = options.width;
        media.height = options.height;
        console.log(`   Dimensions: ${media.width}x${media.height}`);
      }

      const payload = {
        chatId,
        content,
        media,
        metadata: {
          source: 'makeup-artist-agent',
          messageType: 'image'
        }
      };

      console.log('   Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(url, payload, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Media message sent to A1Zap:', response.data);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending media message to A1Zap:');
      console.error('   Status:', error.response?.status);
      console.error('   Status Text:', error.response?.statusText);
      console.error('   Error Data:', error.response?.data);
      console.error('   Error Message:', error.message);
      if (error.response?.data) {
        console.error('   Full Response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get message history for a chat
   * @param {string} chatId - Chat ID
   * @param {number} limit - Number of messages to retrieve (default: 20)
   * @param {string} agentId - Agent ID (accepted for compatibility but always uses configured agentId)
   * @returns {Promise<Array>} Array of messages
   */
  async getMessageHistory(chatId, limit = 20, agentId = null) {
    // Build URL outside try block so it's accessible in catch
    const url = `${this.apiUrl}/${this.agentId}/chat/${chatId}?limit=${limit}`;
    
    try {
      // Always use this client's configured agentId for consistency and security
      // The agentId parameter is accepted for API compatibility but ignored
      
      console.log('📡 Fetching Makeup Artist message history:');
      console.log(`   URL: ${url}`);
      console.log(`   Using configured agent ID: ${this.agentId}`);
      if (agentId && agentId !== this.agentId) {
        console.log(`   ⚠️  Webhook provided different agentId (${agentId}) - using configured one instead`);
      }
      console.log(`   API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET!'}`);
      
      if (!this.apiKey || this.apiKey === 'your_makeup_artist_api_key_here') {
        throw new Error('Makeup Artist API key is not configured! Set MAKEUP_ARTIST_API_KEY environment variable.');
      }

      const response = await axios.get(url, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      console.log(`✅ Message history retrieved: ${response.data.messages?.length || 0} messages`);
      return response.data.messages || [];
    } catch (error) {
      console.error('❌ Error fetching Makeup Artist message history:');
      console.error('   URL:', url);
      console.error('   Status:', error.response?.status);
      console.error('   Status Text:', error.response?.statusText);
      console.error('   Response Data:', error.response?.data);
      console.error('   Error Message:', error.message);
      return [];
    }
  }
}

module.exports = new MakeupArtistClient();

