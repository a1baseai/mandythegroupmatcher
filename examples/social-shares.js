/**
 * Example: Using Social Share Rich Content with BrandyEats Agent
 * 
 * This example shows different ways to send social media embeds
 * using the new Rich Messages API.
 */

const brandonEatsClient = require('./services/brandoneats-client');

// Example 1: Using the helper method (easiest)
async function example1_helperMethod(chatId) {
  console.log('\n📱 Example 1: Using Helper Method\n');
  
  const socialLinks = [
    { platform: 'instagram', url: 'https://www.instagram.com/reel/DQI4QE8jHiL/' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144' },
    { platform: 'youtube', url: 'https://www.youtube.com/shorts/ToobPQS6_ZI' }
  ];

  const result = await brandonEatsClient.sendSocialShareMessage(
    chatId,
    '🔥 Check out our viral content across all platforms!',
    socialLinks
  );
  
  console.log('✅ Sent with helper method');
  console.log(`   Message ID: ${result.messageId}\n`);
  
  return result;
}

// Example 2: Using sendMessage with explicit blocks
async function example2_explicitBlocks(chatId) {
  console.log('\n📱 Example 2: Using Explicit Rich Content Blocks\n');
  
  const richContentBlocks = [
    {
      type: 'social_share',
      data: {
        platform: 'instagram',
        url: 'https://www.instagram.com/reel/DQI4QE8jHiL/'
      },
      order: 0
    },
    {
      type: 'social_share',
      data: {
        platform: 'tiktok',
        url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144'
      },
      order: 1
    },
    {
      type: 'social_share',
      data: {
        platform: 'youtube',
        url: 'https://www.youtube.com/shorts/ToobPQS6_ZI'
      },
      order: 2
    }
  ];

  const result = await brandonEatsClient.sendMessage(
    chatId,
    '🎬 Our top 3 videos this week!',
    richContentBlocks
  );
  
  console.log('✅ Sent with explicit blocks');
  console.log(`   Message ID: ${result.messageId}\n`);
  
  return result;
}

// Example 3: Single social share
async function example3_singleShare(chatId) {
  console.log('\n📱 Example 3: Single Social Share\n');
  
  const result = await brandonEatsClient.sendSocialShareMessage(
    chatId,
    '📸 Our most liked Instagram reel!',
    [{ platform: 'instagram', url: 'https://www.instagram.com/reel/DQI4QE8jHiL/' }]
  );
  
  console.log('✅ Sent single social share');
  console.log(`   Message ID: ${result.messageId}\n`);
  
  return result;
}

// Example 4: Dynamic social shares based on content
async function example4_dynamicContent(chatId, platform) {
  console.log(`\n📱 Example 4: Dynamic ${platform} Share\n`);
  
  const socialContent = {
    instagram: {
      url: 'https://www.instagram.com/reel/DQI4QE8jHiL/',
      message: '📸 Check out our Instagram reel!'
    },
    tiktok: {
      url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144',
      message: '🎵 Watch this TikTok video!'
    },
    youtube: {
      url: 'https://www.youtube.com/shorts/ToobPQS6_ZI',
      message: '🎬 Watch on YouTube Shorts!'
    }
  };

  const content = socialContent[platform];
  if (!content) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const result = await brandonEatsClient.sendSocialShareMessage(
    chatId,
    content.message,
    [{ platform, url: content.url }]
  );
  
  console.log(`✅ Sent ${platform} share`);
  console.log(`   Message ID: ${result.messageId}\n`);
  
  return result;
}

// Example 5: Social shares + CTA button
async function example5_withButton(chatId) {
  console.log('\n📱 Example 5: Social Shares + Call-to-Action Button\n');
  
  const richContentBlocks = [
    {
      type: 'social_share',
      data: {
        platform: 'instagram',
        url: 'https://www.instagram.com/reel/DQI4QE8jHiL/'
      },
      order: 0
    },
    {
      type: 'social_share',
      data: {
        platform: 'tiktok',
        url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144'
      },
      order: 1
    },
    {
      type: 'button_card',
      data: {
        title: 'Want more food content?',
        description: 'Follow us on your favorite platform!',
        buttons: [
          {
            id: 'btn_follow_ig',
            label: '📸 Follow on Instagram',
            action: 'url',
            value: 'https://www.instagram.com/brandneweats',
            variant: 'primary'
          },
          {
            id: 'btn_follow_tiktok',
            label: '🎵 Follow on TikTok',
            action: 'url',
            value: 'https://www.tiktok.com/@brandneweats',
            variant: 'secondary'
          }
        ]
      },
      order: 2
    }
  ];

  const result = await brandonEatsClient.sendMessage(
    chatId,
    '🍕 Love what you see?',
    richContentBlocks
  );
  
  console.log('✅ Sent social shares with CTA buttons');
  console.log(`   Message ID: ${result.messageId}\n`);
  
  return result;
}

// Example 6: Webhook integration example
async function example6_webhookIntegration(chatId, userMessage) {
  console.log('\n📱 Example 6: Webhook Integration Pattern\n');
  
  // Check if user is asking about social content
  const keywords = ['viral', 'popular', 'trending', 'social', 'instagram', 'tiktok'];
  const isAskingAboutSocial = keywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );

  if (isAskingAboutSocial) {
    console.log(`User asked: "${userMessage}"`);
    console.log('Responding with social shares...');
    
    const socialLinks = [
      { platform: 'instagram', url: 'https://www.instagram.com/reel/DQI4QE8jHiL/' },
      { platform: 'tiktok', url: 'https://www.tiktok.com/@brandneweats/video/7546112444503035144' },
      { platform: 'youtube', url: 'https://www.youtube.com/shorts/ToobPQS6_ZI' }
    ];

    const result = await brandonEatsClient.sendSocialShareMessage(
      chatId,
      '🔥 Here are our most viral posts! These videos have millions of views across Instagram, TikTok, and YouTube.',
      socialLinks
    );
    
    console.log('✅ Sent contextual social share response');
    console.log(`   Message ID: ${result.messageId}\n`);
    
    return result;
  } else {
    // Send regular text response
    const result = await brandonEatsClient.sendMessage(
      chatId,
      'I can help you with food data and show you our viral social content! What would you like to know?'
    );
    
    console.log('✅ Sent regular text response');
    console.log(`   Message ID: ${result.messageId}\n`);
    
    return result;
  }
}

// Demo runner
async function runExamples(chatId) {
  console.log('\n🚀 BrandyEats Social Share Examples');
  console.log('=' .repeat(60));
  console.log(`Chat ID: ${chatId}`);
  console.log('=' .repeat(60));

  try {
    // Run examples with delays between them
    await example1_helperMethod(chatId);
    await sleep(2000);
    
    await example2_explicitBlocks(chatId);
    await sleep(2000);
    
    await example3_singleShare(chatId);
    await sleep(2000);
    
    await example4_dynamicContent(chatId, 'tiktok');
    await sleep(2000);
    
    await example5_withButton(chatId);
    await sleep(2000);
    
    await example6_webhookIntegration(chatId, 'Show me your viral content!');
    
    console.log('=' .repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('=' .repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export examples for use in other files
module.exports = {
  example1_helperMethod,
  example2_explicitBlocks,
  example3_singleShare,
  example4_dynamicContent,
  example5_withButton,
  example6_webhookIntegration,
  runExamples
};

// If run directly, execute demo
if (require.main === module) {
  const chatId = process.argv[2] || process.env.TEST_CHAT_ID;
  
  if (!chatId || chatId === 'YOUR_TEST_CHAT_ID_HERE') {
    console.error('\n❌ ERROR: Please provide a chat ID\n');
    console.error('Usage:');
    console.error('  node example-social-shares.js YOUR_CHAT_ID');
    console.error('  TEST_CHAT_ID=YOUR_CHAT_ID node example-social-shares.js\n');
    process.exit(1);
  }
  
  runExamples(chatId);
}

/**
 * Usage:
 * 
 * Run all examples:
 *   node example-social-shares.js j123abc456def
 *   TEST_CHAT_ID=j123abc456def node example-social-shares.js
 * 
 * Use in your code:
 *   const examples = require('./example-social-shares');
 *   await examples.example1_helperMethod(chatId);
 */

