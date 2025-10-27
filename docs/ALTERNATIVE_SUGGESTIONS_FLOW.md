# Alternative Suggestions - Flow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ASKS QUESTION                                              │
│ "I want restaurants over $100"                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: OFF-TOPIC TRIAGE (webhook)                            │
│ Is this about food/restaurants?                                 │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
             NO   │                           │ YES
                  ▼                           ▼
          ┌───────────────┐         ┌────────────────────────┐
          │ Send Boundary │         │ Generate Full Response │
          │ Message       │         │ with Claude            │
          │ "I help with  │         └──────────┬─────────────┘
          │  food reviews"│                    │
          └───────────────┘                    ▼
                                    ┌────────────────────────────┐
                                    │ BOT RESPONSE:              │
                                    │ "Brandon doesn't cover     │
                                    │  high-end dining, he       │
                                    │  focuses on street food..."│
                                    └──────────┬─────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2A: RESTAURANT DETECTION (webhook)                        │
│ Does response mention specific places?                          │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
             NO   │                           │ YES
                  ▼                           ▼
          ┌───────────────┐         ┌────────────────────────┐
          │ Skip Social   │         │ Continue to Stage 2B   │
          │ Links         │         └──────────┬─────────────┘
          └───────────────┘                    │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2B: SMART MATCHING (social-link-extractor) 🆕             │
│ Claude analyzes: Are restaurants DIRECTLY mentioned?            │
│                  OR should we suggest alternatives?             │
└────┬──────────────────────────┬─────────────────────────────┬──┘
     │                          │                             │
     │ Direct Mentions          │ No Mentions                 │
     │ suggestAlternatives:     │ suggestAlternatives:        │
     │ false                    │ true                        │
     ▼                          ▼                             │
┌────────────────────┐   ┌──────────────────────────────┐   │
│ DIRECT MATCH       │   │ STAGE 2C: ALTERNATIVES 🆕     │   │
│ Return:            │   │ Find 2-3 closest matches      │   │
│ - Phở Bát Đàn     │   │ Generate context message      │   │
│ - Banh Mi 25       │   └──────────┬───────────────────┘   │
└────────┬───────────┘              │                        │
         │                          ▼                        │
         │            ┌────────────────────────────────┐    │
         │            │ Alternative Results:           │    │
         │            │ contextMessage: "While Brandon │    │
         │            │   doesn't cover high-end fine  │    │
         │            │   dining, these are his most   │    │
         │            │   elevated experiences..."     │    │
         │            │ alternatives: [                │    │
         │            │   Secret Garden District,      │    │
         │            │   Cuc Gach Restaurant,         │    │
         │            │   Vỹ Dạ Xưa                   │    │
         │            │ ]                              │    │
         │            └──────────┬─────────────────────┘    │
         │                       │                          │
         ▼                       ▼                          │
┌────────────────────────────────────────────────────┐     │
│ SEND FOLLOW-UP MESSAGE                             │     │
├────────────────────────────────────────────────────┤     │
│ DIRECT MATCH:                                      │     │
│ "🎥 Here are 2 videos about these places!"        │     │
│ [TikTok embeds]                                    │     │
│                                                    │     │
│ ALTERNATIVE SUGGESTION: 🆕                         │     │
│ "💡 While Brandon doesn't cover high-end fine     │     │
│  dining, these are his most elevated experiences" │     │
│ "🎥 Here are 3 videos:"                           │     │
│ [TikTok embeds]                                    │     │
└────────────────────────────────────────────────────┘     │
                                                           │
                    No Mentions + No Alternatives          │
                                                           ▼
                                                   ┌───────────────┐
                                                   │ Skip Social   │
                                                   │ Links         │
                                                   └───────────────┘
```

## Key Decision Points

### 🔍 Stage 2B Analysis (NEW!)

Claude receives:
```
RESPONSE: "Brandon doesn't cover high-end fine dining..."
RESTAURANTS: [List of 91 restaurants from CSV]

Task: 
1. Which restaurants are MENTIONED? 
2. Should we suggest ALTERNATIVES?
```

Claude returns:
```
MENTIONED: NONE
SUGGEST_ALTERNATIVES: YES
```

### 💡 Stage 2C Alternative Finding (NEW!)

Triggered when: `mentionedNames.length === 0 && suggestAlternatives === true`

Claude receives:
```
RESPONSE: "Brandon doesn't cover high-end fine dining..."
AVAILABLE: [First 50 restaurants with type/city]

Task: Find 2-3 closest matches and explain WHY
```

Claude returns:
```
CONTEXT: While Brandon doesn't cover high-end fine dining, these 
         are his most elevated restaurant experiences
ALTERNATIVES:
Secret Garden District Saigon
Cuc Gach Restaurant
Nhà hàng cafe Vỹ Dạ Xưa
```

## Example Scenarios

### Scenario 1: Direct Match ✅
**User:** "Tell me about Phở Bát Đàn"  
**Response:** "Great pho spot! Brandon loved it..."  
**Stage 2B:** `mentionedNames: ["Phở Bát Đàn"]`, `suggestAlternatives: false`  
**Result:** Send 1 TikTok video about Phở Bát Đàn

### Scenario 2: Alternative Suggestion 🆕
**User:** "I want $100+ restaurants"  
**Response:** "Brandon doesn't cover high-end dining..."  
**Stage 2B:** `mentionedNames: []`, `suggestAlternatives: true`  
**Stage 2C:** Finds 3 closest alternatives with context  
**Result:** Send 3 TikTok videos with explanatory message

### Scenario 3: Generic Response ❌
**User:** "Hello"  
**Response:** "Hey! What would you like to know?"  
**Stage 2A:** Does not mention specific places → Skip  
**Result:** No social links sent

### Scenario 4: Off-Topic ❌
**User:** "What's the weather?"  
**Stage 1:** Not food-related → Block  
**Response:** "I help with food reviews. What restaurants are you interested in?"  
**Result:** No social links sent

## Performance Optimization

- **Stage 1:** Fast keyword check (saves full Claude call)
- **Stage 2A:** Simple yes/no check (saves extraction work)
- **Stage 2B:** Single Claude call gets both pieces of info
- **Stage 2C:** Only processes first 50 restaurants (speed)
- **Deduplication:** Removes duplicate URLs at the end

## Success Metrics

✅ **Before Implementation:**
- User asks for "$100+ restaurants"
- Response says "Brandon doesn't cover that"
- **0 social links sent**

✅ **After Implementation:**
- User asks for "$100+ restaurants"
- Response says "Brandon doesn't cover that"
- **3 relevant alternatives sent with context**
- User gets: "These are his most elevated experiences"

Result: **Better user experience** even when exact match isn't available!

