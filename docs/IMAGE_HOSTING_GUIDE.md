# Image Hosting Guide for A1Zap Agents

Complete guide for hosting and managing images for your AI agents' rich content.

## 📁 Option 1: Static Files in Project (Easiest)

**Best for**: Development, small projects, self-hosted deployments

The project already has static file serving configured! Just add your images to the `static-images` directory.

### Setup

1. **Create directory for your images**:
   ```bash
   mkdir -p static-images/zapbank
   mkdir -p static-images/your-agent-name
   ```

2. **Add your images**:
   ```
   static-images/
     ├── zapbank/
     │   ├── treasury.jpg
     │   ├── corporate-cards.jpg
     │   └── cta-banner.jpg
     └── your-agent/
         └── product.jpg
   ```

3. **Access via URL**:
   ```
   http://localhost:3000/static-images/zapbank/treasury.jpg
   https://your-domain.com/static-images/zapbank/treasury.jpg
   ```

### In Your Agent Code

```javascript
const baseUrl = config.server.baseUrl || 'http://localhost:3000';
const imageUrl = `${baseUrl}/static-images/zapbank/treasury.jpg`;
```

### Pros & Cons

✅ **Pros**:
- Simple setup - just drop files in directory
- No external dependencies
- Works offline/locally
- Version controlled with your code (if you want)

❌ **Cons**:
- Takes up repository space
- Not ideal for large images or many files
- Server bandwidth for image delivery
- No CDN acceleration

---

## ☁️ Option 2: Cloud Storage (AWS S3, Google Cloud, etc.)

**Best for**: Production, scalability, many images

Host images on cloud storage and reference by public URL.

### AWS S3 Setup

1. **Create S3 bucket**:
   ```bash
   aws s3 mb s3://zapbank-product-images
   ```

2. **Upload images**:
   ```bash
   aws s3 cp treasury.jpg s3://zapbank-product-images/treasury.jpg --acl public-read
   ```

3. **Get public URL**:
   ```
   https://zapbank-product-images.s3.amazonaws.com/treasury.jpg
   ```

### In Your Agent Code

```javascript
const imageUrl = 'https://zapbank-product-images.s3.amazonaws.com/treasury.jpg';
```

### With CloudFront CDN

1. Create CloudFront distribution pointing to S3
2. Use CloudFront URL:
   ```javascript
   const imageUrl = 'https://d1abc123xyz.cloudfront.net/treasury.jpg';
   ```

### Pros & Cons

✅ **Pros**:
- Scalable - handle any amount of traffic
- Fast delivery with CDN
- Don't burden your app server
- Professional solution

❌ **Cons**:
- Costs money (usually minimal)
- Requires AWS account/setup
- More complex configuration

---

## 🌐 Option 3: External CDN Services

**Best for**: Quick setup, existing image hosting

Use services like Cloudinary, imgix, or existing CDN.

### Cloudinary Setup

1. **Sign up** at [cloudinary.com](https://cloudinary.com)
2. **Upload images** via dashboard or API
3. **Get URLs**:
   ```
   https://res.cloudinary.com/your-cloud/image/upload/v1234/treasury.jpg
   ```

### In Your Agent Code

```javascript
const imageUrl = 'https://res.cloudinary.com/zapbank/image/upload/v1/treasury.jpg';
```

### Popular Services

- **Cloudinary** - Full-featured, free tier available
- **imgix** - High-performance image CDN
- **Bunny CDN** - Affordable, fast
- **Vercel/Netlify** - If hosting on these platforms

### Pros & Cons

✅ **Pros**:
- Built-in optimization
- Image transformations on-the-fly
- Automatic responsive images
- Fast global delivery

❌ **Cons**:
- Monthly costs (usually has free tier)
- External dependency
- Need account/API keys

---

## 🔗 Option 4: Public URLs (External Assets)

**Best for**: Quick testing, using existing web images

Just use any publicly accessible image URL.

### Examples

```javascript
// Stock photos
imageUrl: 'https://images.unsplash.com/photo-123456?w=800'

// Your existing website
imageUrl: 'https://zapbank.com/assets/products/treasury.jpg'

// GitHub (for open source projects)
imageUrl: 'https://raw.githubusercontent.com/user/repo/main/images/treasury.jpg'
```

### Pros & Cons

✅ **Pros**:
- Zero setup
- Works immediately
- Great for prototyping

❌ **Cons**:
- Depends on external service uptime
- No control over images
- May have rate limits
- Images could disappear

---

## 🎯 Recommendation by Use Case

### Development & Testing
→ **Option 1: Static Files** or **Option 4: Public URLs**
- Fast setup, easy iteration

### Production (Small Scale)
→ **Option 1: Static Files** with good image optimization
- Simple, works well if traffic is moderate

### Production (Medium Scale)
→ **Option 3: External CDN Service** (Cloudinary free tier)
- Professional, affordable, includes optimization

### Production (Large Scale)
→ **Option 2: AWS S3 + CloudFront**
- Enterprise-grade, scalable, cost-effective at scale

---

## 📊 Image Best Practices

### File Sizes
- **Carousel images**: < 200KB each
- **Product cards**: < 300KB each
- **CTA banners**: < 400KB

### Optimization Tools
- **TinyPNG** - Web-based compression
- **ImageOptim** - Mac app
- **Squoosh** - Google's web tool
- **sharp** (Node.js) - Automated optimization

### Dimensions Guide

| Use Case | Recommended Size | Aspect Ratio |
|----------|-----------------|--------------|
| Carousel items | 800x600 | 4:3 |
| Product cards | 1200x800 | 3:2 |
| CTA banners | 1200x600 | 2:1 |
| Profile images | 400x400 | 1:1 |
| Gallery items | 600x600 | 1:1 |

### Format Selection
- **JPEG**: Photos, complex images
- **PNG**: Logos, screenshots, transparency needed
- **WebP**: Best compression (not all platforms support)

---

## 🚀 Quick Start: Adding Images to Zap Bank Agent

### Step 1: Choose Your Method

For development, use **static files**:

```bash
mkdir -p static-images/zapbank
```

### Step 2: Add Images

Download or create these images:
1. `treasury.jpg` - Savings/money visual
2. `corporate-cards.jpg` - Business credit cards
3. `expense-management.jpg` - Dashboard screenshot
4. `bill-pay.jpg` - Payment interface
5. `accounting-integrations.jpg` - Software logos
6. `checking.jpg` - Checking account visual
7. `cta-banner.jpg` - Signup banner

### Step 3: Verify They Work

```bash
# Start server
npm start

# Check image in browser
open http://localhost:3000/static-images/zapbank/treasury.jpg
```

### Step 4: Test with Agent

```bash
node tests/test-zapbank-rep.js
```

Look for carousel and product cards in the response!

---

## 🔧 Configuration

### Update BASE_URL for Production

In `.env`:
```bash
BASE_URL=https://your-production-domain.com
```

Or in `config.js`:
```javascript
server: {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000'
}
```

### Using Environment Variables for Image URLs

For flexibility, you can use env vars:

`.env`:
```bash
ZAPBANK_IMAGE_BASE=https://cdn.zapbank.com/products
```

`webhook`:
```javascript
const imageBase = process.env.ZAPBANK_IMAGE_BASE || `${config.server.baseUrl}/static-images/zapbank`;
const imageUrl = `${imageBase}/treasury.jpg`;
```

---

## 📝 Testing Images

### Check Image Accessibility

```bash
# Test local static file
curl -I http://localhost:3000/static-images/zapbank/treasury.jpg

# Should return 200 OK
```

### Test in Agent Response

```bash
# Send test message
curl -X POST http://localhost:3000/webhook/zapbank-rep \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "chat": {"id": "test", "type": "individual"},
    "message": {
      "id": "msg-1",
      "content": "Tell me about Zap Bank",
      "sender": {"id": "user-1", "name": "Test"}
    }
  }'

# Response should include imageUrl fields
```

---

## 🐛 Troubleshooting

### Images Not Loading

**Check 1**: Verify file exists
```bash
ls -la static-images/zapbank/
```

**Check 2**: Verify static middleware is configured
```javascript
// In server.js
app.use('/static-images', express.static('./static-images'));
```

**Check 3**: Check file permissions
```bash
chmod 644 static-images/zapbank/*.jpg
```

**Check 4**: Test URL directly in browser
- Visit: `http://localhost:3000/static-images/zapbank/treasury.jpg`

### 404 Not Found

- Check filename spelling (case-sensitive!)
- Verify directory structure
- Restart server after adding new images

### Images in Response but Not Displaying

- Check if A1Zap supports image URLs from your domain
- Verify images are publicly accessible (not localhost for production)
- Check CORS headers if needed

---

## 🎨 Free Image Resources

### Stock Photo Sites
- **Unsplash** - High quality, free
- **Pexels** - Free stock photos
- **Pixabay** - Free images and videos

### Design Tools
- **Canva** - Create custom product images
- **Figma** - Design banners and cards
- **Photopea** - Free Photoshop alternative

### Search Terms for Banking Images
- "business banking"
- "finance dashboard"
- "credit cards modern"
- "accounting software"
- "startup office"
- "money growth"
- "payment processing"

---

## 📚 Additional Resources

- [Image Optimization Guide](https://web.dev/fast/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [WebP Format Guide](https://developers.google.com/speed/webp)

---

## Summary

For **Zap Bank agent** and most development:
1. ✅ Use **static files** (`static-images/zapbank/`)
2. ✅ Already configured and ready to use
3. ✅ Just add your images and reference them

For **production** at scale:
1. Consider CDN or cloud storage
2. Optimize all images for web
3. Set proper `BASE_URL` in environment

**You're all set!** 🚀

