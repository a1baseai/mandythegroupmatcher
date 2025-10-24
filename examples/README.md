# Examples

This directory contains example scripts demonstrating how to use the AI agent system.

## Available Examples

### upload.js
Upload files to Claude for agent context.

**Usage:**
```bash
# Via npm script (recommended)
npm run upload /path/to/your/file.csv

# Or directly
node examples/upload.js /path/to/your/file.csv
```

**Example:**
```bash
npm run upload files/brandoneats.csv
```

### social-shares.js
Example of sending rich content messages with social media embeds.

**Usage:**
```bash
node examples/social-shares.js
```

Shows how to:
- Create rich content blocks
- Send messages with Instagram/TikTok/YouTube embeds
- Use the Brandon Eats client

---

## Creating Your Own Examples

Feel free to add your own example scripts here! Good examples to add:
- Custom agent configurations
- Different file types (PDF, JSON, etc.)
- Webhook testing scripts
- Data analysis examples

See the main `README.md` for API documentation.

