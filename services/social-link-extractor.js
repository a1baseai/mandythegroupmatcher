const fs = require('fs').promises;
const path = require('path');
const claudeService = require('./claude-service');

/**
 * Social Link Extractor Service
 * Parses CSV file and uses Claude AI to intelligently match restaurants mentioned
 * in responses to their TikTok/social media links
 */

class SocialLinkExtractor {
  constructor() {
    this.socialLinksCache = null;
    this.csvPath = path.join(__dirname, '../files/brandoneats.csv');
  }

  /**
   * Parse CSV line handling quoted fields with commas
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Load and parse the Brandon Eats CSV file
   * Returns array of objects with name, type, city, tiktokLink, transcript, available
   */
  async loadSocialLinks() {
    try {
      // Return cached data if available
      if (this.socialLinksCache) {
        return this.socialLinksCache;
      }

      console.log('📊 Loading social links from CSV...');
      const csvContent = await fs.readFile(this.csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        console.warn('⚠️  CSV file is empty');
        return [];
      }

      // Parse header
      const header = this.parseCSVLine(lines[0]);
      console.log('CSV Headers:', header);

      // Parse data rows
      const socialLinks = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        
        // Skip if not enough columns or no TikTok link
        if (values.length < 4 || !values[3] || !values[3].startsWith('http')) {
          continue;
        }

        socialLinks.push({
          name: values[0] || '',
          type: values[1] || '',
          city: values[2] || '',
          tiktokLink: values[3] || '',
          transcript: values[4] || '',
          available: values[5] || ''
        });
      }

      console.log(`✅ Loaded ${socialLinks.length} social links from CSV`);
      
      // Cache the results
      this.socialLinksCache = socialLinks;
      return socialLinks;

    } catch (error) {
      console.error('❌ Error loading social links:', error.message);
      return [];
    }
  }

  /**
   * Use Claude AI to intelligently detect which restaurants/places from the CSV
   * are actually mentioned in the bot's response
   * 
   * @param {string} responseText - The text response from the bot
   * @param {Array} allLinks - Array of all social link objects from CSV
   * @returns {Array} - Array of restaurant names that Claude identified as mentioned
   */
  async detectMentionedRestaurants(responseText, allLinks) {
    try {
      if (!allLinks || allLinks.length === 0) {
        return [];
      }

      // Extract just the names for Claude to analyze
      const restaurantNames = allLinks.map(link => link.name).filter(name => name);
      
      if (restaurantNames.length === 0) {
        return [];
      }

      console.log('🤖 Using Claude to detect mentioned restaurants...');

      // Create a prompt for Claude to analyze
      const analysisPrompt = `You are analyzing a response about restaurants and places in Vietnam.

RESPONSE TEXT:
${responseText}

AVAILABLE RESTAURANT/PLACE NAMES:
${restaurantNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

Task: Which of these restaurants or places are actually mentioned, discussed, or referenced in the response text?

Rules:
- Only return names that are clearly mentioned or discussed
- Match names even if slightly misspelled or abbreviated in the response
- If a place is recommended or described, count it as mentioned
- Return ONLY the exact names from the list above, one per line
- If none are mentioned, return "NONE"

Return only the names, nothing else:`;

      // Call Claude for analysis
      const claudeResponse = await claudeService.generateText(analysisPrompt, {
        temperature: 0.3, // Lower temperature for more consistent extraction
        maxTokens: 500
      });

      // Parse Claude's response
      const mentionedNames = claudeResponse
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== 'NONE' && !line.match(/^\d+\./))
        .filter(line => restaurantNames.includes(line));

      console.log(`✅ Claude identified ${mentionedNames.length} mentioned restaurants:`, mentionedNames);
      
      return mentionedNames;

    } catch (error) {
      console.error('❌ Error detecting mentioned restaurants:', error.message);
      return [];
    }
  }

  /**
   * Extract relevant social links based on the bot's response
   * Uses Claude AI to intelligently match mentioned restaurants
   * 
   * @param {string} responseText - The bot's response text
   * @returns {Array} - Array of relevant social link objects with name and url
   */
  async extractRelevantSocialLinks(responseText) {
    try {
      if (!responseText || typeof responseText !== 'string') {
        return [];
      }

      // Load all social links from CSV
      const allLinks = await this.loadSocialLinks();
      
      if (allLinks.length === 0) {
        console.log('ℹ️  No social links available in CSV');
        return [];
      }

      // Use Claude to detect which restaurants are mentioned
      const mentionedNames = await this.detectMentionedRestaurants(responseText, allLinks);

      if (mentionedNames.length === 0) {
        console.log('ℹ️  No restaurants mentioned in response');
        return [];
      }

      // Find the corresponding links
      const relevantLinks = allLinks
        .filter(link => mentionedNames.includes(link.name))
        .map(link => ({
          name: link.name,
          url: link.tiktokLink,
          type: link.type,
          city: link.city
        }))
        .filter(link => link.url); // Ensure URL exists

      // Limit to max 5 links to avoid overwhelming the user
      const limitedLinks = relevantLinks.slice(0, 5);

      if (limitedLinks.length > 0) {
        console.log(`✅ Found ${limitedLinks.length} relevant social links`);
        limitedLinks.forEach(link => {
          console.log(`   - ${link.name}: ${link.url}`);
        });
      }

      return limitedLinks;

    } catch (error) {
      console.error('❌ Error extracting relevant social links:', error.message);
      return [];
    }
  }

  /**
   * Clear the cache (useful for testing or when CSV is updated)
   */
  clearCache() {
    this.socialLinksCache = null;
    console.log('🗑️  Social links cache cleared');
  }
}

// Export singleton instance
module.exports = new SocialLinkExtractor();

