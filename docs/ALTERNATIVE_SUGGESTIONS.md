# Alternative Suggestions Feature

## Overview

This feature enhances the social link filtering system to provide **contextual alternative suggestions** when users ask for something Brandon doesn't cover in his reviews.

## The Problem

Previously, when a user asked for something outside Brandon's coverage (e.g., "I want $100+ high-end restaurants" when Brandon only covers street food), the bot would:

1. ✅ Correctly respond saying "Brandon doesn't cover that"
2. ❌ **But then send NO social links at all**

This felt incomplete - even though Brandon doesn't have exactly what they want, there might be **relevant alternatives** worth sharing.

## The Solution

Now, when the bot says "Brandon doesn't cover X," it intelligently suggests the **closest alternatives** with context explaining why they might still be relevant.

### Example Flow

**User:** "Give me restaurants over $100"

**Bot Response:**
```
Brandy Eats Test: Looking through Brandon's reviews, he doesn't actually cover 
high-end fine dining in that price range. His focus is on street food gems and 
local spots where you get amazing food without breaking the bank.
```

**Follow-up with Social Links:**
```
💡 While Brandon doesn't cover high-end fine dining, these are his most elevated 
and atmospheric restaurant experiences that offer excellent quality in a more 
refined setting.

🎥 Here are 3 videos:
```

Then sends TikTok embeds for:
- Secret Garden District Saigon
- Cuc Gach Restaurant  
- Nhà hàng cafe Vỹ Dạ Xưa

## How It Works

### Three-Stage Intelligent Filtering

#### Stage 1: Off-Topic Triage (webhook)
- Blocks completely irrelevant questions (weather, sports, etc.)
- Saves API costs by not processing off-topic requests

#### Stage 2A: Restaurant Detection (webhook)
- Quick check: Does the response mention specific places?
- Passes both direct mentions AND limitation responses to Stage 2B

#### Stage 2B: Smart Matching (social-link-extractor) - **NEW!**
- Uses Claude AI to analyze the response
- Determines if restaurants are **directly recommended** OR if **alternatives should be suggested**
- Two detection outputs:
  1. `mentionedNames`: Array of specific restaurants discussed
  2. `suggestAlternatives`: Boolean - should we suggest alternatives?

#### Stage 2C: Alternative Suggestion (social-link-extractor) - **NEW!**
- Only triggers when `suggestAlternatives = true` and `mentionedNames` is empty
- Uses Claude to find 2-3 closest matching alternatives from the dataset
- Generates contextual message explaining WHY these alternatives are relevant
- Examples:
  - "These are Brandon's most upscale dining spots (though still under $50)"
  - "While Brandon doesn't cover Italian, here are his most atmospheric restaurants"

## Implementation Details

### Modified Files

1. **`services/social-link-extractor.js`**
   - Modified `detectMentionedRestaurants()` to return both `mentionedNames` and `suggestAlternatives` flag
   - Added new `findAlternativeSuggestions()` method
   - Updated `extractRelevantSocialLinks()` to handle alternative suggestions

2. **`webhooks/brandoneats-webhook.js`**
   - Modified social link message formatting to use `contextMessage` when showing alternatives
   - Distinguishes between direct matches and alternative suggestions

### Key Functions

#### `detectMentionedRestaurants(responseText, allLinks)`
Returns: `{ mentionedNames: [], suggestAlternatives: boolean }`

Uses Claude to analyze if:
- Specific restaurants are mentioned (returns their names)
- Response indicates "I don't have what you want" but alternatives would help (sets flag to true)

#### `findAlternativeSuggestions(responseText, allLinks)`
Returns: `{ alternatives: [], contextMessage: string }`

When triggered, uses Claude to:
1. Understand what the user originally wanted
2. Find 2-3 closest matches from available data
3. Generate a context message explaining the relevance

Example output:
```javascript
{
  alternatives: [
    { name: "Secret Garden", url: "...", type: "Eat", city: "Saigon" },
    { name: "Cuc Gach", url: "...", type: "Eat", city: "Saigon" }
  ],
  contextMessage: "These are Brandon's most elevated restaurant experiences"
}
```

## Testing

Run the test suite:
```bash
node tests/test-alternative-suggestions.js
```

### Test Cases

1. ✅ High-end restaurant request → Suggests upscale alternatives with context
2. ✅ Specific cuisine not covered → Suggests similar cuisine alternatives  
3. ✅ Direct recommendation → Works normally, no alternatives
4. ✅ Generic greeting → Correctly does not trigger alternatives

## Benefits

### For Users
- ✨ Better experience - still get helpful suggestions even when exact match isn't available
- 🎯 Context explains WHY these alternatives are being shown
- 🎥 Relevant videos help users make informed decisions

### For the System
- 🧠 More intelligent and helpful responses
- 💰 Efficient - only triggers when truly beneficial
- 🎨 Maintains strict filtering for other cases (greetings, clarifications)

## Edge Cases Handled

✅ **User asks for something completely unavailable** → Suggests closest alternatives  
✅ **Direct restaurant recommendation** → Works normally, no alternatives triggered  
✅ **Generic greeting** → No alternatives (correctly filtered out)  
✅ **Multiple alternatives** → Limited to max 3 to avoid overwhelming  
✅ **Context message missing** → Falls back to generic message  

## Configuration

The feature is **automatically enabled** and requires no configuration. It intelligently decides when to trigger based on response content.

### Limits

- Maximum 3 alternative suggestions (prevents overwhelming users)
- Only considers first 50 restaurants for alternative matching (performance optimization)
- Context message generation uses temperature 0.4 for creativity while maintaining accuracy

## Future Enhancements

Possible improvements:
- Allow configuration of max alternatives (currently hardcoded to 3)
- Add user preference learning (remember what types of alternatives worked)
- Support for alternative suggestions in multiple categories (price, cuisine, location)
- A/B testing to measure user engagement with alternatives vs no alternatives

## Related Documentation

- [INTELLIGENT_FILTERING.md](./INTELLIGENT_FILTERING.md) - Overall filtering system
- [VIDEO_DEDUPLICATION_FIX.md](./VIDEO_DEDUPLICATION_FIX.md) - Video deduplication logic
- [tests/test-alternative-suggestions.js](./tests/test-alternative-suggestions.js) - Test suite

