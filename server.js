/**
 * Mandy the Group Matchmaker Server
 * 
 * Server for Mandy the Group Matchmaker agent only.
 */

// Load environment variables from .env file
try {
  require('@dotenvx/dotenvx').config();
} catch (error) {
  // Fallback to dotenv if @dotenvx/dotenvx not available
  try {
    require('dotenv').config();
  } catch (e) {
    // If neither is available, environment variables must be set manually
    console.warn('⚠️  No dotenv package found - using system environment variables only');
  }
}

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
      mandy: 'POST /webhook/mandy',
      groups: 'GET /api/groups',
      receiveGroup: 'POST /api/groups/receive - Receive group data from main server',
      matches: 'GET /api/matches',
      match: 'GET/POST /api/match - Run matching algorithm and send emails',
      state: 'GET /api/state/:chatId',
      reset: 'DELETE /api/reset/:chatId',
      resetAll: 'DELETE /api/reset-all'
    }
  });
});

// Mandy the Group Matchmaker webhook endpoint
app.post('/webhook/mandy', mandyWebhookHandler);

// Matching endpoint - run matching algorithm and save results (POST or GET)
const handleMatchRequest = async (req, res) => {
  try {
    console.log('💕 Matching endpoint called');
    
    const groupMatching = require('./services/group-matching');
    const groupProfileStorage = require('./services/group-profile-storage');
    const emailService = require('./services/email-service');
    const fs = require('fs');
    const path = require('path');
    
    const allProfiles = groupProfileStorage.getAllProfiles();
    
    if (allProfiles.length < 2) {
      return res.status(400).json({
        error: 'Not enough groups',
        message: 'Need at least 2 groups to perform matching',
        groupsCount: allProfiles.length
      });
    }
    
    // Clear existing matches for fresh matching event
    const matchesData = { matches: [] };
    fs.writeFileSync(path.join(__dirname, 'data', 'matches.json'), JSON.stringify(matchesData, null, 2));
    
    // Find best overall match
    const bestMatch = await groupMatching.findBestMatch();
    
    if (bestMatch) {
      const matchRecord = {
        group1Name: bestMatch.group1.groupName,
        group2Name: bestMatch.group2.groupName,
        group1Id: bestMatch.group1.id,
        group2Id: bestMatch.group2.id,
        compatibility: bestMatch.compatibility,
        matchedAt: new Date().toISOString(),
        isBestMatch: true
      };
      
      groupProfileStorage.saveMatch(matchRecord);
    }
    
    // Send email notifications for best match if found
    let emailStatus = null;
    if (bestMatch) {
      console.log('📧 [Matching] Sending match notification emails...');
      const emailResult = await emailService.sendMatchNotification(
        {
          name: bestMatch.group1.groupName,
          email: bestMatch.group1.email || bestMatch.group1.contactEmail || null,
          memberEmails: bestMatch.group1.memberEmails || bestMatch.group1.emails || []
        },
        {
          name: bestMatch.group2.groupName,
          email: bestMatch.group2.email || bestMatch.group2.contactEmail || null,
          memberEmails: bestMatch.group2.memberEmails || bestMatch.group2.emails || []
        },
        {
          compatibility: bestMatch.compatibility
        }
      );
      
      emailStatus = {
        sent: emailResult.success,
        emails: emailResult.emails,
        shareLink: emailResult.shareLink,
        chatId: emailResult.chatId
      };
      
      if (emailResult.success) {
        console.log('✅ [Matching] Match notification emails sent successfully');
      } else {
        console.warn('⚠️  [Matching] Some emails failed to send:', emailResult.emails);
      }
    }
    
    // Find top matches for each group
    const matchesByGroup = {};
    let totalMatchesSaved = 0;
    
    for (const group of allProfiles) {
      const matches = await groupMatching.findMatchesForGroup(group.groupName, 3);
      matchesByGroup[group.groupName] = matches.map(m => ({
        groupName: m.group.groupName,
        compatibility: m.compatibility.percentage,
        breakdown: m.compatibility
      }));
      
      // Save top 3 matches for this group (avoid duplicates with best match)
      for (const match of matches) {
        const isBestMatchPair = bestMatch && (
          (match.group.groupName === bestMatch.group1.groupName && group.groupName === bestMatch.group2.groupName) ||
          (match.group.groupName === bestMatch.group2.groupName && group.groupName === bestMatch.group1.groupName)
        );
        
        if (!isBestMatchPair) {
          groupProfileStorage.saveMatch({
            group1Name: group.groupName,
            group2Name: match.group.groupName,
            group1Id: group.id,
            group2Id: match.group.id,
            compatibility: match.compatibility,
            matchedAt: new Date().toISOString()
          });
          totalMatchesSaved++;
        }
      }
    }
    
    const allMatches = groupProfileStorage.getAllMatches();
    
    res.json({
      success: true,
      message: 'Matching completed successfully',
      summary: {
        totalGroups: allProfiles.length,
        totalMatches: allMatches.length,
        bestMatch: bestMatch ? {
          group1: bestMatch.group1.groupName,
          group2: bestMatch.group2.groupName,
          compatibility: bestMatch.compatibility.percentage,
          breakdown: bestMatch.compatibility
        } : null
      },
      matchesByGroup,
      allMatches: allMatches.map(m => ({
        group1: m.group1Name,
        group2: m.group2Name,
        compatibility: m.compatibility?.percentage || 0,
        matchedAt: m.matchedAt,
        isBestMatch: m.isBestMatch || false
      })),
      emailStatus: emailStatus
    });
    
  } catch (error) {
    console.error('❌ Matching error:', error);
    res.status(500).json({
      error: 'Matching failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Support both GET and POST for easy access (just click the URL in Railway!)
app.get('/api/match', handleMatchRequest);
app.post('/api/match', handleMatchRequest);

// Get matches endpoint - retrieve saved matches
app.get('/api/matches', (req, res) => {
  try {
    const groupProfileStorage = require('./services/group-profile-storage');
    const allMatches = groupProfileStorage.getAllMatches();
    const allProfiles = groupProfileStorage.getAllProfiles();
    
    res.json({
      success: true,
      totalGroups: allProfiles.length,
      totalMatches: allMatches.length,
      matches: allMatches.map(m => ({
        group1: m.group1Name,
        group2: m.group2Name,
        compatibility: m.compatibility?.percentage || 0,
        breakdown: m.compatibility,
        matchedAt: m.matchedAt,
        isBestMatch: m.isBestMatch || false
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    res.status(500).json({
      error: 'Failed to fetch matches',
      message: error.message
    });
  }
});

// Get groups endpoint - retrieve all group profiles
app.get('/api/groups', (req, res) => {
  try {
    const groupProfileStorage = require('./services/group-profile-storage');
    const allProfiles = groupProfileStorage.getAllProfiles();
    
    res.json({
      success: true,
      totalGroups: allProfiles.length,
      groups: allProfiles.map(g => ({
        groupName: g.groupName,
        id: g.id,
        size: g.answers?.question2 || g.q2 || 'N/A',
        createdAt: g.createdAt,
        hasMiniAppSessions: !!(g.miniAppSessions && Object.keys(g.miniAppSessions).length > 0),
        hasMiniAppData: !!(g.miniAppData && Object.keys(g.miniAppData).length > 0)
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    res.status(500).json({
      error: 'Failed to fetch groups',
      message: error.message
    });
  }
});

// Sync mini app data endpoint - manually trigger sync for a chat
app.post('/api/sync-mini-app-data/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const mandyWebhookModule = require('./webhooks/mandy-webhook');
    const mandyWebhook = mandyWebhookModule.instance;
    
    if (!mandyWebhook || !mandyWebhook.syncMiniAppData) {
      return res.status(500).json({
        error: 'Webhook instance not available',
        message: 'Cannot access syncMiniAppData method'
      });
    }
    
    const miniAppData = await mandyWebhook.syncMiniAppData(chatId);
    
    if (miniAppData) {
      res.json({
        success: true,
        message: 'Mini app data synced successfully',
        chatId,
        miniAppData,
        syncedAt: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        message: 'No mini app sessions found for this chat',
        chatId
      });
    }
  } catch (error) {
    console.error('❌ Error syncing mini app data:', error);
    res.status(500).json({
      error: 'Failed to sync mini app data',
      message: error.message
    });
  }
});

// Reset/clear interview state for a chat (for testing)
app.delete('/api/reset/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const groupProfileStorage = require('./services/group-profile-storage');
    
    // Get current state before clearing (for logging)
    const currentState = groupProfileStorage.getInterviewState(chatId);
    const currentProfile = groupProfileStorage.getProfileByChatId(chatId);
    
    // Clear interview state
    groupProfileStorage.clearInterviewState(chatId);
    
    res.json({
      success: true,
      message: 'Interview state cleared for chat',
      chatId,
      clearedState: currentState ? {
        hadMiniAppsShared: currentState.miniAppsShared || false,
        sessionId: currentState.sessionId
      } : null,
      hadProfile: !!currentProfile,
      note: 'Profile was NOT deleted - only interview state was cleared. User can start fresh mini app flow.'
    });
  } catch (error) {
    console.error('❌ Error resetting chat state:', error);
    res.status(500).json({
      error: 'Failed to reset chat state',
      message: error.message
    });
  }
});

// Get interview state for debugging
app.get('/api/state/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const groupProfileStorage = require('./services/group-profile-storage');
    
    const state = groupProfileStorage.getInterviewState(chatId);
    const profile = groupProfileStorage.getProfileByChatId(chatId);
    
    res.json({
      success: true,
      chatId,
      interviewState: state,
      hasProfile: !!profile,
      profile: profile ? {
        groupName: profile.groupName,
        id: profile.id,
        hasMiniAppSessions: !!(profile.miniAppSessions && Object.keys(profile.miniAppSessions).length > 0),
        hasMiniAppData: !!(profile.miniAppData && Object.keys(profile.miniAppData).length > 0)
      } : null
    });
  } catch (error) {
    console.error('❌ Error getting state:', error);
    res.status(500).json({
      error: 'Failed to get state',
      message: error.message
    });
  }
});

// Clear ALL interview states (nuclear option for testing)
app.delete('/api/reset-all', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Clear interview state file
    const statePath = path.join(__dirname, 'data', 'interview-state.json');
    fs.writeFileSync(statePath, JSON.stringify({}, null, 2));
    
    res.json({
      success: true,
      message: 'All interview states cleared',
      note: 'Profiles were NOT deleted - only interview states were cleared'
    });
  } catch (error) {
    console.error('❌ Error resetting all states:', error);
    res.status(500).json({
      error: 'Failed to reset all states',
      message: error.message
    });
  }
});

// Receive group data from main A1Zap server
app.post('/api/groups/receive', async (req, res) => {
  try {
    console.log('📥 [Groups] Received group data from main server');
    console.log('   Data:', JSON.stringify(req.body, null, 2));
    
    const groupProfileStorage = require('./services/group-profile-storage');
    const groupData = req.body;
    
    // Validate required fields
    if (!groupData.name && !groupData.groupName) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Group must have a "name" or "groupName" field'
      });
    }
    
    // Transform incoming data to expected format
    // Handle different possible field names from the main server
    const transformedGroup = {
      groupName: groupData.name || groupData.groupName || groupData.group_name,
      email: groupData.email || groupData.contactEmail || groupData.contact_email,
      // Store member emails for group chat creation
      memberEmails: groupData.memberEmails || groupData.member_emails || groupData.emails || groupData.members || [],
      // Map answers - handle different formats
      answers: {
        question1: groupData.name || groupData.groupName || groupData.group_name,
        question2: groupData.size || groupData.groupSize || groupData.group_size || groupData.answers?.question2,
        question3: groupData.idealDay || groupData.ideal_day || groupData.lookingFor || groupData.looking_for || groupData.answers?.question3,
        question4: groupData.fictionReference || groupData.fiction_reference || groupData.answers?.question4,
        question5: groupData.musicTaste || groupData.music_taste || groupData.answers?.question5,
        question6: groupData.dislikedCelebrity || groupData.disliked_celebrity || groupData.answers?.question6,
        question7: groupData.originStory || groupData.origin_story || groupData.answers?.question7,
        question8: groupData.emoji || groupData.vibe || groupData.answers?.question8,
        question9: groupData.romanEmpire || groupData.roman_empire || groupData.answers?.question9,
        question10: groupData.sideQuest || groupData.side_quest || groupData.answers?.question10
      },
      // Store raw data for reference
      rawData: groupData,
      // Store vibes/preferences if provided (accept multiple field names)
      vibes: groupData.vibes || groupData.vibeTags || groupData.preferences || null,
      lookingFor: groupData.lookingFor || groupData.looking_for || null,
      // Store any additional metadata
      metadata: groupData.metadata || {},
      // Store chatId if provided (for linking to chat)
      chatId: groupData.chatId || groupData.chat_id || null
    };
    
    // Check if group already exists
    const existingProfile = groupProfileStorage.getProfileByGroupName(transformedGroup.groupName);
    
    if (existingProfile) {
      // Update existing profile
      console.log(`🔄 [Groups] Updating existing group: ${transformedGroup.groupName}`);
      const updated = groupProfileStorage.updateGroupProfile(transformedGroup.groupName, transformedGroup);
      
      if (updated) {
        return res.json({
          success: true,
          message: 'Group updated successfully',
          group: {
            name: updated.groupName,
            id: updated.id,
            email: updated.email,
            updated: true
          }
        });
      } else {
        return res.status(500).json({
          error: 'Failed to update group',
          message: 'Group found but update failed'
        });
      }
    } else {
      // Create new profile
      console.log(`✨ [Groups] Creating new group: ${transformedGroup.groupName}`);
      const saved = groupProfileStorage.saveGroupProfile(transformedGroup);
      
      return res.json({
        success: true,
        message: 'Group received and saved successfully',
        group: {
          name: saved.groupName,
          id: saved.id,
          email: saved.email,
          created: true
        }
      });
    }
  } catch (error) {
    console.error('❌ Error receiving group data:', error);
    res.status(500).json({
      error: 'Failed to process group data',
      message: error.message
    });
  }
});

// Poll and create profile from mini apps endpoint
app.post('/api/poll-mini-apps/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const mandyWebhookModule = require('./webhooks/mandy-webhook');
    const mandyWebhook = mandyWebhookModule.instance;
    
    if (!mandyWebhook || !mandyWebhook.pollAndCreateProfileFromMiniApps) {
      return res.status(500).json({
        error: 'Webhook instance not available'
      });
    }
    
    const groupProfileStorage = require('./services/group-profile-storage');
    const interviewState = groupProfileStorage.getInterviewState(chatId);
    const groupName = interviewState?.groupName || 'Unknown';
    
    const profile = await mandyWebhook.pollAndCreateProfileFromMiniApps(chatId, groupName);
    
    if (profile) {
      res.json({
        success: true,
        message: 'Profile created from mini app data',
        chatId,
        profile: {
          groupName: profile.groupName,
          id: profile.id,
          hasMiniAppData: !!(profile.miniAppData && Object.keys(profile.miniAppData).length > 0)
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Not enough mini app data yet or profile already exists',
        chatId
      });
    }
  } catch (error) {
    console.error('❌ Error polling mini apps:', error);
    res.status(500).json({
      error: 'Failed to poll mini apps',
      message: error.message
    });
  }
});
// Start server
// Railway sets PORT automatically, default to 3000 for local dev
const PORT = process.env.PORT || config.server.port || 3000;
// Listen on all interfaces for Railway/production, localhost for dev
const HOST = process.env.PORT ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Mandy the Group Matchmaker running on http://${HOST}:${PORT}`);
  console.log(`   Version: 1.0.0`);
  
  // Print agent registry summary
  agentRegistry.printSummary();
  
  console.log(`\nWebhook Endpoints:`);
  console.log(`  POST /webhook/mandy               - Mandy the Group Matchmaker`);
  console.log(`  GET  /health                      - Health check`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  GET/POST /api/match               - Run matching algorithm (clickable!)`);
  console.log(`  GET  /api/matches                 - Get all saved matches`);
  console.log(`  GET  /api/groups                  - Get all group profiles`);
  console.log(`  POST /api/sync-mini-app-data/:chatId - Sync mini app data for a chat`);
  console.log(`  POST /api/poll-mini-apps/:chatId - Poll mini apps and create profile`);
  console.log(`  GET  /api/state/:chatId          - Get interview state for debugging`);
  console.log(`  DELETE /api/reset/:chatId        - Reset interview state for a chat`);
  console.log(`  DELETE /api/reset-all            - Reset ALL interview states (testing)`);
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

