/**
 * Activity Planning Service
 * Helps groups find local activities like restaurants, mini golf, escape rooms, etc.
 * 
 * NOTE: For production, consider integrating:
 * - Google Places API (https://developers.google.com/maps/documentation/places/web-service)
 * - Yelp Fusion API (https://www.yelp.com/developers/documentation/v3)
 * - Foursquare Places API (https://developer.foursquare.com/docs/places-api)
 * 
 * These APIs provide real-time data, ratings, reviews, and accurate locations.
 */

const axios = require('axios');

class ActivityPlanningService {
  constructor() {
    // You can add API keys here for services like Google Places, Yelp, etc.
    // For now, we'll use web search for real results
  }

  /**
   * Extract location from user message or conversation
   * @param {string} userMessage - User's message
   * @param {string} storedLocation - Previously stored location (if any)
   * @returns {string} Extracted location or empty string
   */
  extractLocation(userMessage, storedLocation = '') {
    // If we have a stored location, use it
    if (storedLocation) {
      return storedLocation;
    }

    // Try to extract location from message with better patterns
    const locationPatterns = [
      // "in Boston", "near Harvard Square", "at MIT", "around Cambridge"
      /(?:in|near|at|around|close to|by)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?|for|to)/,
      // "we're in Boston", "located in Cambridge"
      /(?:we're|we are|we're in|located in|based in|live in|staying in)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/,
      // City names at the end: "restaurant in Boston"
      /(?:in|near)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*?)(?:\s*$|,|\.|!|\?)/,
      // ZIP codes
      /\b(\d{5}(?:-\d{4})?)\b/
    ];

    for (const pattern of locationPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        let location = match[1].trim();
        
        // Filter out common false positives (cuisine types, common words)
        const falsePositives = [
          'Italian', 'Mexican', 'Chinese', 'Thai', 'Sushi', 'Pizza', 
          'Japanese', 'Indian', 'French', 'American', 'Restaurant',
          'Food', 'Place', 'Spot', 'Here', 'There', 'Where'
        ];
        
        if (!falsePositives.some(fp => location.toLowerCase().includes(fp.toLowerCase()))) {
          // Clean up location (remove trailing words like "for", "to", etc.)
          location = location.replace(/\s+(for|to|that|which|restaurant|food|place|spot)\s*$/i, '').trim();
          
          // Only return if it looks like a real location (has capital letter, not too short)
          if (location.length >= 2 && /[A-Z]/.test(location)) {
            return location;
          }
        }
      }
    }

    return '';
  }

  /**
   * Search for local activities using web search
   * @param {string} query - What they're looking for (e.g., "italian restaurant", "mini golf", "escape room")
   * @param {string} location - Location (city, area, etc.) - optional
   * @param {Function} webSearchFn - Web search function (injected for testing)
   * @returns {Promise<Object>} Activity recommendations with real results
   */
  async searchActivities(query, location = '', webSearchFn = null) {
    try {
      // Build search query with location
      const searchQuery = location 
        ? `best ${query} near ${location}`
        : `best ${query}`;

      console.log(`🔍 [ActivityPlanning] Searching for: "${searchQuery}"`);

      // Use web search to get real results
      let searchResults = null;
      if (webSearchFn) {
        // Use provided search function (for testing or if web_search tool is available)
        searchResults = await webSearchFn(searchQuery);
      }

      // Parse search results to extract restaurant/activity names and info
      const recommendations = this.parseSearchResults(searchResults, query, location);

      // Build Google Maps search URL
      const mapsQuery = location 
        ? `${query} near ${location}`
        : query;
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;

      // Build Yelp search URL (if it's a restaurant)
      let yelpUrl = '';
      const isRestaurant = query.toLowerCase().includes('restaurant') || 
                          query.toLowerCase().includes('food') ||
                          query.toLowerCase().includes('dinner') ||
                          query.toLowerCase().includes('lunch') ||
                          query.toLowerCase().includes('eat');
      
      if (isRestaurant && location) {
        yelpUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(location)}`;
      }

      return {
        success: true,
        query: searchQuery,
        location: location || 'your area',
        recommendations: recommendations,
        mapsUrl: mapsUrl,
        yelpUrl: yelpUrl,
        helpfulLinks: this.getHelpfulLinksForActivityType(query)
      };
    } catch (error) {
      console.error('❌ [ActivityPlanning] Error searching activities:', error);
      return {
        success: false,
        error: error.message,
        query: query,
        location: location || 'your area'
      };
    }
  }

  /**
   * Parse web search results to extract useful information
   * @param {Object} searchResults - Web search results
   * @param {string} query - Original query
   * @param {string} location - Location
   * @returns {Array<Object>} Parsed recommendations
   */
  parseSearchResults(searchResults, query, location) {
    const recommendations = [];

    if (searchResults && searchResults.results && Array.isArray(searchResults.results)) {
      // Extract top 3-5 results
      const topResults = searchResults.results.slice(0, 5);
      
      topResults.forEach((result, index) => {
        if (result.title && result.snippet) {
          recommendations.push({
            name: result.title,
            description: result.snippet,
            url: result.url || result.link,
            rank: index + 1
          });
        }
      });
    }

    // If no results parsed, provide helpful guidance
    if (recommendations.length === 0) {
      recommendations.push({
        name: 'Search on Google Maps',
        description: `Search for "${query}${location ? ` near ${location}` : ''}" on Google Maps for the most up-to-date options with reviews, ratings, and directions.`,
        url: `https://www.google.com/maps/search/${encodeURIComponent(query + (location ? ` near ${location}` : ''))}`,
        rank: 1
      });
    }

    return recommendations;
  }

  /**
   * Get helpful links based on activity type
   * @param {string} activityType - Type of activity
   * @returns {Array<Object>} Array of helpful links
   */
  getHelpfulLinksForActivityType(activityType) {
    const lowerType = activityType.toLowerCase();
    const links = [];

    // Restaurant-related
    if (lowerType.includes('restaurant') || lowerType.includes('food') || lowerType.includes('dinner') || lowerType.includes('lunch') || lowerType.includes('italian') || lowerType.includes('pizza') || lowerType.includes('sushi') || lowerType.includes('mexican') || lowerType.includes('chinese') || lowerType.includes('thai')) {
      links.push({
        name: 'Yelp',
        url: 'https://www.yelp.com',
        description: 'Find restaurants with reviews and ratings'
      });
      links.push({
        name: 'OpenTable',
        url: 'https://www.opentable.com',
        description: 'Make restaurant reservations'
      });
      links.push({
        name: 'Google Maps',
        url: 'https://www.google.com/maps',
        description: 'Search for restaurants near you'
      });
    }

    // Entertainment/Activities
    if (lowerType.includes('mini golf') || lowerType.includes('golf') || lowerType.includes('escape room') || lowerType.includes('bowling') || lowerType.includes('arcade') || lowerType.includes('activity') || lowerType.includes('fun')) {
      links.push({
        name: 'Google Maps',
        url: 'https://www.google.com/maps',
        description: 'Search for activities and entertainment near you'
      });
      links.push({
        name: 'Yelp',
        url: 'https://www.yelp.com',
        description: 'Find local activities with reviews'
      });
    }

    // Escape rooms specifically
    if (lowerType.includes('escape room')) {
      links.push({
        name: 'Escape Room Directory',
        url: 'https://www.escaperoom.com',
        description: 'Find escape rooms near you'
      });
    }

    return links;
  }

  /**
   * Format activity recommendations for Mandy to share
   * @param {Object} searchResult - Result from searchActivities
   * @returns {string} Formatted message for Mandy to send
   */
  formatActivityRecommendations(searchResult) {
    if (!searchResult.success) {
      return `Hmm, having trouble finding that right now! 😅 Try searching on Google Maps or Yelp - they're usually pretty good at finding local spots!`;
    }

    let message = `Here are some great options for ${searchResult.query}${searchResult.location ? ` in ${searchResult.location}` : ''}:\n\n`;
    
    // Add specific recommendations if available
    if (searchResult.recommendations && searchResult.recommendations.length > 0) {
      searchResult.recommendations.slice(0, 3).forEach((rec, index) => {
        if (rec.name && rec.description) {
          message += `${index + 1}. **${rec.name}**\n`;
          if (rec.description) {
            message += `   ${rec.description.substring(0, 100)}${rec.description.length > 100 ? '...' : ''}\n`;
          }
          message += `\n`;
        }
      });
    }

    // Add search links
    message += `🔗 Quick links:\n`;
    message += `• [Google Maps](${searchResult.mapsUrl}) - See all options with reviews and directions\n`;
    if (searchResult.yelpUrl) {
      message += `• [Yelp](${searchResult.yelpUrl}) - Find restaurants with ratings\n`;
    }
    
    if (searchResult.helpfulLinks.length > 0) {
      searchResult.helpfulLinks.forEach(link => {
        message += `• [${link.name}](${link.url}) - ${link.description}\n`;
      });
    }

    return message;
  }
}

module.exports = new ActivityPlanningService();
