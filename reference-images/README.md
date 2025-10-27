# Reference Images for YC Photographer Agent

This directory contains reference images that can be sent to users before generating their edited photos. This helps users understand what the final setting will look like.

## 📁 Required Files

Place the following images in this directory:

1. **`yc-sign-reference.jpg`** - Photo of the Y Combinator sign entrance
   - Shows the outdoor YC sign setting
   - Used when user requests: "sign", "entrance", "door", "outside", "outdoor"

2. **`yc-orange-reference.jpg`** - Photo of the YC orange background wall
   - Shows the iconic orange acoustic foam panel wall
   - Used when user requests: "orange", "background", "wall", "foam", "studio", "indoor"

## 🎨 Image Guidelines

For best results, your reference images should:

- **Resolution**: At least 1024x1024 pixels
- **Format**: JPEG or PNG (JPEG preferred for smaller file size)
- **Content**: Clear, well-lit photos showing the YC setting
- **Perspective**: Front-facing view that shows what the user's final photo will look like

## ⚙️ Configuration

### Enable Reference Images

Add this to your `.env` file:

```bash
# Send reference images before edited photos
YC_SEND_REFERENCE_IMAGES=true
```

### Disable Reference Images (Default)

Set to `false` or remove the environment variable:

```bash
YC_SEND_REFERENCE_IMAGES=false
```

## 🔄 How It Works

1. **User sends a photo** with a request (e.g., "Put me in front of the YC sign")
2. **Agent detects the style** (sign or orange background)
3. **Reference image is sent** with message: "📸 Here's what the YC Sign Entrance looks like! I'll place you in this setting."
4. **Short delay** (500ms) to ensure proper message ordering
5. **Edited photo is generated** and sent

## 📝 Example Flow

```
User: [uploads selfie] "Can I get the orange background?"

Agent: 📸 Here's what the YC Orange Background looks like! I'll place you in this setting.
       [sends yc-orange-reference.jpg]
       
       (0.5 second delay)
       
Agent: Here you go! Looking fantastic in front of the YC orange wall! 🧡
       [sends edited photo with user in front of orange background]
```

## 🧪 Testing

To test without the reference image feature:
- Don't set `YC_SEND_REFERENCE_IMAGES=true` (feature is disabled by default)
- Or delete/rename the reference image files

## 📸 Where to Find YC Reference Images

You can:
1. **Search online** for "Y Combinator office" or "YC sign" images
2. **Take screenshots** from YC YouTube videos or founder interviews
3. **Use AI generation** to create representative images
4. **Visit YC** and take photos yourself (if you have access!)

## 🔗 Public URL

Once placed in this directory, images are served at:
- `https://your-domain.com/reference-images/yc-sign-reference.jpg`
- `https://your-domain.com/reference-images/yc-orange-reference.jpg`

The server automatically serves this directory via the `/reference-images` endpoint.

## ⚠️ Important Notes

- Reference images are **optional** - the agent works fine without them
- If reference files are missing, the agent will skip sending them (no errors)
- Reference images are NOT sent in test mode (local testing)
- The feature is disabled by default to avoid confusion if images aren't set up

## 🎯 Benefits

Sending reference images:
- ✅ Sets clear expectations for users
- ✅ Helps them understand what they're getting
- ✅ Showcases the YC brand aesthetic
- ✅ Makes the experience more professional
- ✅ Reduces confusion about the two different styles

---

**Ready to use?** Just add your two reference images and set `YC_SEND_REFERENCE_IMAGES=true` in your `.env` file!

