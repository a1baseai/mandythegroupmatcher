# Intelligent Filtering System 🎯

## Overview

The Brandon Eats agent implements a sophisticated two-step filtering system that ensures users only receive relevant responses and social media links. This system is designed to:

- **Save API costs** by avoiding unnecessary processing
- **Improve user experience** by reducing noise and irrelevant content
- **Set clear boundaries** about the bot's purpose and capabilities
- **Assume user intent** while still filtering out completely off-topic queries

---

## 🔄 How It Works

### Step 1: Off-Topic Question Triage

**Location:** `webhooks/brandoneats-webhook.js` (lines 173-243)

Before generating an expensive full response, the system performs a quick AI-based check to determine if the question is even relevant to food and restaurants.

#### Triage Logic

```javascript
// Question passes through Claude with YES/NO classification
const isOnTopic = await checkIfFoodRelated(userMessage);

if (!isOnTopic) {
  // Send boundary response and return early
  sendMessage("Hey! I'm here to help with Brandon's food reviews...");
  return; // No full response generation, no social links
}
```

#### What Passes Through (✓)

The triage is **intentionally permissive** and assumes user intent:

- ✓ "Where should I visit in north Vietnam?" (travel implies dining)
- ✓ "Best places in Hanoi?" (places implies restaurants)
- ✓ "What should I try first?" (implies food recommendations)
- ✓ "Tell me about District 1" (location implies food spots)
- ✓ Any food/restaurant/cuisine questions

#### What Gets Blocked (✗)

Only **clearly off-topic** questions are filtered out:

- ✗ "What color is the sky?" (general knowledge)
- ✗ "What's the weather like?" (weather)
- ✗ "Who won the game?" (sports)
- ✗ "How do I code in Python?" (technical support)
- ✗ "Tell me a joke" (entertainment)

#### Design Philosophy

> **"Assume the user wants to talk about food and places."**

The system gives users the benefit of the doubt. If a question could reasonably be interpreted as food-related in any context, it passes through. This prevents frustrating false positives where legitimate questions get blocked.

#### Benefits

1. **Cost Savings**: Skips expensive Claude generation for irrelevant queries
2. **Clear Boundaries**: Politely educates users about the bot's purpose
3. **Fast Responses**: Boundary messages are instant (no AI generation needed)
4. **No Wasted Social Link Searches**: Off-topic queries never trigger social link extraction

---

### Step 2: Smart Social Media Link Filtering

**Location:** `webhooks/brandoneats-webhook.js` (lines 282-348) + `services/social-link-extractor.js`

After generating a response, the system intelligently determines if social media links should be sent as a follow-up message. This is a **two-stage process**:

#### Stage 2A: Response-Level Check (Webhook)

```javascript
// Quick check: Does this response discuss specific restaurants?
const hasSpecificRestaurants = await checkIfSpecificPlacesMentioned(response);

if (!hasSpecificRestaurants) {
  console.log('No specific restaurants mentioned - skipping social links');
  return; // Don't even try to extract links
}
```

**Prevents links for:**
- ❌ Generic responses: "I can help you with that!"
- ❌ Clarification questions: "What would you like to know about?"
- ❌ Greetings: "Hey! How can I assist you today?"
- ❌ Generic statements: "Brandon has reviewed many places in Vietnam"

**Allows links for:**
- ✅ Specific recommendations: "You should try Pho 24 in District 1"
- ✅ Restaurant discussions: "Brandon loved the banh mi at Banh Mi 25"
- ✅ Place listings: "Here are the top 3 cafes: Highlands Coffee, The Coffee House..."

#### Stage 2B: Restaurant-Level Matching (Service)

**Location:** `services/social-link-extractor.js`

If Stage 2A passes, the system then uses AI to match mentioned restaurants to the CSV database:

```javascript
// AI analyzes which restaurants from CSV are ACTUALLY DISCUSSED
const mentionedRestaurants = await detectMentionedRestaurants(response, csvData);

// Only restaurants that are KEY SUBJECTS of the response
// Returns: ['Pho 24', 'Banh Mi 25']
```

**Strict Matching Rules:**

The AI is trained to only include restaurants that are:
1. **Specifically named** in the response
2. **Key subjects** of the discussion (not passing mentions)
3. **Meaningfully discussed** (recommendations, descriptions, etc.)

**Examples:**

| Response | Detected Restaurants | Social Links Sent? |
|----------|---------------------|-------------------|
| "You should try Pho 24 and Banh Mi 25" | Pho 24, Banh Mi 25 | ✅ Yes (2 links) |
| "Brandon loved the coffee at Highlands" | Highlands Coffee | ✅ Yes (1 link) |
| "Brandon has reviewed many places" | (empty) | ❌ No (generic) |
| "What would you like to know?" | (empty) | ❌ No (clarification) |
| "I can help with restaurant info" | (empty) | ❌ No (no specific places) |

#### AI Prompt Design

The AI receives strict instructions with examples:

```
STRICT Rules:
- ONLY return names that are specifically mentioned, discussed, or recommended
- The restaurant/place must be a key subject of the response
- DO NOT include names in generic statements
- If response is just a greeting/clarification, return "NONE"

Examples:
✓ "Brandon loved the pho at Pho 24" → Include "Pho 24"
✗ "Brandon has reviewed many places" → Return "NONE" (generic)
✗ "What restaurants do you want to know about?" → Return "NONE" (clarification)
```

---

## 🎯 Complete Flow Diagram

```
User Message
    ↓
┌───────────────────────────────────┐
│ STEP 1: Off-Topic Triage         │
│ (Is this about food/restaurants?) │
└───────────────┬───────────────────┘
                │
         ┌──────┴──────┐
         │             │
    NO ✗│             │✓ YES
         │             │
         ↓             ↓
   Boundary      Generate Full
   Response      Response with AI
   (return)            │
                       ↓
                 Send Response
                       │
                       ↓
         ┌─────────────────────────┐
         │ STEP 2A: Quick Check    │
         │ (Specific places named?)│
         └────────┬────────────────┘
                  │
           ┌──────┴──────┐
           │             │
      NO ✗ │             │✓ YES
           │             │
           ↓             ↓
      Skip Links   ┌──────────────────────┐
      (return)     │ STEP 2B: AI Matching │
                   │ (Match to CSV data)  │
                   └──────┬───────────────┘
                          │
                   ┌──────┴──────┐
                   │             │
              Found│             │Not Found
                   │             │
                   ↓             ↓
            Send Social    Skip Links
            Media Links    (return)
```

---

## 📊 Example Scenarios

### Scenario 1: Off-Topic Question

**Input:** "What's the weather in Hanoi?"

**Flow:**
1. ❌ **Step 1 Triage:** Detected as off-topic
2. 🤖 **Response:** "Hey! I'm here to help with Brandon's food reviews and restaurant recommendations. What would you like to know about places Brandon has tried? 🍕"
3. **Social Links:** None (early return)
4. **API Calls:** 1 (just the triage check)

---

### Scenario 2: Travel Question (On-Topic)

**Input:** "What's the first place I should visit in north Vietnam?"

**Flow:**
1. ✅ **Step 1 Triage:** Passes (implies food/dining recommendations)
2. 🤖 **Full Response Generated:** "Based on Brandon's reviews, I'd recommend starting with Pho Thin in Hanoi! It's famous for its stir-fried pho..."
3. ✅ **Step 2A:** Response mentions specific place "Pho Thin"
4. ✅ **Step 2B:** AI matches "Pho Thin" to CSV entry
5. 🎥 **Social Links Sent:** TikTok link for Pho Thin
6. **API Calls:** 4 (triage, full response, restaurant check, AI matching)

---

### Scenario 3: Generic Food Question

**Input:** "What can you help me with?"

**Flow:**
1. ✅ **Step 1 Triage:** Passes (could be about food)
2. 🤖 **Full Response Generated:** "I can help you discover great restaurants and food spots that Brandon has reviewed! Ask me about specific places, cuisines, or areas."
3. ❌ **Step 2A:** Response doesn't mention specific restaurants
4. **Social Links:** None (early return at Stage 2A)
5. **API Calls:** 3 (triage, full response, restaurant check)

---

### Scenario 4: Specific Restaurant Question

**Input:** "Tell me about Pho 24 and Banh Mi 25"

**Flow:**
1. ✅ **Step 1 Triage:** Passes (about specific restaurants)
2. 🤖 **Full Response Generated:** "Both are great spots! Pho 24 is known for... Banh Mi 25 offers..."
3. ✅ **Step 2A:** Response discusses specific restaurants
4. ✅ **Step 2B:** AI matches both restaurants to CSV
5. 🎥 **Social Links Sent:** TikTok links for Pho 24 and Banh Mi 25
6. **API Calls:** 4 (triage, full response, restaurant check, AI matching)

---

## 🛠️ Configuration

### Adjusting Triage Sensitivity

The triage uses Claude with **low temperature (0.1)** for consistent classification:

```javascript
// In brandoneats-webhook.js
const topicCheck = await claudeService.generateText(topicCheckPrompt, {
  temperature: 0.1,  // Lower = more consistent
  maxTokens: 10      // Just need "YES" or "NO"
});
```

**To make triage more strict:**
- Modify the prompt in `webhooks/brandoneats-webhook.js` (line 190)
- Add more explicit exclusion examples
- Increase temperature slightly (0.2-0.3) for less predictable but potentially more nuanced decisions

**To make triage more permissive:**
- Already at maximum permissiveness by design
- Consider removing triage entirely if all questions should be answered

---

### Adjusting Social Link Filtering

The social link detection uses Claude with **low temperature (0.3)** for consistent extraction:

```javascript
// In social-link-extractor.js
const claudeResponse = await claudeService.generateText(analysisPrompt, {
  temperature: 0.3,  // Lower = more consistent
  maxTokens: 500     // Enough for restaurant names list
});
```

**To make filtering more strict (fewer links):**
- Modify the prompt in `services/social-link-extractor.js` (line 122)
- Add more examples of what NOT to include
- Increase the threshold for "key subject"

**To make filtering more permissive (more links):**
- Modify the prompt to allow "passing mentions"
- Remove the "key subject" requirement
- Consider skipping Stage 2A check entirely

---

## 📈 Performance Impact

### API Call Reduction

**Before Filtering:**
- Every message: 3+ Claude API calls
- Off-topic questions get full processing
- Generic responses trigger social link extraction

**After Filtering:**
- Off-topic questions: 1 API call (triage only)
- Generic responses: 3 API calls (triage, response, restaurant check)
- Specific restaurant questions: 4 API calls (full flow)

**Estimated Savings:**
- ~60-70% reduction in API calls for off-topic/generic queries
- ~40% reduction in total API costs (depends on query mix)

### Response Time

| Scenario | API Calls | Avg Response Time |
|----------|-----------|-------------------|
| Off-topic | 1 | ~1-2 seconds |
| Generic food question | 3 | ~3-5 seconds |
| Specific restaurant query | 4 | ~5-8 seconds |

---

## 🧪 Testing

### Test Off-Topic Triage

```bash
# Should get boundary response
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"id": "test-123"},
    "message": {"content": "What color is the sky?"}
  }'
```

### Test Social Link Filtering

```bash
# Should get response but NO social links
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"id": "test-123"},
    "message": {"content": "What can you help me with?"}
  }'

# Should get response AND social links
curl -X POST http://localhost:3000/webhook/brandoneats \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"id": "test-123"},
    "message": {"content": "Tell me about Pho 24"}
  }'
```

---

## 🔍 Debugging

### Enable Detailed Logging

The system already logs each step:

```
🔍 Checking if question is food/restaurant related...
✅ Question is on-topic - proceeding with full response
🔍 Checking if response discusses specific restaurants...
✅ Response discusses specific restaurants - checking for social links...
🤖 Using Claude to detect mentioned restaurants...
✅ Claude identified 2 mentioned restaurants: ['Pho 24', 'Banh Mi 25']
📹 Found 2 relevant TikTok links, sending follow-up message...
✅ Social media links sent successfully
```

### Common Issues

**Social links sent for generic responses:**
- Check Stage 2A prompt (line 310 in webhook)
- Verify AI is correctly classifying generic vs. specific

**Legitimate questions getting blocked:**
- Check triage prompt (line 175 in webhook)
- Ensure prompt is permissive enough
- Review logs to see how question was classified

**Social links not sent for specific restaurants:**
- Check if restaurants exist in CSV (`files/brandoneats.csv`)
- Verify AI matching in Stage 2B (check logs for "Claude identified X restaurants")
- Ensure CSV has valid TikTok links

---

## 🎓 Best Practices

### 1. Keep Triage Permissive
- Assume user intent whenever possible
- Only block clearly off-topic questions
- Better to answer than to incorrectly block

### 2. Be Strict with Social Links
- Only send links when truly relevant
- Users prefer fewer, more relevant links over many irrelevant ones
- Quality over quantity

### 3. Monitor Logs
- Watch for false positives/negatives
- Adjust prompts based on real usage patterns
- Track API call distribution

### 4. Test Edge Cases
- Multi-language queries
- Ambiguous questions
- Mixed topics (e.g., "weather and food in Hanoi")

---

## 🚀 Future Enhancements

Potential improvements to consider:

1. **Confidence Scores**: Return confidence levels instead of binary YES/NO
2. **Context Awareness**: Consider conversation history in triage
3. **Custom Thresholds**: Per-user or per-chat filtering sensitivity
4. **Learning System**: Track user feedback to improve classification
5. **Multi-Language**: Enhanced support for Vietnamese queries
6. **Caching**: Cache triage results for similar questions

---

## 📚 Related Documentation

- **Main README**: `README.md` - Overall system overview
- **Agent Config**: `agents/brandoneats-agent.js` - System prompt configuration
- **Webhook Code**: `webhooks/brandoneats-webhook.js` - Full implementation
- **Social Extractor**: `services/social-link-extractor.js` - Link matching logic
- **Rich Content**: `RICH_CONTENT_GUIDE.md` - Social media embed formats

---

**Built with intelligence, optimized for relevance** 🎯

