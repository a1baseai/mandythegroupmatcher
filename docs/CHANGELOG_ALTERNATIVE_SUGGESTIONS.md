# Changelog: Alternative Suggestions Feature

## Date: October 25, 2025

## Summary

Added intelligent alternative suggestions feature to the Brandon Eats bot. When users ask for something Brandon doesn't cover (e.g., "$100+ restaurants" when he only reviews street food), the bot now suggests relevant alternatives with context explaining why they might still be helpful.

## Problem Solved

**Before:**
- User: "I want restaurants over $100"
- Bot: "Brandon doesn't cover high-end dining, he focuses on street food..."
- **No social links sent** ❌

**After:**
- User: "I want restaurants over $100"
- Bot: "Brandon doesn't cover high-end dining, he focuses on street food..."
- Follow-up: "💡 While Brandon doesn't cover high-end fine dining, these are his most elevated and atmospheric restaurant experiences..."
- **Sends 2-3 relevant TikTok videos** ✅

## Changes Made

### 1. Modified Files

#### `services/social-link-extractor.js`
**Changes:**
- Modified `detectMentionedRestaurants()` to return both `mentionedNames` array and `suggestAlternatives` boolean
- Added new `findAlternativeSuggestions()` method to intelligently find 2-3 closest alternatives
- Updated `extractRelevantSocialLinks()` to handle alternative suggestion flow
- Added `contextMessage` field to alternative link objects

**Key Logic:**
```javascript
// Returns: { mentionedNames: [], suggestAlternatives: boolean }
const { mentionedNames, suggestAlternatives } = await detectMentionedRestaurants();

// If no direct mentions but should suggest alternatives
if (mentionedNames.length === 0 && suggestAlternatives) {
  const { alternatives, contextMessage } = await findAlternativeSuggestions();
  // Returns alternatives with context explaining relevance
}
```

#### `webhooks/brandoneats-webhook.js`
**Changes:**
- Updated social link message formatting to detect and use `contextMessage` when present
- Distinguishes between direct matches and alternative suggestions
- Formats alternative suggestions with 💡 emoji and explanatory context

**Key Logic:**
```javascript
if (isAlternativeSuggestion) {
  // Use context to explain why alternatives are shown
  socialMessage = `💡 ${contextMsg}\n\n🎥 Here are ${count} videos:`;
} else {
  // Standard message for direct matches
  socialMessage = `🎥 Here are ${count} videos about these places!`;
}
```

### 2. New Files

#### `tests/test-alternative-suggestions.js`
Complete test suite with 4 test cases:
1. ✅ High-end restaurant request → Suggests upscale alternatives
2. ✅ Specific cuisine not covered → Suggests similar alternatives
3. ✅ Direct recommendation → Works normally (no alternatives)
4. ✅ Generic greeting → Correctly skips alternatives

#### `ALTERNATIVE_SUGGESTIONS.md`
Comprehensive documentation covering:
- Problem and solution overview
- Implementation details
- How the three-stage filtering works
- Test cases and usage examples
- Benefits and edge cases

#### `CHANGELOG_ALTERNATIVE_SUGGESTIONS.md`
This file - documenting all changes made.

### 3. Updated Documentation

#### `README.md`
- Added "Alternative suggestions" to Brandon Eats agent features
- Updated "Advanced Features" section with example
- Added link to `ALTERNATIVE_SUGGESTIONS.md` in documentation section

#### `tests/README.md`
- Added `test-alternative-suggestions.js` to test catalog
- Included usage example and explanation

## How It Works

### Three-Stage Filtering System

**Stage 1: Off-Topic Triage** (webhook)
- Blocks completely irrelevant questions
- Saves API costs

**Stage 2A: Restaurant Detection** (webhook)
- Quick check if response mentions places
- Passes to Stage 2B

**Stage 2B: Smart Matching** (social-link-extractor) - **NEW!**
- Uses Claude to detect:
  - Direct restaurant mentions → Return names
  - "I don't have what you want" responses → Set `suggestAlternatives: true`

**Stage 2C: Alternative Suggestion** (social-link-extractor) - **NEW!**
- Only triggers when `suggestAlternatives = true` and no direct mentions
- Finds 2-3 closest alternatives
- Generates contextual explanation

## Technical Details

### AI Prompts

**Detection Prompt (Stage 2B):**
- Analyzes if response discusses specific restaurants
- Detects if response says "Brandon doesn't cover that"
- Returns both pieces of information in structured format

**Alternative Suggestion Prompt (Stage 2C):**
- Understands user's original request from the bot's response
- Finds closest matching alternatives from available data
- Generates context message explaining relevance

### Performance Considerations

- Only first 50 restaurants considered for alternative matching (optimization)
- Limited to max 3 alternatives to avoid overwhelming users
- Temperature 0.4 for alternatives (balance creativity and accuracy)
- Temperature 0.3 for detection (consistency important)

## Testing

Run the test suite:
```bash
node tests/test-alternative-suggestions.js
```

All tests pass successfully:
- ✅ High-end request → 3 alternatives with context
- ✅ Cuisine not covered → 3 alternatives with context
- ✅ Direct recommendation → 1 direct match (no alternatives)
- ✅ Generic greeting → No alternatives (correct)

## Benefits

### For Users
- 🎯 Better experience - always get something helpful
- 💡 Context explains why alternatives are relevant
- 🎥 Videos help make informed decisions

### For the System
- 🧠 More intelligent and contextual
- 💰 Efficient - only triggers when beneficial
- 🎨 Maintains strict filtering for other cases

## Migration Notes

**No breaking changes** - Feature is fully backward compatible:
- Existing direct matches work exactly as before
- Only adds new behavior for "not found" scenarios
- No configuration required - automatically enabled

## Future Enhancements

Potential improvements:
- [ ] Configurable max alternatives (currently hardcoded to 3)
- [ ] User preference learning
- [ ] Multi-dimensional alternatives (price + cuisine + location)
- [ ] A/B testing to measure user engagement

## Files Changed Summary

**Modified:**
- `services/social-link-extractor.js` (+115 lines)
- `webhooks/brandoneats-webhook.js` (+11 lines)
- `README.md` (+5 lines)
- `tests/README.md` (+16 lines)

**Added:**
- `tests/test-alternative-suggestions.js` (127 lines)
- `ALTERNATIVE_SUGGESTIONS.md` (252 lines)
- `CHANGELOG_ALTERNATIVE_SUGGESTIONS.md` (this file)

**Total:** ~526 lines added/modified

## Deployment

No special deployment steps required:
1. Pull latest changes
2. Restart server
3. Feature is automatically enabled

## Rollback Plan

If issues occur:
1. Revert `services/social-link-extractor.js` to previous version
2. Revert `webhooks/brandoneats-webhook.js` to previous version
3. System will function as before (no alternatives suggested)

## Related Issues

Addresses user feedback: "Why'd it skip the social links when I asked for high-end places?"

Now the system intelligently provides relevant alternatives even when exact matches aren't available, with context explaining the suggestions.

