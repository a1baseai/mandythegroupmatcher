# Multi-Person & Pose Variety Feature

## Overview

Enhanced the YC Photographer agent to intelligently handle **multiple people** in photos and add **natural pose variety** for authentic, engaging team photos.

## 🎯 What Was Added

### 1. Multi-Person Detection
- **Automatic Recognition**: Agent automatically detects when multiple people are in an image
- **All People Included**: Ensures EVERY person appears in the final edited photo
- **Natural Grouping**: Positions people naturally (side by side, casual group formation)
- **No One Left Out**: Whether it's 2 co-founders or a full team, everyone gets in the frame

### 2. Pose Variety System
Each person gets a unique, natural pose with a mix of:

**Professional Poses:**
- Arms crossed (confident founder stance)
- Hands in pockets (relaxed professional)
- Standing straight (classic professional)
- Confident stance

**Fun/Casual Poses:**
- Peace signs ✌️
- Thumbs up 👍
- Pointing at the YC sign 👉
- Relaxed casual stance
- Slight lean
- Natural, comfortable positions

### 3. Authentic Startup Energy
- Captures the excitement of founders at YC
- Balances professionalism with personality
- Creates photos that feel real, not overly staged
- Reflects the startup culture and team dynamics

## 📝 Implementation Details

### Updated Prompts

Both style prompts (YC Sign and Orange Background) now include:

```
IMPORTANT - Multiple People Handling:
- If there are MULTIPLE PEOPLE in the image, ensure ALL of them appear in the final photo
- Arrange them naturally (side by side, or in a casual group formation)
- Give each person a unique, natural pose - mix of professional and fun/casual styles
- Pose variety: Some professional (arms crossed, confident stance), others fun (peace signs, pointing, etc.)
- Maintain each person's natural appearance, facial features, and proportions
```

### Agent System Prompt Updates

Added to agent's core understanding:
- Handle both individual portraits and group photos (teams, co-founders, etc.)
- Add natural pose variety - mix of professional and fun/casual styles
- Celebrate team photos with appropriate enthusiasm
- Special handling for group photos to ensure all people appear

### Communication Style

New photographer language for teams:
- "Great group energy!" 💪
- "Perfect founder squad!" 🚀
- "Love the team energy!" ⚡
- "Great co-founder vibes!" 🤝

## 🎬 Usage Examples

### Example 1: Co-Founder Pair

```
User: [sends photo with 2 people] "Put us in front of the YC sign"

Agent: 📸 Love the co-founder vibes! Here's you two in front of the famous YC entrance!
       [Photo shows both people with varied poses - one arms crossed, one pointing at sign]
```

### Example 2: Full Team Photo

```
User: [sends team photo with 4 founders] "Orange background for our team!"

Agent: 📸 Perfect founder squad! Here's your team with the iconic YC orange wall!
       [Photo shows all 4 people with mix of poses - professional and casual]
```

### Example 3: Solo Portrait (Still Works!)

```
User: [sends solo photo] "YC sign please"

Agent: 📸 Looking great in front of the YC sign!
       [Solo person with confident, natural pose]
```

## 🎨 Pose Combinations Examples

### 2 People
- Person 1: Arms crossed (professional)
- Person 2: Thumbs up (fun)

### 3 People  
- Person 1: Confident stance (professional)
- Person 2: Peace sign (fun)
- Person 3: Arms crossed (professional)

### 4+ People (Team)
- Mix of 50/50 professional and fun poses
- Natural spacing and arrangement
- Each person maintains their personality

## 🔍 Technical Implementation

### File Changes

**`agents/yc-photographer-agent.js`:**
- Updated `getStylePrompt()` method for both styles
- Enhanced system prompt with multi-person handling
- Added team-focused communication examples

**`docs/YC_PHOTOGRAPHER_AGENT.md`:**
- Added "Multiple People Support" section
- New group photo examples
- Updated communication style

## ✨ Benefits

1. **Team-Friendly** - Perfect for co-founder announcements and team photos
2. **Natural Results** - Mix of poses creates authentic, non-staged look
3. **No One Missing** - AI explicitly instructed to include everyone
4. **Personality Preserved** - Each person keeps their natural appearance
5. **Startup Culture** - Captures the energy and excitement of YC founders
6. **Versatile** - Works for solo portraits and groups of any size

## 🎯 Use Cases

Perfect for:
- 👥 Co-founder announcements
- 🚀 Team launch photos  
- 📸 YC acceptance celebration photos
- 👨‍👩‍👧‍👦 Full team portraits
- 🤝 Partnership announcements
- 💼 Professional team headshots with personality
- 🎉 Demo day team photos

## 🔬 How It Works

1. **Image Analysis**: Gemini automatically detects number of people in image
2. **Pose Assignment**: AI assigns varied poses based on prompt instructions
3. **Natural Placement**: People arranged naturally in front of YC setting
4. **Variety Generation**: Random mix ensures each photo is unique
5. **Quality Preservation**: Each person's features and proportions maintained

## 📊 Pose Distribution

The AI aims for roughly:
- **50% Professional** poses (confident, business-like)
- **50% Fun/Casual** poses (playful, relaxed)

This creates a balanced, authentic look that says: *"We're professional founders who don't take ourselves too seriously."*

## 🧪 Testing

Test with different scenarios:

```bash
# Test with 2 people
curl -X POST /webhook/yc-photographer \
  -d '{"chat": {"id": "test123"}, "message": {"content": "YC sign please", "media": {"url": "photo_with_2_people.jpg"}}}'

# Test with full team (4-5 people)
curl -X POST /webhook/yc-photographer \
  -d '{"chat": {"id": "test123"}, "message": {"content": "Team photo with orange background", "media": {"url": "team_photo.jpg"}}}'

# Test with solo (still works)
curl -X POST /webhook/yc-photographer \
  -d '{"chat": {"id": "test123"}, "message": {"content": "Put me in front of YC", "media": {"url": "solo_photo.jpg"}}}'
```

## 💡 Tips for Best Results

1. **Clear Source Photos**: Use photos where all faces are visible
2. **Good Lighting**: Better source photos = better results
3. **Not Too Crowded**: Works best with 2-6 people
4. **Clear Instructions**: "Team photo" or "co-founder photo" helps the AI understand

## 🔄 Comparison: Before vs After

### Before This Update
- ❌ Sometimes only one person would appear from group photos
- ❌ All poses would be similar/uniform
- ❌ Photos felt staged and corporate
- ❌ Lost the startup energy

### After This Update  
- ✅ ALL people appear in every photo
- ✅ Each person has unique pose with variety
- ✅ Photos feel authentic and natural
- ✅ Captures true YC startup energy

## 🚀 Future Enhancements

Potential improvements:
- Pose style preferences (all professional, all fun, or custom mix)
- Specific pose requests ("Make me point at the sign")
- Group size optimization (different arrangements for 2 vs 10 people)
- Action poses (jumping, celebrating, etc.)
- Custom pose suggestions based on team size

## 📚 Related Documentation

- Main guide: `docs/YC_PHOTOGRAPHER_AGENT.md`
- Reference images: `REFERENCE_IMAGES_FEATURE.md`
- Quick start: `QUICK_START_REFERENCE_IMAGES.md`

---

**Status**: ✅ Fully Implemented
**Version**: 2.0.0 (Multi-Person Support)
**Date**: October 26, 2025

**Perfect for**: Startup teams, co-founders, and anyone who wants their YC photo to capture both professionalism and personality! 🚀

