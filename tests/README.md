# Tests

This directory contains test scripts for validating functionality.

## Available Tests

### test-social-links.js
Test the automatic social link extraction feature.

**What it tests:**
- Restaurant name detection in responses
- CSV data matching
- TikTok URL extraction
- Rich content block generation

**Usage:**
```bash
node tests/test-social-links.js
```

### test-rich-content.js
Test sending various types of rich content messages.

**What it tests:**
- Social share blocks (Instagram, TikTok, YouTube)
- Multiple embeds in one message
- Brandon Eats client integration

**Usage:**
```bash
node tests/test-rich-content.js
```

### test-social-shares-quick.js
Quick test for sending social shares to a specific chat.

**Usage:**
```bash
TEST_CHAT_ID=your_chat_id node tests/test-social-shares-quick.js
```

---

## Running Tests

Before running tests:

1. **Set up environment variables** (see `SETUP.md`)
2. **Upload a CSV file** with restaurant data
3. **Get a test chat ID** from A1Zap

### Environment Variables

Make sure these are set in your `.env`:
```bash
CLAUDE_API_KEY=your-key
A1ZAP_API_KEY=your-key
A1ZAP_AGENT_ID=your-agent-id
```

---

## Contributing Tests

When adding new tests:
- ✅ Use descriptive names (e.g., `test-feature-name.js`)
- ✅ Include clear console output
- ✅ Handle errors gracefully
- ✅ Document what the test does
- ✅ Update this README

See `CONTRIBUTING.md` for more information.

