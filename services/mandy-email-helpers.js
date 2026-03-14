/**
 * Mandy Email Helper Functions
 * 
 * These functions can be used in the mandythegroupmatcher server
 * to generate match notification emails with AI-generated photos.
 * 
 * Copy this file to your mandythegroupmatcher server and use it like:
 * 
 * const { generateMatchEmailHtml, notifyGroupOfMatch } = require('./mandy-email-helpers');
 */

/**
 * Generates HTML email template with photos side by side
 * 
 * @param {Object} params
 * @param {string} params.groupName - Name of the group receiving the email
 * @param {string} params.matchedGroupName - Name of the matched group
 * @param {string|null} params.groupPhotoUrl - AI-generated photo URL for the current group
 * @param {string|null} params.matchedGroupPhotoUrl - AI-generated photo URL for the matched group
 * @param {string} [params.matchedGroupDescription] - Optional description of the matched group
 * @returns {string} HTML email content
 */
function generateMatchEmailHtml({
  groupName,
  matchedGroupName,
  groupPhotoUrl,
  matchedGroupPhotoUrl,
  matchedGroupDescription = '',
  shareLink = null,
  compatibilityScore = null,
}) {
  // Default fallback if photos are missing
  const defaultPhotoUrl = 'https://via.placeholder.com/400x300?text=Group+Photo';
  
  // Ensure photo URLs are valid (don't escape URLs, only escape display text)
  // URLs must be strings and start with http:// or https://
  const isValidUrl = (url) => {
    return url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  };
  
  const yourPhotoUrl = isValidUrl(groupPhotoUrl) ? groupPhotoUrl : defaultPhotoUrl;
  const theirPhotoUrl = isValidUrl(matchedGroupPhotoUrl) ? matchedGroupPhotoUrl : defaultPhotoUrl;
  
  // Log for debugging
  if (!isValidUrl(groupPhotoUrl)) {
    console.warn(`[generateMatchEmailHtml] Invalid or missing photo URL for ${groupName}:`, groupPhotoUrl);
  }
  if (!isValidUrl(matchedGroupPhotoUrl)) {
    console.warn(`[generateMatchEmailHtml] Invalid or missing photo URL for ${matchedGroupName}:`, matchedGroupPhotoUrl);
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 20px;">
        <h1 style="color: #A51C30; margin: 0 0 20px 0; font-size: 28px; text-align: center; font-family: Arial, sans-serif;">
          🎉 You've Been Matched!
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 30px 0; font-family: Arial, sans-serif;">
          Hi <strong>${escapeHtml(groupName)}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 30px 0; font-family: Arial, sans-serif;">
          Great news! We've found a match for your group.
        </p>
        
        <h2 style="color: #A51C30; font-size: 22px; margin: 30px 0 20px 0; text-align: center; font-family: Arial, sans-serif;">
          Your Match: ${escapeHtml(matchedGroupName)}
        </h2>
        
        ${matchedGroupDescription ? `<p style="font-size: 16px; line-height: 1.6; color: #666666; margin: 0 0 30px 0; text-align: center; font-family: Arial, sans-serif;">${escapeHtml(matchedGroupDescription)}</p>` : ''}
        
        <!-- Photos Side by Side -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
          <tr>
            <td align="center" style="padding: 0 10px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="280">
                <tr>
                  <td align="center" style="padding: 0 0 10px 0;">
                    <p style="font-size: 14px; font-weight: bold; color: #A51C30; margin: 0; font-family: Arial, sans-serif;">Your Crew</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px; background-color: #f9f9f9; border-radius: 8px;">
                    <img src="${yourPhotoUrl}" alt="Your group" width="280" height="280" style="display: block; width: 280px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none; border-radius: 8px; -ms-interpolation-mode: bicubic;" />
                  </td>
                </tr>
              </table>
            </td>
            <td align="center" style="padding: 0 0 0 10px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="280">
                <tr>
                  <td align="center" style="padding: 0 0 10px 0;">
                    <p style="font-size: 14px; font-weight: bold; color: #A51C30; margin: 0; font-family: Arial, sans-serif;">${escapeHtml(matchedGroupName)}</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px; background-color: #f9f9f9; border-radius: 8px;">
                    <img src="${theirPhotoUrl}" alt="${escapeHtml(matchedGroupName)}" width="280" height="280" style="display: block; width: 280px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none; border-radius: 8px; -ms-interpolation-mode: bicubic;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${compatibilityScore !== null && compatibilityScore !== 'N/A' ? `
        <div style="background-color: #f9f9f9; border-left: 4px solid #A51C30; padding: 15px; margin: 30px 0; border-radius: 4px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0; font-family: Arial, sans-serif;">
            <strong>Compatibility Score: ${escapeHtml(String(compatibilityScore))}%</strong>
          </p>
        </div>
        ` : ''}
        
        <h2 style="color: #A51C30; font-size: 22px; margin: 40px 0 20px 0; font-family: Arial, sans-serif;">${shareLink ? 'Join Your Group Chat' : 'Next Steps'}</h2>
        ${shareLink ? `
        <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 30px 0; font-family: Arial, sans-serif;">
          Click the link below to join your group chat with <strong>${escapeHtml(matchedGroupName)}</strong> and start planning together!
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${shareLink}" style="background-color: #A51C30; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            Join Group Chat →
          </a>
        </p>
        <p style="font-size: 14px; color: #666666; margin: 20px 0 30px 0; text-align: center; font-family: Arial, sans-serif;">
          Or copy this link: <a href="${shareLink}" style="color: #A51C30; text-decoration: underline;">${shareLink}</a>
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 30px 0; font-family: Arial, sans-serif;">
          Once you join the chat, Mandy will be there to help you break the ice and plan activities together!
        </p>
        ` : `
        <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 30px 0; font-family: Arial, sans-serif;">
          We'll send you both an email with contact information and suggested meetup ideas!
        </p>
        `}
        
        <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 40px 0 0 0; font-family: Arial, sans-serif;">
          Best,<br>
          <strong>Mandy the Matchmaker</strong>
        </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Escapes HTML to prevent XSS attacks
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Gets the best photo URL from a group object
 * Prefers AI-generated variants, falls back to original photo
 * 
 * @param {Object} group - Group object with photo data
 * @returns {string|null} Photo URL or null if none available
 */
function getBestPhotoUrl(group) {
  if (!group) {
    console.warn('[getBestPhotoUrl] Group is null or undefined');
    return null;
  }
  
  // Try AI-generated variant URLs first
  if (group.groupPhotoVariantUrls && Array.isArray(group.groupPhotoVariantUrls) && group.groupPhotoVariantUrls.length > 0) {
    const url = group.groupPhotoVariantUrls[0];
    console.log(`[getBestPhotoUrl] Found variant URL: ${url}`);
    return url;
  }
  
  // Try variant objects
  if (group.groupPhotoVariants && Array.isArray(group.groupPhotoVariants) && group.groupPhotoVariants.length > 0) {
    const firstVariant = group.groupPhotoVariants[0];
    if (firstVariant && firstVariant.url) {
      console.log(`[getBestPhotoUrl] Found variant object URL: ${firstVariant.url}`);
      return firstVariant.url;
    }
  }
  
  // Fallback to original group photo
  if (group.groupPhotoUrl) {
    console.log(`[getBestPhotoUrl] Using original photo URL: ${group.groupPhotoUrl}`);
    return group.groupPhotoUrl;
  }
  
  console.warn(`[getBestPhotoUrl] No photo found for group: ${group.groupName || 'unknown'}`);
  return null;
}

/**
 * Sends a match notification email using the A1Zap API
 * 
 * @param {Object} params
 * @param {string} params.groupEmail - Email address of the group to notify
 * @param {string} params.groupName - Name of the group receiving the email
 * @param {string} params.matchedGroupName - Name of the matched group
 * @param {string|null} params.groupPhotoUrl - Photo URL for the current group
 * @param {string|null} params.matchedGroupPhotoUrl - Photo URL for the matched group
 * @param {string} [params.matchedGroupDescription] - Optional description
 * @param {Function} [params.sendEmailFn] - Optional custom email sending function
 * @returns {Promise<Object>} Result with success status
 */
async function notifyGroupOfMatch({
  groupEmail,
  groupName,
  matchedGroupName,
  groupPhotoUrl,
  matchedGroupPhotoUrl,
  matchedGroupDescription = '',
  shareLink = null,
  compatibilityScore = null,
  sendEmailFn = null, // If provided, use this instead of default sendEmailFromMandy
}) {
  // Log photo URLs for debugging
  console.log('[notifyGroupOfMatch] Photo URLs:', {
    groupName,
    groupPhotoUrl,
    matchedGroupName,
    matchedGroupPhotoUrl,
    shareLink,
    compatibilityScore,
  });

  // Warn if photos are missing
  if (!groupPhotoUrl) {
    console.warn(`[notifyGroupOfMatch] Warning: No photo URL for group ${groupName}`);
  }
  if (!matchedGroupPhotoUrl) {
    console.warn(`[notifyGroupOfMatch] Warning: No photo URL for matched group ${matchedGroupName}`);
  }

  const subject = `🎉 You've been matched with ${matchedGroupName}!`;
  const bodyHtml = generateMatchEmailHtml({
    groupName,
    matchedGroupName,
    groupPhotoUrl,
    matchedGroupPhotoUrl,
    matchedGroupDescription,
    shareLink,
    compatibilityScore,
  });
  
  // Plain text fallback
  const bodyText = shareLink 
    ? `Great news, ${groupName}!\n\nYou've been matched with ${matchedGroupName}!\n\n${compatibilityScore !== null && compatibilityScore !== 'N/A' ? `Compatibility Score: ${compatibilityScore}%\n\n` : ''}Join your group chat: ${shareLink}\n\nOnce you join, Mandy will help you break the ice and plan activities together!\n\nBest,\nMandy the Matchmaker`
    : `Great news, ${groupName}!\n\nYou've been matched with ${matchedGroupName}!\n\nCheck your dashboard for details.`;

  // Use provided function or default
  if (sendEmailFn) {
    return await sendEmailFn(groupEmail, subject, bodyHtml, bodyText);
  } else {
    // Import sendEmailFromMandy if available
    const { sendEmailFromMandy } = require('./services/email-service');
    return await sendEmailFromMandy(groupEmail, subject, bodyHtml, bodyText);
  }
}

/**
 * Validates group data structure and logs photo information for debugging
 * 
 * @param {Object} group - Group object to validate
 * @param {string} label - Label for logging (e.g., "Group 1")
 * @returns {Object} Validation result with photo URL and diagnostics
 */
function validateGroupPhotos(group, label = 'Group') {
  const validation = {
    label,
    groupName: group?.groupName || 'unknown',
    hasGroupPhotoUrl: !!group?.groupPhotoUrl,
    hasGroupPhotoVariants: !!group?.groupPhotoVariants,
    variantCount: Array.isArray(group?.groupPhotoVariants) ? group.groupPhotoVariants.length : 0,
    hasGroupPhotoVariantUrls: !!group?.groupPhotoVariantUrls,
    variantUrlCount: Array.isArray(group?.groupPhotoVariantUrls) ? group.groupPhotoVariantUrls.length : 0,
    extractedPhotoUrl: null,
    isValid: false,
  };

  validation.extractedPhotoUrl = getBestPhotoUrl(group);
  validation.isValid = !!validation.extractedPhotoUrl;

  // Log detailed diagnostics
  console.log(`[validateGroupPhotos] ${label} (${validation.groupName}):`, {
    hasPhoto: validation.isValid,
    photoUrl: validation.extractedPhotoUrl,
    dataStructure: {
      hasGroupPhotoUrl: validation.hasGroupPhotoUrl,
      hasGroupPhotoVariants: validation.hasGroupPhotoVariants,
      variantCount: validation.variantCount,
      hasGroupPhotoVariantUrls: validation.hasGroupPhotoVariantUrls,
      variantUrlCount: validation.variantUrlCount,
    },
  });

  if (!validation.isValid) {
    console.warn(`[validateGroupPhotos] ⚠️  ${label} (${validation.groupName}) has NO photo!`);
    console.warn(`[validateGroupPhotos] Available fields:`, Object.keys(group || {}));
  }

  return validation;
}

/**
 * Convenience function to send match emails to both groups
 * 
 * @param {Object} group1 - First group object
 * @param {Object} group2 - Second group object (matched with group1)
 * @param {Function} [sendEmailFn] - Optional custom email sending function
 * @param {string} [shareLink] - Optional group chat share link
 * @param {number|string} [compatibilityScore] - Optional compatibility score
 * @returns {Promise<Array>} Array of results for both emails
 */
async function notifyBothGroupsOfMatch(group1, group2, sendEmailFn = null, shareLink = null, compatibilityScore = null) {
  // Validate and extract photos with detailed logging
  console.log('[notifyBothGroupsOfMatch] Starting match email process...');
  
  const validation1 = validateGroupPhotos(group1, 'Group 1');
  const validation2 = validateGroupPhotos(group2, 'Group 2');
  
  const group1Photo = validation1.extractedPhotoUrl;
  const group2Photo = validation2.extractedPhotoUrl;

  // Warn if photos are missing
  if (!group1Photo || !group2Photo) {
    console.error('[notifyBothGroupsOfMatch] ⚠️  WARNING: Missing photos!');
    console.error('[notifyBothGroupsOfMatch] Group 1 photo:', group1Photo || 'MISSING');
    console.error('[notifyBothGroupsOfMatch] Group 2 photo:', group2Photo || 'MISSING');
    console.error('[notifyBothGroupsOfMatch] This will result in placeholder images or broken image links in the email.');
  } else {
    console.log('[notifyBothGroupsOfMatch] ✅ Both groups have photos - proceeding with email');
  }
  
  const results = await Promise.allSettled([
    notifyGroupOfMatch({
      groupEmail: group1.email,
      groupName: group1.groupName,
      matchedGroupName: group2.groupName,
      groupPhotoUrl: group1Photo,
      matchedGroupPhotoUrl: group2Photo,
      matchedGroupDescription: group2.tagline || group2.additionalInfo || '',
      shareLink,
      compatibilityScore,
      sendEmailFn,
    }),
    notifyGroupOfMatch({
      groupEmail: group2.email,
      groupName: group2.groupName,
      matchedGroupName: group1.groupName,
      groupPhotoUrl: group2Photo,
      matchedGroupPhotoUrl: group1Photo,
      matchedGroupDescription: group1.tagline || group1.additionalInfo || '',
      shareLink,
      compatibilityScore,
      sendEmailFn,
    }),
  ]);
  
  return results.map((result, index) => ({
    group: index === 0 ? group1.groupName : group2.groupName,
    success: result.status === 'fulfilled' && result.value.success,
    error: result.status === 'rejected' ? result.reason : (result.value.error || null),
  }));
}

module.exports = {
  generateMatchEmailHtml,
  getBestPhotoUrl,
  validateGroupPhotos,
  notifyGroupOfMatch,
  notifyBothGroupsOfMatch,
  escapeHtml,
};
