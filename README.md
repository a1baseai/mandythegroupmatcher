# Mandy the Group Matchmaker

A conversational AI agent that helps groups find compatible matches (like Harvard blocking groups). Mandy interviews groups through 10 questions, stores their profiles, and uses a sophisticated matching algorithm to pair compatible groups.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Interview Flow](#interview-flow)
- [Matching Algorithm](#matching-algorithm)
- [Data Storage](#data-storage)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [File Structure](#file-structure)
- [API Reference](#api-reference)

---

## Overview

Mandy is a webhook-based AI agent that:

1. **Conducts Interviews**: Asks 10 questions to groups, validates answers, and stores complete profiles
2. **Matches Groups**: Uses quantitative metrics (group size, interests) and AI-powered qualitative analysis to find compatible pairs
3. **Stores Results**: Saves group profiles and matches in JSON files for persistence

### Key Features

- ✅ Conversational interview flow with validation and clarification
- ✅ AI-powered contextual acknowledgments (funny, playful responses)
- ✅ Robust error handling and timeout protection
- ✅ Sophisticated matching algorithm prioritizing group size and shared interests
- ✅ Persistent data storage
- ✅ On-demand matching events (matches only saved when explicitly run)

---

## How It Works

### High-Level Flow

```
User starts chat → Mandy sends welcome message
     ↓
User responds → Mandy asks Question 1
     ↓
User answers → AI validates → Mandy acknowledges → Asks Question 2
     ↓
... (repeat for 10 questions) ...
     ↓
All questions answered → Profile saved → Interview complete
     ↓
Admin runs matching → All groups matched → Results saved
```

### Webhook Architecture

Mandy uses A1Zap's webhook system:

1. **A1Zap** receives messages from users
2. **A1Zap** sends webhook POST requests to your server
3. **Server** processes the request asynchronously:
   - Fetches conversation history
   - Determines current interview state
   - Validates answer (if applicable)
   - Generates response
   - Sends response back to A1Zap
4. **A1Zap** delivers the message to the user

### Asynchronous Processing

To prevent timeouts, the server:
- **Immediately** returns HTTP 200 to A1Zap (acknowledgment)
- Processes the request **asynchronously** in the background
- Sends the response after processing completes

This ensures A1Zap doesn't timeout even if AI calls take a few seconds.

---

## Architecture

### Core Components

#### 1. Base Classes (`core/`)

**`BaseAgent.js`**
- Abstract class defining agent structure
- Properties: `name`, `systemPrompt`, `welcomeMessage`
- Methods: `getSystemPrompt()`, `getWelcomeMessage()`

**`BaseA1ZapClient.js`**
- Unified client for A1Zap API
- Handles sending messages and fetching conversation history
- Error handling and logging

**`BaseWebhook.js`**
- Abstract webhook handler
- Handles:
  - Webhook request parsing
  - Deduplication (prevents processing same message twice)
  - Asynchronous processing
  - Response sending
  - Error handling

**`AgentRegistry.js`**
- Central registry for all agents
- Manages agent registration and lookup

#### 2. Mandy Agent (`agents/mandy-agent.js`)

Defines Mandy's personality and interview questions:

- **System Prompt**: Instructions for Mandy's behavior
- **Welcome Message**: Opening message when chat starts
- **10 Interview Questions**: The exact questions Mandy asks

#### 3. Mandy Webhook (`webhooks/mandy-webhook.js`)

The main logic handler extending `BaseWebhook`:

**Key Methods:**
- `handleChatStarted()`: Sends welcome message when chat begins
- `processRequest()`: Main request router
- `processQuestionAnswer()`: Handles answers during interview
- `validateAnswer()`: Validates answers using AI (Claude)
- `getFunAcknowledgment()`: Generates contextual, playful acknowledgments
- `handleClarification()`: Processes clarification follow-ups
- `saveCompletedProfile()`: Saves completed group profile

**Interview State Management:**
- Tracks current question number
- Stores collected answers
- Manages clarification state
- Prevents duplicate group names

#### 4. Services

**`claude-service.js`**
- Wrapper for Anthropic Claude API
- Methods: `generateText()`, `chat()`, `chatWithBaseFile()`
- Handles API calls and error handling

**`group-profile-storage.js`**
- Manages persistent storage
- Handles:
  - Group profiles (`group-profiles.json`)
  - Interview state (`interview-state.json`)
  - Matches (`matches.json`)
- Methods: `saveGroupProfile()`, `getInterviewState()`, `saveMatch()`, etc.

**`group-matching.js`**
- Matching algorithm implementation
- Calculates compatibility scores
- Methods: `calculateCompatibility()`, `findBestMatch()`, `findMatchesForGroup()`

**`webhook-helpers.js`**
- Utility functions for webhook handling
- Deduplication logic
- Test chat detection

---

## Interview Flow

### Step-by-Step Process

#### 1. Chat Started Event

When a user starts a chat with Mandy:

```javascript
// Event: chat.started
handleChatStarted() {
  1. Extract chatId from webhook
  2. Check if welcome message already sent
  3. Get welcome message from mandy-agent
  4. Send via A1Zap API
  5. Mark as sent
  6. Return success
}
```

**Welcome Message:**
```
Hey! 👋 I'm Mandy, your Group Matchmaker Helper!

I help groups like yours find compatible matches (think blocking groups at Harvard). 
I'll ask you 10 fun questions to create your group's profile.

Please make sure all your groupmates are in this chat! 
Are you ready to start the questions?
```

#### 2. Question Flow (Questions 1-10)

For each question:

```javascript
processQuestionAnswer() {
  1. Load interview state (current question, answers collected)
  2. Validate user's answer using AI
  3. If invalid → Ask for clarification
  4. If valid → 
     a. Save answer to interview state
     b. Generate fun acknowledgment
     c. Check if all 10 questions answered
     d. If not → Ask next question
     e. If yes → Save profile and complete
}
```

**Validation Process:**
- Uses Claude AI to validate answers
- Pre-validation for specific questions (e.g., Question 2 = group size must be numeric)
- Handles edge cases (e.g., "3 people" → extracts "3")
- Prevents infinite clarification loops (max 3 attempts)

**Acknowledgment Generation:**
- Uses Claude AI to generate contextual, playful responses
- References specific details from the answer
- Falls back to simple acknowledgments if AI fails
- Timeout protection (4-6 seconds max)

#### 3. The 10 Questions

1. **Group Name**: Must be unique
2. **Group Size**: Number of people (1-100)
3. **Ideal Day**: What they like to do
4. **Fictional Group**: Who they'd be in fiction
5. **Music Taste**: Genre/preferences
6. **Disliked Celebrity**: Someone they all dislike
7. **Origin Story**: How they met
8. **Emoji**: Their group emoji
9. **Roman Empire**: Random thing they think about
10. **Side Quest**: Crazy adventure they've been on

#### 4. Profile Completion

When all 10 questions are answered:

```javascript
saveCompletedProfile() {
  1. Build profile object with all answers
  2. Check for duplicate group name
  3. Save to group-profiles.json
  4. Clear interview state
  5. Send completion message
}
```

**Completion Message:**
```
🎉 Amazing! I've created your group's profile. 
Thanks for answering all my questions! 
Your group "[Name]" is now in the matching pool. 
I'll let you know when we find a great match for you!
```

---

## Matching Algorithm

### Overview

The matching algorithm uses a **hybrid approach**:
- **40% Quantitative** (objective metrics)
- **60% Qualitative** (AI-powered analysis)

### Quantitative Score (40%)

Calculated from 4 weighted factors:

#### 1. Group Size Similarity (40% of quantitative = 16% total)

**CRITICAL PRIORITY** - Groups with similar sizes match better.

**Scoring:**
- Exact match (3 vs 3): **100 points**
- Difference of 1 (3 vs 4): **90 points**
- Difference of 2 (3 vs 5): **70 points**
- Difference of 3 (3 vs 6): **50 points**
- Difference of 4+: **10-40 points** (exponentially decreasing)

#### 2. Music Taste Similarity (25% of quantitative = 10% total)

Groups with similar music taste share compatible vibes.

**Scoring:**
- Exact match: **100 points**
- Same genre: **80 points**
- Related genres: **50 points**
- No similarity: **20 points**

**Genres Detected:**
- Rock: rock, indie rock, alternative, punk
- Pop: pop, mainstream, top 40
- Hip-hop: rap, hip hop, hiphop, trap
- Electronic: house, edm, electronic, techno
- Indie: indie, alternative

#### 3. Activity Similarity (25% of quantitative = 10% total)

Based on "ideal day" responses.

**Activity Categories:**
- Outdoor: beach, hiking, mountain, park, camping
- Food: eating, restaurant, cooking
- Social: friends, hanging, party
- Creative: art, music, projects
- Chill: relax, netflix, watching
- Adventure: exploring, travel, road trip

**Scoring:**
- Same category: **70-100 points**
- Common keywords: **20-60 points**
- No similarity: **20 points**

#### 4. Emoji/Vibe Similarity (10% of quantitative = 4% total)

Lower priority indicator of similar energy.

**Scoring:**
- Exact match: **80 points**
- Different: **30 points**

### Qualitative Score (60%)

Uses **Claude AI** to analyze deeper compatibility.

**Analysis Criteria (in priority order):**

1. **Group Size Similarity** (HIGHEST PRIORITY)
   - Same/similar sizes (diff ≤ 1): Start at **70-100 base**
   - Moderate difference (2-3): Start at **50-70 base**
   - Large difference (4+): Start at **30-50 base**

2. **Shared Interests**
   - Similar activities, references, values
   - **+5-15 points** per shared interest

3. **Cultural Fit**
   - Music compatibility, similar vibes
   - **+5-10 points**

4. **Complementary Personalities**
   - Groups that balance each other
   - **+0-10 points**

**Penalties:**
- Conflicting vibes: **-5-10 points**

### Final Score Calculation

```
Final Score = (Quantitative × 40%) + (Qualitative × 60%)
```

**Example:**
- Quantitative: 68%
- Qualitative: 95%
- Final: (68% × 40%) + (95% × 60%) = **84.2%**

### Running Matching

Matches are **NOT** automatically generated. You must run a matching event:

```bash
node find-matches.js
```

This script:
1. Clears existing matches
2. Calculates matches for all groups
3. Saves all matches to `data/matches.json`

---

## Data Storage

### Files

All data is stored in the `data/` directory:

#### `group-profiles.json`

Completed group profiles:

```json
{
  "groups": [
    {
      "groupName": "Luker",
      "answers": {
        "question1": "Luker",
        "question2": "3",
        "question3": "Going to the beach",
        ...
      },
      "id": "group_1234567890_abc123",
      "createdAt": "2025-12-10T22:03:37.323Z",
      "profileVersion": "1.0"
    }
  ]
}
```

#### `interview-state.json`

Current interview state for active chats:

```json
{
  "chatId123": {
    "questionNumber": 5,
    "groupName": "Luker",
    "answers": {
      "question1": "Luker",
      "question2": "3",
      ...
    },
    "startedAt": "2025-12-10T22:03:37.323Z",
    "waitingForClarification": false
  }
}
```

#### `matches.json`

Stored match results:

```json
{
  "matches": [
    {
      "id": "match_1234567890_abc123",
      "group1Name": "Luker",
      "group2Name": "Test Group",
      "group1Id": "group_...",
      "group2Id": "group_...",
      "compatibility": {
        "score": 0.84,
        "percentage": 84,
        "breakdown": {
          "quantitative": 76,
          "qualitative": 90,
          "sizeMatch": 100
        }
      },
      "matchedAt": "2025-12-11T02:00:00.000Z",
      "isBestMatch": true
    }
  ]
}
```

---

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- A1Zap account and agent
- Claude API key

### Installation

1. **Clone/Download the project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   CLAUDE_API_KEY=your_claude_api_key_here
   A1ZAP_API_KEY=your_a1zap_api_key_here
   MANDY_AGENT_ID=your_mandy_agent_id_here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   Server runs on `http://localhost:3000`

5. **Set up webhook:**
   - Point A1Zap webhook to: `https://your-domain.com/webhook/mandy`
   - For local testing, use a tunnel (see below)

### Local Testing with Tunnel

**Using Localtunnel:**
```bash
npm install -g localtunnel
lt --port 3000
```

**Using Cloudflared:**
```bash
cloudflared tunnel --url http://localhost:3000
```

Copy the HTTPS URL and use it as your A1Zap webhook URL.

---

## Usage

### Running the Server

```bash
npm start
```

### Viewing Data

**View all group profiles and matches:**
```bash
node view-data.js
```

### Running Matching Events

**Generate and save all matches:**
```bash
node find-matches.js
```

This performs an official matching event:
1. Clears existing matches
2. Calculates all matches
3. Saves results to `data/matches.json`

### Testing

You can test webhooks using curl:

```bash
# Simulate chat.started event
curl -X POST http://localhost:3000/webhook/mandy \
  -H "Content-Type: application/json" \
  -d '{
    "event": "chat.started",
    "chatId": "test-chat-123",
    "userId": "user-123",
    "userName": "Test User"
  }'

# Simulate message.received event
curl -X POST http://localhost:3000/webhook/mandy \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "chatId": "test-chat-123",
    "messageId": "msg-123",
    "message": "Luke and Friends",
    "userId": "user-123",
    "userName": "Test User"
  }'
```

---

## File Structure

```
a1zap-image-multiturn-agent/
├── agents/
│   └── mandy-agent.js          # Mandy's personality and questions
├── core/
│   ├── AgentRegistry.js        # Agent registry
│   ├── BaseAgent.js            # Base agent class
│   ├── BaseA1ZapClient.js      # A1Zap API client
│   └── BaseWebhook.js          # Base webhook handler
├── data/
│   ├── group-profiles.json     # Completed group profiles
│   ├── interview-state.json    # Active interview states
│   └── matches.json            # Stored match results
├── services/
│   ├── claude-service.js       # Claude AI service
│   ├── group-matching.js       # Matching algorithm
│   ├── group-profile-storage.js # Data storage service
│   └── webhook-helpers.js      # Webhook utilities
├── webhooks/
│   └── mandy-webhook.js        # Mandy webhook handler
├── config.js                   # Configuration
├── server.js                   # Express server
├── view-data.js               # Data viewer utility
├── find-matches.js            # Matching event script
├── package.json
└── README.md
```

---

## API Reference

### Webhook Endpoints

#### `POST /webhook/mandy`

Main webhook endpoint for Mandy.

**Events:**
- `chat.started`: User starts a chat
- `message.received`: User sends a message

**Response:**
```json
{
  "success": true,
  "agent": "mandy",
  "processing": true,
  "messageId": "msg-123"
}
```

### Health Check

#### `GET /health`

Returns server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-11T02:00:00.000Z",
  "config": {
    "hasClaudeApiKey": true,
    "hasA1ZapApiKey": true
  }
}
```

---

## Key Concepts

### Interview State

Tracks where each chat is in the interview process:

- `questionNumber`: Current question (1-10)
- `answers`: Collected answers so far
- `groupName`: Group name (set in question 1)
- `waitingForClarification`: Whether waiting for clarification
- `clarificationQuestion`: Question to ask for clarification

### Deduplication

Prevents processing the same message twice:
- Messages are marked as processed after response is sent
- Duplicate webhook calls are ignored
- Based on `messageId` from A1Zap

### Timeout Protection

All AI calls have timeout protection:
- Acknowledgment generation: 4-6 seconds
- Answer validation: 5 seconds
- History fetch: 5 seconds
- Overall processing: 12 seconds

If timeouts occur, system falls back to simpler responses.

### Error Handling

Robust error handling ensures Mandy never freezes:
- Try-catch blocks around all AI calls
- Fallback responses if AI fails
- Logging for debugging
- Graceful degradation

---

## Troubleshooting

### Mandy Not Responding

1. Check server logs for errors
2. Verify `.env` file has correct API keys
3. Check A1Zap webhook URL is correct
4. Verify server is running and accessible

### Matches Not Showing

1. Run `node find-matches.js` to generate matches
2. Check `data/matches.json` file exists
3. Verify groups completed all 10 questions

### Interview Stuck

1. Check `data/interview-state.json` for stuck states
2. Manually clear state if needed
3. Check logs for validation errors

---

## License

See LICENSE file for details.
