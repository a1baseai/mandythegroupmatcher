/**
 * Activity Planning Service
 * Helps groups find local activities like restaurants, mini golf, escape rooms, etc.
 */

const axios = require('axios');

class ActivityPlanningService {
  constructor() {
    // You can add API keys here for services like Google Places, Yelp, etc.
    // For now, we'll use web search as a fallback
  }

  /**
   * Search for local activities based on query and location
   * @param {string} query - What they're looking for (e.g., "italian restaurant", "mini golf", "escape room")
   * @param {string} location - Location (city, area, etc.) - optional
   * @returns {Promise<Object>} Activity recommendations with links and info
   */
  async searchActivities(query, location = '') {
    try {
      // Build search query
      const searchQuery = location 
        ? `${query} near ${location}`
        : query;

      // For now, we'll return a structured response that Mandy can use
      // In production, you could integrate with:
      // - Google Places API
      // - Yelp Fusion API
      // - Foursquare API
      // - Or use web search results

      // Return a helpful response structure
      return {
        success: true,
        query: searchQuery,
        suggestions: [
          {
            type: 'search',
            message: `I can help you find ${query}${location ? ` in ${location}` : ''}! Let me search for the best options...`,
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
            tip: `Try searching for "${searchQuery}" on Google Maps or Yelp for the most up-to-date options!`
          }
        ],
        // Additional helpful links based on activity type
        helpfulLinks: this.getHelpfulLinksForActivityType(query)
      };
    } catch (error) {
      console.error('❌ [ActivityPlanning] Error searching activities:', error);
      return {
        success: false,
        error: error.message
      };
    }
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

    let message = `Here are some ways to find ${searchResult.query}:\n\n`;
    
    if (searchResult.helpfulLinks.length > 0) {
      message += `🔗 Helpful links:\n`;
      searchResult.helpfulLinks.forEach(link => {
        message += `• ${link.name} - ${link.description}\n`;
      });
      message += `\n`;
    }

    message += `💡 Tip: Search "${searchResult.query}" on Google Maps for the most up-to-date options with reviews and directions!`;

    return message;
  }
}

module.exports = new ActivityPlanningService();
