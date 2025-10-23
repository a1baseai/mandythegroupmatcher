# ⚡ Smart Social Links - Quick Start

## What Is It?

Your BrandyEats bot now **automatically sends TikTok videos** when it mentions restaurants from your CSV file!

## How to Test (30 seconds)

### Option 1: WhatsApp (Easiest)
```
1. Open WhatsApp
2. Message your BrandyEats bot: "Tell me about Rau Má Mix"
3. Watch for TWO messages:
   - First: Text response from Claude
   - Second: TikTok video embed (automatic!)
```

### Option 2: Test Script
```bash
node test-social-links.js
```

### Option 3: Specific Query Test
Try asking about restaurants in the CSV:
- "Where should I eat in Saigon?"
- "Tell me about Ocean Palace"
- "What's Rau Má Mix like?"

---

## What You'll See

**Message 1 (Text):**
```
Based on the data, Rau Má Mix is a unique spot in Saigon with a matcha-like 
Vietnamese drink that's really good!
```

**Message 2 (Auto - Rich Content):**
```
🎥 Here's a video about Rau Má Mix!
[Embedded TikTok video player]
```

---

## How It Works

1. User asks question
2. Bot analyzes CSV and responds with text
3. **NEW:** Bot re-reads its own response
4. **NEW:** Claude AI identifies which restaurants were mentioned
5. **NEW:** Bot automatically sends TikTok videos as follow-up

---

## Files Created

✅ `services/social-link-extractor.js` - Smart extraction service  
✅ `webhooks/brandoneats-webhook.js` - Updated with auto-detection  
✅ `test-social-links.js` - Test suite  
✅ `SMART_SOCIAL_LINKS.md` - Full documentation  
✅ `SOCIAL_LINKS_QUICK_START.md` - This file  

---

## Console Output (Success)

```
🔍 Checking for relevant social media links...
🤖 Using Claude to detect mentioned restaurants...
✅ Claude identified 1 mentioned restaurants: [ 'Rau Má Mix' ]
✅ Found 1 relevant social links
📹 Found 1 relevant TikTok links, sending follow-up message...
✅ Social media links sent successfully
```

---

## Testing Commands

```bash
# Run all tests
node test-social-links.js

# Test specific functionality
node test-social-links.js load      # CSV loading
node test-social-links.js extract   # Extraction test
node test-social-links.js multiple  # Multiple restaurants

# Start server
npm start
```

---

## Key Features

✅ **Intelligent** - Uses Claude AI to detect mentions  
✅ **Automatic** - No user action required  
✅ **Relevant** - Only sends videos actually mentioned  
✅ **Smart Matching** - Handles variations and misspellings  
✅ **Limited** - Max 5 videos to avoid spam  
✅ **Fault-Tolerant** - Errors don't break main response  

---

## Configuration

### Change Maximum Videos
`services/social-link-extractor.js` line 150:
```javascript
const limitedLinks = relevantLinks.slice(0, 5); // Change to 3, 10, etc.
```

### Change Follow-up Message
`webhooks/brandoneats-webhook.js` lines 229-231:
```javascript
const socialMessage = '🍕 Check out these videos!'; // Your custom message
```

---

## Troubleshooting

**No videos appearing?**
1. Check CSV file exists: `files/brandoneats.csv`
2. Verify TikTok links in CSV start with `https://`
3. Run test: `node test-social-links.js`
4. Check console logs for errors

**Wrong videos appearing?**
1. Verify restaurant names in CSV
2. Check console for Claude's detection results
3. Test with: `node test-social-links.js extract`

---

## Try These Queries

Ask your bot:
- "What's good to eat in Saigon?"
- "Tell me about Rau Má Mix"
- "Where is Ocean Palace?"
- "What should I try at Ho Thi Ky Night Market?"

Each should trigger automatic TikTok videos! 🎥

---

**Ready?** Ask your bot about a restaurant and watch the automatic video follow-up! ✨

