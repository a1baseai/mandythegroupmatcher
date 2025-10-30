# Zap Bank Product Images

This directory contains product images for the Zap Bank agent's rich content (carousels, product cards, CTA banners).

## Required Images

Place your Zap Bank product images here with these exact filenames:

### Carousel Images (800x600 recommended)
- `treasury.jpg` - Treasury account visuals (money, growth, savings)
- `corporate-cards.jpg` - Corporate credit cards
- `expense-management.jpg` - Expense tracking dashboard
- `bill-pay.jpg` - Bill payment interface
- `accounting-integrations.jpg` - Accounting software logos

### Product Card Images (1200x800 recommended)
- `checking.jpg` - Business checking account visuals

### CTA Banner (1200x600 recommended)
- `cta-banner.jpg` - Call-to-action banner for signup

## Image Specifications

### Recommended Dimensions
- **Carousel items**: 800x600px (4:3 ratio)
- **Product cards**: 1200x800px (3:2 ratio)
- **CTA banner**: 1200x600px (2:1 ratio)

### Format
- JPEG or PNG
- Optimized for web (< 500KB per image)
- High quality but compressed

### Style Guidelines
- Modern, clean aesthetic
- Professional fintech look
- Consistent color palette (blues, teals, modern greens)
- Clear, crisp imagery
- Mobile-friendly (clear even at small sizes)

## URLs

Once images are in this directory, they'll be served at:

```
{BASE_URL}/static-images/zapbank/{filename}
```

For example:
- `http://localhost:3000/static-images/zapbank/treasury.jpg`
- `https://your-domain.com/static-images/zapbank/corporate-cards.jpg`

## Alternative: Use External URLs

If you prefer to host images externally, edit `webhooks/zapbank-rep-webhook.js` and replace the `imageUrl` values with your CDN URLs:

```javascript
imageUrl: 'https://cdn.zapbank.com/products/treasury.jpg'
```

## Testing Images

After adding images, test them:

1. **Check if accessible**:
   ```bash
   curl -I http://localhost:3000/static-images/zapbank/treasury.jpg
   ```

2. **Open in browser**:
   - Visit: `http://localhost:3000/static-images/zapbank/treasury.jpg`
   - Should display the image

3. **Test with agent**:
   ```bash
   node tests/test-zapbank-rep.js
   ```

## Quick Setup with Placeholder Images

If you don't have product images yet, you can use free stock photos:

1. Go to [Unsplash](https://unsplash.com/) or [Pexels](https://pexels.com/)
2. Search for:
   - "banking" → treasury.jpg, checking.jpg
   - "credit cards" → corporate-cards.jpg
   - "accounting dashboard" → expense-management.jpg, accounting-integrations.jpg
   - "payment" → bill-pay.jpg
   - "startup team" or "business success" → cta-banner.jpg

3. Download and rename to match required filenames
4. Place in this directory

## Production Deployment

For production, consider:

1. **Use a CDN** (Cloudflare, AWS CloudFront)
   - Faster delivery
   - Better caching
   - Global distribution

2. **Optimize images**
   - Use tools like TinyPNG, ImageOptim
   - Convert to WebP for smaller file sizes
   - Add responsive image variants

3. **Update BASE_URL**
   - Set `BASE_URL` environment variable in production
   - Or update `config.server.baseUrl` in config.js

## Need Help?

- Check server logs if images aren't loading
- Verify file permissions (should be readable)
- Ensure filenames match exactly (case-sensitive)
- Test URLs directly in browser first

