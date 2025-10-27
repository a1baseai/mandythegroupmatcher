# Quick Start: Reference Images Feature

## ✅ What's Done

The reference images feature is **fully implemented** in your YC Photographer agent! Here's what was added:

- ✅ Server configured to serve reference images
- ✅ Webhook updated with reference image logic
- ✅ Automatic style detection (sign vs orange)
- ✅ Graceful failure handling
- ✅ Complete documentation

## 🚀 Quick Setup (3 Steps)

### Step 1: Add Reference Images

Place these two images in the `reference-images/` directory:

1. **`yc-sign-reference.jpg`** - Photo of the YC sign entrance
2. **`yc-orange-reference.jpg`** - Photo of the YC orange background

**Where to find them:**
- Search Google Images for "Y Combinator office" or "YC sign"
- Use screenshots from YC videos on YouTube
- Generate with AI (Midjourney, DALL-E, etc.)

**Image specs:**
- Minimum: 1024x1024 pixels
- Format: JPEG or PNG
- Clear, well-lit photos

### Step 2: Enable the Feature

Add this line to your `.env` file:

```bash
YC_SEND_REFERENCE_IMAGES=true
```

### Step 3: Restart Server

```bash
npm start
```

That's it! 🎉

## 📋 Verify Setup

Run the test script:

```bash
node tests/test-reference-images.js
```

You should see:
- ✅ All reference images present
- ✅ Feature enabled in .env
- ✅ Server configured

## 🎯 How It Works

When enabled, the agent will:

1. **Detect the style** from user's message
2. **Send reference image** with message: "📸 Here's what the YC Sign Entrance looks like! I'll place you in this setting."
3. **Wait 500ms** for proper ordering
4. **Generate & send** the edited photo

### Example

```
User: [sends photo] "Put me in front of the YC sign"
   ↓
Agent: 📸 Here's what the YC Sign Entrance looks like! I'll place you in this setting.
       [sends yc-sign-reference.jpg]
   ↓
(500ms delay)
   ↓
Agent: 📸 Here's your YC photo! Looking great in front of the sign!
       [sends edited photo]
```

## ⚙️ Toggle Feature On/Off

**Enable:**
```bash
YC_SEND_REFERENCE_IMAGES=true
```

**Disable (default):**
```bash
YC_SEND_REFERENCE_IMAGES=false
# or simply remove the line
```

The feature is **optional** and disabled by default, so your agent will work fine without it.

## 🔍 What If Reference Images Are Missing?

No worries! The feature **fails gracefully**:
- Logs a warning in console
- Continues with normal flow
- Still sends the edited photo
- No errors or crashes

## 📚 Full Documentation

- **Complete guide**: `REFERENCE_IMAGES_FEATURE.md`
- **Setup details**: `reference-images/README.md`
- **Agent docs**: `docs/YC_PHOTOGRAPHER_AGENT.md`

## 🐛 Troubleshooting

### Reference image not sending?

1. Check `.env` has `YC_SEND_REFERENCE_IMAGES=true`
2. Verify files exist in `reference-images/`
3. Check filenames match exactly:
   - `yc-sign-reference.jpg`
   - `yc-orange-reference.jpg`
4. Restart the server
5. Check console logs for errors

### Both images sending for same style?

The agent uses keyword detection:
- **Sign**: "sign", "entrance", "door", "outside"
- **Orange**: "orange", "background", "wall", "foam", "studio"

If unsure, it defaults to **sign** style.

## 🎨 Benefits

- **User clarity** - Shows what they're getting
- **Professional experience** - Better onboarding
- **Style education** - Helps users choose
- **Expectation management** - Reduces surprises

---

**Ready to use?** Just add your two reference images and set `YC_SEND_REFERENCE_IMAGES=true`! 🚀

