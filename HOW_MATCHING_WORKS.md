# How Mandy Knows Which Groups Are Matched

## Overview

Mandy determines which groups are matched by looking up match records stored in `data/matches.json`. These matches are created by a matching algorithm that runs separately (via `/api/match` endpoint).

## The Complete Flow

### Step 1: Groups Are Created
When groups sign up, their profiles are saved to `data/group-profiles.json`.

**Location:** `POST /api/groups/receive` in `server.js`

**What's stored:**
- Group name
- Email addresses
- Group size
- Interview answers (ideal day, music taste, vibes, etc.)
- `chatId` (when they start chatting with Mandy)

---

### Step 2: Matching Algorithm Runs
An admin or automated process calls `/api/match` to run the matching algorithm.

**Location:** `GET/POST /api/match` in `server.js`

**What happens:**
1. Retrieves all group profiles from storage
2. Runs matching algorithm (`services/group-matching.js`):
   - Compares all groups pairwise
   - Calculates compatibility scores based on:
     - Group size similarity (40% weight)
     - Music taste similarity (25% weight)
     - Activity/interest similarity (25% weight)
     - Emoji/vibe similarity (10% weight)
     - AI-powered qualitative analysis (60% weight)
3. Finds best matches for each group
4. **Saves matches** using `groupProfileStorage.saveMatch()`

**Match Record Structure:**
```javascript
{
  id: "match_1234567890_abc123",
  group1Name: "Luke and Friends",
  group2Name: "Sarah's Squad",
  group1Id: "group_123",
  group2Id: "group_456",
  compatibility: {
    percentage: 87,
    breakdown: {
      sizeSimilarity: 0.9,
      musicTaste: 0.8,
      // ... other scores
    }
  },
  matchedAt: "2024-01-15T10:30:00.000Z",
  isBestMatch: true  // Optional: marks the best match
}
```

**Storage:** Matches are saved to `data/matches.json`

---

### Step 3: Mandy Looks Up Matches
When a chat starts, Mandy calls `getMatchedGroupsForChat(chatId)` to find which groups are matched.

**Location:** `services/group-profile-storage.js` → `getMatchedGroupsForChat()`

**How it works:**
```javascript
function getMatchedGroupsForChat(chatId) {
  // 1. Find the group profile for this chatId
  const profile = getProfileByChatId(chatId);
  // Returns: { groupName: "Luke and Friends", ... }
  
  // 2. Find all matches for this group
  const matches = getMatchesForGroup(profile.groupName);
  // Returns: [
  //   { group1Name: "Luke and Friends", group2Name: "Sarah's Squad", ... },
  //   { group1Name: "Luke and Friends", group2Name: "Another Group", ... }
  // ]
  
  // 3. Select the best match (marked isBestMatch or first one)
  const bestMatch = matches.find(m => m.isBestMatch) || matches[0];
  
  // 4. Get both group profiles
  const group1 = getProfileByGroupName(bestMatch.group1Name);
  const group2 = getProfileByGroupName(bestMatch.group2Name);
  
  // 5. Return both groups
  return { group1, group2, match: bestMatch };
}
```

**Data Flow:**
```
chatId
  ↓
getProfileByChatId(chatId)
  ↓
profile.groupName = "Luke and Friends"
  ↓
getMatchesForGroup("Luke and Friends")
  ↓
Loads data/matches.json
  ↓
Filters: matches where group1Name OR group2Name = "Luke and Friends"
  ↓
Selects best match (isBestMatch: true OR first match)
  ↓
getProfileByGroupName("Luke and Friends") → group1
getProfileByGroupName("Sarah's Squad") → group2
  ↓
Returns { group1, group2, match }
```

---

## Key Functions

### `getMatchesForGroup(groupName)`
**Location:** `services/group-profile-storage.js`

**What it does:**
- Loads all matches from `data/matches.json`
- Filters matches where the group appears as either `group1Name` or `group2Name`
- Returns array of matches

**Code:**
```javascript
function getMatchesForGroup(groupName) {
  const allMatches = getAllMatches(); // Loads from data/matches.json
  return allMatches.filter(m => 
    m.group1Name.toLowerCase() === groupName.toLowerCase() ||
    m.group2Name.toLowerCase() === groupName.toLowerCase()
  );
}
```

### `saveMatch(match)`
**Location:** `services/group-profile-storage.js`

**What it does:**
- Saves a match record to `data/matches.json`
- Prevents duplicates (updates if same pair already exists)
- Generates unique ID if not provided

**Code:**
```javascript
function saveMatch(match) {
  const matchesData = loadMatches(); // Loads from data/matches.json
  
  // Check for existing match
  const existingIndex = matchesData.matches.findIndex(m => 
    (m.group1Name === match.group1Name && m.group2Name === match.group2Name) ||
    (m.group1Name === match.group2Name && m.group2Name === match.group1Name)
  );
  
  const matchToSave = {
    ...match,
    matchedAt: match.matchedAt || new Date().toISOString(),
    id: match.id || `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  if (existingIndex >= 0) {
    matchesData.matches[existingIndex] = matchToSave; // Update
  } else {
    matchesData.matches.push(matchToSave); // Add new
  }
  
  saveMatches(matchesData); // Writes to data/matches.json
}
```

---

## Data Storage

### File: `data/matches.json`
**Structure:**
```json
{
  "matches": [
    {
      "id": "match_1234567890_abc123",
      "group1Name": "Luke and Friends",
      "group2Name": "Sarah's Squad",
      "group1Id": "group_123",
      "group2Id": "group_456",
      "compatibility": {
        "percentage": 87,
        "breakdown": {
          "sizeSimilarity": 0.9,
          "musicTaste": 0.8,
          "activityMatch": 0.85,
          "vibeMatch": 0.9,
          "aiSimilarity": 0.88
        }
      },
      "matchedAt": "2024-01-15T10:30:00.000Z",
      "isBestMatch": true
    },
    {
      "id": "match_1234567891_def456",
      "group1Name": "Luke and Friends",
      "group2Name": "Another Group",
      "group1Id": "group_123",
      "group2Id": "group_789",
      "compatibility": {
        "percentage": 72
      },
      "matchedAt": "2024-01-15T10:30:00.000Z",
      "isBestMatch": false
    }
  ]
}
```

### File: `data/group-profiles.json`
**Structure:**
```json
{
  "groups": [
    {
      "id": "group_123",
      "groupName": "Luke and Friends",
      "email": "luke@example.com",
      "chatId": "chat_abc123",  // ← This links the chat to the group
      "answers": {
        "question1": "Luke and Friends",
        "question2": "4",
        "question3": "Looking for fun activities"
      },
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

---

## The Connection: chatId → groupName → matches

**The key link is the `chatId`:**

1. When a user starts chatting with Mandy, A1Zap provides a `chatId`
2. The group profile has a `chatId` field that links it to the chat
3. Mandy uses `getProfileByChatId(chatId)` to find which group this chat belongs to
4. Once she has the `groupName`, she can look up all matches for that group
5. She selects the best match and retrieves both group profiles

**Visual Flow:**
```
User starts chat
  ↓
A1Zap sends chat.started event with chatId: "chat_abc123"
  ↓
Mandy calls getMatchedGroupsForChat("chat_abc123")
  ↓
getProfileByChatId("chat_abc123")
  → Finds: { groupName: "Luke and Friends", chatId: "chat_abc123", ... }
  ↓
getMatchesForGroup("Luke and Friends")
  → Loads data/matches.json
  → Filters: matches where group1Name OR group2Name = "Luke and Friends"
  → Returns: [
      { group1Name: "Luke and Friends", group2Name: "Sarah's Squad", isBestMatch: true },
      { group1Name: "Luke and Friends", group2Name: "Another Group", isBestMatch: false }
    ]
  ↓
Selects best match (isBestMatch: true OR first match)
  → { group1Name: "Luke and Friends", group2Name: "Sarah's Squad", ... }
  ↓
getProfileByGroupName("Luke and Friends") → group1 profile
getProfileByGroupName("Sarah's Squad") → group2 profile
  ↓
Returns { group1, group2, match }
```

---

## Important Notes

### 1. Matches Must Be Created First
- Matches are **not automatically created** when groups sign up
- An admin must run `/api/match` to create matches
- Matches can be run multiple times (updates existing matches)

### 2. Multiple Matches Per Group
- A group can have multiple matches
- `getMatchedGroupsForChat()` selects the **best match**:
  - First looks for match with `isBestMatch: true`
  - If none found, uses the first match in the array

### 3. Bidirectional Matching
- Matches are stored with `group1Name` and `group2Name`
- `getMatchesForGroup()` checks both fields:
  ```javascript
  m.group1Name === groupName || m.group2Name === groupName
  ```
- This means a match works regardless of which group is "group1" or "group2"

### 4. No Match = No Introduction
- If `getMatchedGroupsForChat()` returns `null`, Mandy skips the group introduction
- She still sends the welcome message and game, but without group names/photos

---

## API Endpoints

### Create Matches
**Endpoint:** `GET/POST /api/match`  
**Auth:** Requires admin authentication  
**What it does:** Runs matching algorithm and saves matches

### View Matches
**Endpoint:** `GET /api/matches`  
**Auth:** Requires admin authentication  
**Returns:** All saved matches

### View Groups
**Endpoint:** `GET /api/groups`  
**Auth:** Requires admin authentication  
**Returns:** All group profiles

---

## Summary

**Mandy knows which groups are matched by:**

1. **Looking up the group** associated with the `chatId` using `getProfileByChatId(chatId)`
2. **Finding all matches** for that group using `getMatchesForGroup(groupName)` which reads from `data/matches.json`
3. **Selecting the best match** (one marked `isBestMatch` or the first match)
4. **Retrieving both group profiles** using `getProfileByGroupName()`
5. **Returning both groups** so Mandy can introduce them

**The matching data comes from:**
- `/api/match` endpoint that runs the matching algorithm
- Matches are saved to `data/matches.json` using `saveMatch()`
- Matches link two groups together with compatibility scores

**Key files:**
- `data/matches.json` - Stores all match records
- `data/group-profiles.json` - Stores all group profiles (with `chatId` links)
- `services/group-profile-storage.js` - Functions to read/write matches
- `server.js` - `/api/match` endpoint that creates matches
