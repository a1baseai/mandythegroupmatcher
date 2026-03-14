# Email Sending Testing Guide

## ✅ Code Verification

The email sending functionality is **properly integrated** in the codebase:

1. ✅ Email service exists (`services/email-service.js`)
2. ✅ `sendMatchNotification` method implemented
3. ✅ `createGroupChatLink` method implemented
4. ✅ Server calls email service when matches are found
5. ✅ `emailStatus` included in `/api/match` response

## 🧪 How to Test Email Sending

### Step 1: Verify Configuration

Check that these environment variables are set in Railway:
- `MANDY_AGENT_ID` - Your Mandy agent ID
- `MANDY_API_KEY` or `A1ZAP_API_KEY` - Your A1Zap API key
- `MANDY_AGENT_SLUG` (optional) - Defaults to "mandythematchmaker"

### Step 2: Verify Groups Have Email Addresses

1. Check stored groups:
   ```
   GET https://mandythegroupmatcher-production.up.railway.app/api/groups
   ```

2. Each group should have:
   - `email` or `contactEmail` field (for the lead contact)
   - `memberEmails` array (optional, for group chat)

### Step 3: Run Matching

Visit or call:
```
GET/POST https://mandythegroupmatcher-production.up.railway.app/api/match
```

### Step 4: Check the Response

Look for the `emailStatus` object in the response:

```json
{
  "success": true,
  "emailStatus": {
    "sent": true,
    "emails": [
      {
        "group": "Group Name 1",
        "email": "group1@example.com",
        "success": true,
        "emailId": "email_12345"
      },
      {
        "group": "Group Name 2",
        "email": "group2@example.com",
        "success": true,
        "emailId": "email_67890"
      }
    ],
    "shareLink": "https://www.a1zap.com/hybrid-chat/mandythematchmaker/chat_123",
    "chatId": "chat_123"
  }
}
```

### Step 5: Check Railway Logs

Look for these log messages:

**Success:**
```
📧 [Matching] Sending match notification emails...
💬 [Email Service] Creating proactive chat for: Group1 + Group2
✅ [Email Service] Chat created successfully
   Chat ID: chat_123
   Share Link: https://www.a1zap.com/hybrid-chat/...
📧 [Email Service] Sending email to: group1@example.com
   Subject: 🎉 You've been matched with Group2!
✅ [Email Service] Email sent successfully: email_12345
✅ [Matching] Match notification emails sent successfully
```

**Failure:**
```
⚠️  [Email Service] Group 1 (GroupName) has no email address
❌ [Email Service] Error sending email: ...
⚠️  [Matching] Some emails failed to send: [...]
```

## 🔍 Troubleshooting

### Issue: `emailStatus.sent` is `false`

**Possible causes:**
1. **Missing email addresses**: One or both groups don't have email addresses
   - Check: `GET /api/groups` to see if groups have `email` or `contactEmail`
   - Fix: Ensure groups are submitted with email addresses

2. **Email service not configured**: Missing API keys
   - Check: Railway environment variables
   - Fix: Set `MANDY_AGENT_ID` and `MANDY_API_KEY`

3. **API error**: A1Zap API returned an error
   - Check: Railway logs for error details
   - Fix: Verify API keys are correct and have email sending permissions

### Issue: `emailStatus` is `null`

**Possible causes:**
1. **No match found**: `bestMatch` is null
   - Check: Response should show `summary.bestMatch` as `null`
   - Fix: Need at least 2 groups to match

2. **Matching failed**: Error during matching process
   - Check: Response should have `error` field
   - Fix: Check Railway logs for error details

### Issue: Emails sent but not received

**Possible causes:**
1. **Email in spam folder**: Check spam/junk folder
2. **Wrong email address**: Verify email addresses in group data
3. **Email service delay**: A1Zap may queue emails (check after a few minutes)

## 📊 Expected Behavior

### When Matching Succeeds:

1. ✅ Best match is found
2. ✅ Group chat is created (or fallback link generated)
3. ✅ Email 1 sent to Group 1's email
4. ✅ Email 2 sent to Group 2's email
5. ✅ Both emails include:
   - Match notification
   - Compatibility score
   - Shareable link to group chat
6. ✅ `emailStatus` shows success for both emails

### Email Content:

Each email includes:
- Subject: `🎉 You've been matched with [Other Group Name]!`
- HTML body with:
  - Match announcement
  - Compatibility score (if available)
  - "Join Group Chat" button/link
  - Plain text fallback

## 🚀 Quick Test Command

```bash
# Check if groups exist and have emails
curl https://mandythegroupmatcher-production.up.railway.app/api/groups

# Run matching (check emailStatus in response)
curl https://mandythegroupmatcher-production.up.railway.app/api/match
```

## 📝 Notes

- Emails are sent **asynchronously** - the matching endpoint doesn't wait for email delivery confirmation
- If chat creation fails, a fallback link is generated
- If one email fails, the other may still succeed (check `emailStatus.emails` array)
- All email sending attempts are logged in Railway logs
