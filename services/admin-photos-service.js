/**
 * Admin Photos Service
 * Fetches photos from the admin dashboard Photos tab
 */

const axios = require('axios');

const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'https://mandythegroupmatcher-production.up.railway.app';
const ADMIN_USER = process.env.MANDY_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.MANDY_ADMIN_PASSWORD || 'a1zapped!';

/**
 * Get photos from admin API
 * @returns {Promise<Array<string>>} Array of photo URLs
 */
async function getPhotos() {
  try {
    // Create basic auth header
    const auth = Buffer.from(`${ADMIN_USER}:${ADMIN_PASSWORD}`).toString('base64');
    
    // Try to fetch photos from admin API
    // Note: This assumes there's a /admin/api/photos endpoint
    // If not, we may need to scrape or use a different endpoint
    const response = await axios.get(`${ADMIN_BASE_URL}/admin/api/photos`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && Array.isArray(response.data.photos)) {
      return response.data.photos;
    }
    
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error(`⚠️  [AdminPhotos] Error fetching photos:`, error.message);
    // Return empty array on error - we'll handle gracefully
    return [];
  }
}

/**
 * Get a random photo from the photos array
 * @param {Array<string>} photos - Array of photo URLs
 * @returns {string|null} Random photo URL or null
 */
function getRandomPhoto(photos) {
  if (!photos || photos.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex];
}

module.exports = {
  getPhotos,
  getRandomPhoto
};
