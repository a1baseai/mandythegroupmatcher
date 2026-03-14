# Mandy Email Integration Guide

## Overview

The `mandythegroupmatcher` server sends match notification emails. The helper functions extract photos from your database (where they're already stored - visible in admin panel) and include them in the emails.

## How It Works

1. **`mandythegroupmatcher` sends the emails** - The server handles email sending via the A1Zap API
2. **Photos are already in your database** - Photos are stored when groups sign up (visible in admin panel)
3. **Helper functions extract photos** - The `mandy-email-helpers.js` functions automatically extract photos from the `group1` and `group2` objects you already have

## Quick Start

1. **Copy the helper file** `services/mandy-email-helpers.js` to your mandythegroupmatcher server (it's already there!)

2. **Find where you send match emails** - Look for where you see `📧 [Matching] Sending match notification emails...` in your logs. This is in `server.js` at the `/api/match` endpoint.

3. **Replace your current email code** with:

```javascript
const { notifyBothGroupsOfMatch } = require('./services/mandy-email-helpers');
const emailService = require('./services/email-service');

// Instead of manually creating email HTML, just use:
// group1 and group2 should already have photo data from your database
// (groupPhotoUrl, groupPhotoVariants, groupPhotoVariantUrls fields)
await notifyBothGroupsOfMatch(
  group1,
  group2,
  async (email, subject, html, text) => {
    return await emailService.sendEmail(email, subject, html, text);
  }
);
```

The helper function will:
- Extract photos from `group1` and `group2` (from your database)
- Generate HTML with photos side by side
- Send the emails using your existing `sendEmailFromMandy` function

Since photos are in your database, the helper functions will find them automatically. The validation logs will show if photos were found.

## Photo Fields

The helper functions look for photos in these fields (in order of preference):

1. `groupPhotoVariantUrls` - Array of variant photo URLs (preferred)
2. `groupPhotoVariants` - Array of variant objects with `url` property
3. `groupPhotoUrl` - Original group photo URL (fallback)

These fields are populated when groups sign up and are visible in your admin panel.

## See Also

- `MANDY_EMAIL_MIGRATION_GUIDE.md` - Step-by-step migration instructions with before/after code examples
- `services/mandy-email-helpers.js` - The helper functions source code
