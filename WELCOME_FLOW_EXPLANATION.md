# Mandy's Welcome Flow - Complete Explanation

## Overview

When a new chat starts with Mandy, she automatically sends a sequence of 3 messages to introduce matched groups and get them started with a welcome game.

## The Flow

### Step 1: Chat Started Event
When a user starts a chat with Mandy, A1Zap sends a `chat.started` webhook event to our server.

**Location:** `webhooks/mandy-webhook.js` → `handleChatStarted()`

### Step 2: Welcome Message (First Message)
Mandy sends a personalized welcome message.

**Code Flow:**
```javascript
const welcomeMessage = this.agent.getWelcomeMessage(userName, isAnonymous);
await this.client.sendMessage(chatId, welcomeMessage);
```

**What it does:**
- Gets welcome message from `mandy-agent.js`
- Message mentions the 15% bonus for playing games
- Sent as plain text message

---

### Step 3: Group Introduction (Second & Third Messages)

#### 3a. Get Matched Groups
Mandy retrieves which two groups are matched together for this chat.

**Code Flow:**
```javascript
const matchedGroups = groupProfileStorage.getMatchedGroupsForChat(chatId);
// Returns: { group1: {...}, group2: {...}, match: {...} }
```

**How `getMatchedGroupsForChat()` works:**
1. Takes `chatId` as input
2. Finds the group profile associated with that `chatId` using `getProfileByChatId(chatId)`
3. Gets all matches for that group using `getMatchesForGroup(groupName)`
4. Selects the best match (one marked `isBestMatch` or the first match)
5. Retrieves both group profiles using `getProfileByGroupName()`
6. Returns `{ group1, group2, match }` object

**Location:** `services/group-profile-storage.js` → `getMatchedGroupsForChat()`

#### 3b. Fetch Photos
Mandy fetches available photos from the admin dashboard.

**Code Flow:**
```javascript
const photos = await adminPhotosService.getPhotos();
const group1Photo = adminPhotosService.getRandomPhoto(photos);
const group2Photo = adminPhotosService.getRandomPhoto(photos);
```

**How `adminPhotosService` works:**
1. **getPhotos()** function:
   - Uses Basic Auth (username: `admin`, password: `a1zapped!`)
   - Makes GET request to `/admin/api/photos` endpoint
   - Caches results for 5 minutes to reduce API calls
   - Returns array of photo URLs: `['url1', 'url2', ...]`
   - Returns empty array `[]` on error (graceful degradation)

2. **getRandomPhoto(photos)** function:
   - Takes array of photo URLs
   - Selects random index: `Math.floor(Math.random() * photos.length)`
   - Returns random photo URL or `null` if array is empty

**Location:** `services/admin-photos-service.js`

#### 3c. Send Group Introductions with Photos
Mandy sends two separate messages, one for each group with their photo.

**Code Flow:**
```javascript
// Group 1
if (group1Photo) {
  await this.client.sendMediaMessage(chatId, `**${matchedGroups.group1.groupName}**`, group1Photo);
} else {
  await this.client.sendMessage(chatId, `**${matchedGroups.group1.groupName}**`);
}

// Group 2
if (group2Photo) {
  await this.client.sendMediaMessage(chatId, `**${matchedGroups.group2.groupName}**`, group2Photo);
} else {
  await this.client.sendMessage(chatId, `**${matchedGroups.group2.groupName}**`);
}
```

**How `sendMediaMessage()` works:**
1. Takes `chatId`, `content` (text), and `mediaUrl` (image URL)
2. Creates media object:
   ```javascript
   {
     url: mediaUrl,
     contentType: 'image/png',
     width: options.width,  // optional
     height: options.height // optional
   }
   ```
3. Sends POST request to A1Zap API with:
   - `chatId`
   - `content` (message text)
   - `media` (image object)
   - `metadata` (source info)

**Error Handling:**
- If photo send fails → falls back to text-only message
- Errors are caught and logged, but don't stop the flow

**Location:** `core/BaseA1ZapClient.js` → `sendMediaMessage()`

---

### Step 4: Welcome Game (Fourth Message)

Mandy sends the welcome mini app with a prize message.

**Code Flow:**
```javascript
const welcomeMiniAppConfig = config.agents.mandy.miniApps?.welcomeMiniApp;
const appId = welcomeMiniAppConfig.id; // 'xs76ck6ada5ygz39jvgh85dmnd82dvw0'

// Create mini app session
const session = await this.createMiniAppSession(chatId, appId, sessionName);

// Create rich content block
const richContentBlock = {
  type: 'micro_app_instance_card',
  data: {
    appId: appId,
    instanceId: session.instanceId,
    handle: 'welcome-game',
    name: 'Welcome Game',
    shareCode: session.shareCode
  }
};

// Send message with mini app
const gameMessage = `Win this and each group wins $50 dollars for free food on us! 🎮💰`;
await this.client.sendMessage(chatId, gameMessage, [richContentBlock]);
```

**What happens:**
1. Gets welcome mini app config from `config.js`
2. Creates a new mini app session (unique instance for this chat)
3. Creates a rich content block with type `micro_app_instance_card`
4. Sends message with:
   - Text: "Win this and each group wins $50 dollars for free food on us! 🎮💰"
   - Rich content block: Mini app card that users can tap to play

**Location:** `webhooks/mandy-webhook.js` → `handleChatStarted()`

---

## Complete Message Sequence

```
1. Welcome Message
   ↓
2. Group 1 Introduction (with photo)
   ↓
3. Group 2 Introduction (with photo)
   ↓
4. Welcome Game (with $50 prize message)
```

---

## Data Flow Diagram

```
chat.started event
    ↓
handleChatStarted(chatId)
    ↓
┌─────────────────────────────────────┐
│ 1. Send Welcome Message             │
│    getWelcomeMessage()               │
│    sendMessage()                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Get Matched Groups               │
│    getMatchedGroupsForChat(chatId)   │
│    → { group1, group2 }             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Fetch Photos                     │
│    adminPhotosService.getPhotos()    │
│    → [photo1, photo2, ...]          │
│    getRandomPhoto() → group1Photo    │
│    getRandomPhoto() → group2Photo    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Send Group Introductions         │
│    sendMediaMessage(group1, photo1) │
│    sendMediaMessage(group2, photo2) │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. Send Welcome Game                │
│    createMiniAppSession()           │
│    sendMessage(game + mini app)     │
└─────────────────────────────────────┘
```

---

## API Endpoints

### `/admin/api/photos`
**Purpose:** Serves list of photo URLs for group introductions

**Authentication:** Basic Auth (admin / a1zapped!)

**Request:**
```http
GET /admin/api/photos
Authorization: Basic YWRtaW46YTF6YXBwZWQh
```

**Response:**
```json
{
  "success": true,
  "photos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
    ...
  ]
}
```

**Configuration:**
- Photos are stored in `MANDY_PHOTOS` environment variable
- Format: Comma-separated URLs: `url1,url2,url3`
- If not configured, returns empty array

**Location:** `server.js` → `/admin/api/photos` endpoint

---

## Error Handling

The system is designed to be resilient:

1. **Photos API fails:**
   - `adminPhotosService.getPhotos()` returns `[]`
   - Group introductions sent without photos (text-only)

2. **Photo send fails:**
   - Caught in try-catch block
   - Falls back to `sendMessage()` (text-only)
   - Flow continues

3. **Matched groups not found:**
   - `getMatchedGroupsForChat()` returns `null`
   - Logs warning, skips group introduction
   - Welcome game still sent

4. **Mini app fails:**
   - Caught in try-catch block
   - Logs error
   - Webhook doesn't crash

**All errors are logged but don't stop the welcome flow.**

---

## Key Files

| File | Purpose |
|------|---------|
| `webhooks/mandy-webhook.js` | Main webhook handler, orchestrates the flow |
| `services/group-profile-storage.js` | `getMatchedGroupsForChat()` function |
| `services/admin-photos-service.js` | Photo fetching and random selection |
| `core/BaseA1ZapClient.js` | `sendMediaMessage()` function |
| `server.js` | `/admin/api/photos` endpoint |
| `config.js` | Welcome mini app configuration |

---

## Configuration

### Environment Variables

- `MANDY_PHOTOS`: Comma-separated photo URLs
  - Example: `https://example.com/photo1.jpg,https://example.com/photo2.jpg`
  
- `MANDY_ADMIN_USER`: Admin username (default: `admin`)
- `MANDY_ADMIN_PASSWORD`: Admin password (default: `a1zapped!`)

### Config File

`config.js` → `agents.mandy.miniApps.welcomeMiniApp`:
```javascript
{
  id: 'xs76ck6ada5ygz39jvgh85dmnd82dvw0',
  handle: 'welcome-game',
  name: 'Welcome Game'
}
```

---

## Testing

Run the test suite:
```bash
node test-welcome-flow-static.js      # Static code analysis
node test-welcome-flow-detailed.js    # Detailed flow analysis
```

Both tests verify:
- ✅ Function signatures
- ✅ Error handling
- ✅ Data flow
- ✅ Code structure
- ✅ Message sequence

---

## Summary

The welcome flow is a **4-message sequence** that:
1. Welcomes users with personalized message
2. Introduces both matched groups with random photos
3. Sends welcome game with $50 prize incentive

All components are **error-resilient** and **gracefully degrade** if photos or groups aren't available. The flow is **fully automated** and triggers on `chat.started` events.
