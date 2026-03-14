# Mandy Email Migration Guide

## Overview

This guide shows you how to update your `mandythegroupmatcher` server to use the email helper functions that automatically include photos from your database.

## Current Setup

Your `mandythegroupmatcher` server is currently doing this:

```javascript
// In server.js, /api/match endpoint
const emailResult = await emailService.sendMatchNotification(
  {
    name: bestMatch.group1.groupName,
    email: bestMatch.group1.email,
    memberEmails: bestMatch.group1.memberEmails || []
  },
  {
    name: bestMatch.group2.groupName,
    email: bestMatch.group2.email,
    memberEmails: bestMatch.group2.memberEmails || []
  },
  {
    compatibility: bestMatch.compatibility
  }
);
```

## Updated Setup

Replace the above with:

```javascript
const { notifyBothGroupsOfMatch } = require('./services/mandy-email-helpers');
const emailService = require('./services/email-service');

// Use the new helper function - it handles everything automatically
// group1 and group2 should already have photo data from your database
// (groupPhotoUrl, groupPhotoVariants, groupPhotoVariantUrls fields)
const results = await notifyBothGroupsOfMatch(
  bestMatch.group1,
  bestMatch.group2,
  async (email, subject, html, text) => {
    return await emailService.sendEmail(email, subject, html, text);
  }
);
```

## What Changed

**Before:**
- Manual email HTML creation
- No photos in emails
- Manual email sending logic

**After:**
- Automatic photo extraction from database
- Photos included side-by-side in emails
- Simplified email sending

## Photo Data

**Note:** The photos are already in your database (visible in the admin panel). The helper functions will extract them from the `group1` and `group2` objects you already have.

The helper functions look for photos in these fields:
- `groupPhotoVariantUrls` (preferred)
- `groupPhotoVariants`
- `groupPhotoUrl` (fallback)

## Location in Code

Look for where your `mandythegroupmatcher` server sends match emails. Based on your logs, it's probably something like:

```javascript
// In server.js, around line 813
if (bestMatch) {
  console.log('📧 [Matching] Sending match notification emails...');
  // ... your current email code here ...
}
```

Replace the email sending code in that section with the new helper function call.

## Troubleshooting

### Missing Photos

To fix missing photos, check:
1. Are photos being saved when groups sign up? (Check `/api/groups/receive` logs)
2. Are photos in the database? (Query the groups table or check admin panel)
3. See validation logs - the helper functions log detailed photo information

The helper functions will log warnings if photos are missing, showing which fields were checked.

## Example Response

After migration, your email sending will return:

```javascript
[
  {
    group: "Group 1 Name",
    success: true,
    error: null
  },
  {
    group: "Group 2 Name",
    success: true,
    error: null
  }
]
```

## Validation

The helper functions automatically validate photos and log detailed diagnostics:

```
[validateGroupPhotos] Group 1 (Luke and Friends): {
  hasPhoto: true,
  photoUrl: "https://...",
  dataStructure: {
    hasGroupPhotoUrl: true,
    hasGroupPhotoVariants: true,
    variantCount: 3,
    ...
  }
}
```

If photos are missing, you'll see warnings in the logs indicating which fields were checked.
