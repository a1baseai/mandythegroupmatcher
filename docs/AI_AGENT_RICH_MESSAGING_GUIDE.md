# AI Agent Rich Messaging Reference Guide

> **Audience**: AI Agents using the A1Zap messaging API  
> **Purpose**: Comprehensive reference for choosing and implementing rich content formats in responses

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Quick Decision Tree](#quick-decision-tree)
3. [Sending Images & Media](#sending-images--media)
4. [Visual & Media Blocks](#visual--media-blocks)
5. [Interactive Elements](#interactive-elements)
6. [Information Cards](#information-cards)
7. [Workflow & Tasks](#workflow--tasks)
8. [Best Practices](#best-practices)
9. [Complete Examples](#complete-examples)

---

## Introduction

### What is Rich Messaging?

Rich messaging allows you to enhance text responses with interactive, visual, and structured content. Instead of plain text, you can send:

- 🎨 **Visual content**: Carousels, galleries, social media embeds
- ⚡ **Interactive elements**: Buttons, polls, forms, quick replies
- 📇 **Structured cards**: Products, events, contacts, profiles
- 📋 **Workflow components**: Tasks, projects, reminders, status updates

### When to Use Rich Messaging

**Use rich messaging when:**
- You need to display multiple items visually (products, images, options)
- The user would benefit from interactive elements (buttons, forms, polls)
- Information is structured and fits a card format (events, contacts, locations)
- You want to embed social media content (TikTok, Instagram, YouTube)
- You're tracking workflows, tasks, or project status

**Stick to plain text when:**
- A simple answer suffices
- The information is conversational or explanatory
- No visual or interactive elements would add value
- You're asking a clarifying question

### Technical Overview

**Message Structure:**
```javascript
{
  chatId: "string",
  content: "Your text message",
  richContentBlocks: [
    {
      type: "block_type",    // One of 18 supported types
      data: { ... },         // Block-specific data
      order: 0               // Optional display order
    }
  ],
  metadata: { ... }          // Optional metadata
}
```

**Key Constraints:**
- Maximum 10 blocks per message
- Each block requires `type` and `data`
- `order` field is optional (defaults to array order)
- Blocks are validated - validation errors returned in response
- Can combine `richContentBlocks` with `media` parameter

---

## Quick Decision Tree

### "Which Format Should I Use?"

#### Displaying Visual Content
- **Multiple images to browse?** → Use `carousel` (swipeable)
- **Grid of photos/media?** → Use `gallery` (multi-column layout)
- **Social media post/video?** → Use `social_share` (embed)
- **Social profile/creator?** → Use `social_profile` (profile card)

#### User Interaction Needed
- **Want user to take action?** → Use `button_card` (up to 6 buttons)
- **Quick binary/simple choices?** → Use `quick_replies` (tap buttons)
- **Gathering user opinion?** → Use `poll` (voting)
- **Collecting user data?** → Use `form_card` (input fields)

#### Displaying Structured Information
- **Person/contact info?** → Use `profile_card` or `contact_card`
- **Product with price?** → Use `product_card` (price, rating, stock)
- **Event with date/time?** → Use `event_card` (calendar info)
- **Physical location?** → Use `location_card` (map coordinates)
- **Website/article preview?** → Use `link_preview` (rich URL preview)

#### Workflow & Task Management
- **Single task status?** → Use `task_card` (assignee, due date, priority)
- **Project overview?** → Use `project_card` (progress bar, team)
- **Scheduled reminder?** → Use `reminder_card` (time-based)
- **Process execution status?** → Use `workflow_status` (running/completed/failed)

---

## Sending Images & Media

### Overview

You can send images in two ways:
1. **External URL** - Provide a URL, system downloads and uploads to S3
2. **Pre-uploaded mediaId** - Reference already-uploaded media

### Method 1: External Image URL

**When to use:** You have an external image URL (from web, API, etc.)

**How it works:** System downloads the image, uploads to S3, signs it, and sends

**Example:**
```javascript
{
  chatId: "YOUR_CHAT_ID",
  content: "✨ Check out this amazing photo!",
  media: {
    url: "https://example.com/beautiful-image.png",
    contentType: "image/png",
    width: 1920,      // Optional
    height: 1080      // Optional
  }
}
```

### Method 2: Pre-uploaded Media ID

**When to use:** Media was already uploaded to the system

**How it works:** Reference the mediaId directly

**Example:**
```javascript
{
  chatId: "YOUR_CHAT_ID",
  content: "Here's the photo we discussed earlier",
  media: {
    mediaId: "k7abc123xyz456...",
    contentType: "image/jpeg",
    width: 1024,      // Optional
    height: 768       // Optional
  }
}
```

### Media Parameter Specifications

**Required Fields:**
- `contentType` (string) - MIME type (e.g., "image/png", "image/jpeg", "image/webp", "image/gif")
- Either `url` OR `mediaId` (cannot provide both)

**Optional Fields:**
- `width` (number) - Image width in pixels
- `height` (number) - Image height in pixels

**Constraints:**
- Maximum file size: 10MB
- External URLs must be publicly accessible
- Supported formats: PNG, JPEG, WebP, GIF
- You can combine `media` with `richContentBlocks` in the same message

### Decision Guide: Media vs Rich Content Blocks

**Use `media` parameter when:**
- Sending a single standalone image
- Image is the primary content (not part of a carousel or gallery)
- Simple image attachment to text message

**Use `carousel` or `gallery` blocks when:**
- Sending multiple images
- Images need titles, captions, or links
- Creating a browsable visual experience
- Need structured presentation

---

## Visual & Media Blocks

### 1. Carousel (`carousel`)

#### When to Use
- Showcasing multiple products, items, or features
- Presenting step-by-step visual guides
- Displaying before/after images
- Creating a swipeable photo story
- Highlighting multiple options for user to browse

#### Why Use This
- **Visual impact**: Eye-catching, interactive format
- **Space efficient**: Shows multiple items without overwhelming
- **User engagement**: Swipeable interaction keeps users engaged
- **Organized**: Each item gets its own "card" with title/description

#### Technical Specification

**Required Fields:**
- `items` (array, 1-10 items) - Carousel items
  - Each item must have either:
    - `imageUrl` (string) - External image URL, OR
    - `mediaId` (string) - Pre-uploaded media ID

**Optional Fields (per item):**
- `title` (string) - Item title
- `subtitle` (string) - Item subtitle
- `description` (string) - Item description
- `url` (string) - Link when item is tapped

**Optional Fields (carousel level):**
- `interval` (number) - Auto-scroll interval in milliseconds (minimum 1000ms)

**Example:**
```javascript
{
  type: "carousel",
  data: {
    items: [
      {
        imageUrl: "https://example.com/product1.jpg",
        title: "Premium Wireless Headphones",
        subtitle: "$299.99",
        description: "Industry-leading noise cancellation",
        url: "https://store.example.com/product1"
      },
      {
        imageUrl: "https://example.com/product2.jpg",
        title: "Smart Watch Pro",
        subtitle: "$399.99",
        description: "Advanced health tracking",
        url: "https://store.example.com/product2"
      },
      {
        mediaId: "k7abc123...",
        title: "Portable Speaker",
        subtitle: "$149.99",
        description: "360° sound experience"
      }
    ],
    interval: 3000  // Auto-scroll every 3 seconds
  },
  order: 0
}
```

#### Common Patterns

**Product showcase:**
```javascript
// Show multiple products with prices
items: [
  { imageUrl: "...", title: "Product A", subtitle: "$49.99" },
  { imageUrl: "...", title: "Product B", subtitle: "$79.99" }
]
```

**Before/After:**
```javascript
// Visual transformation
items: [
  { imageUrl: "...", title: "Before", description: "Starting point" },
  { imageUrl: "...", title: "After", description: "Final result" }
]
```

**Step-by-step guide:**
```javascript
// Tutorial or process
items: [
  { imageUrl: "...", title: "Step 1", description: "Open the app" },
  { imageUrl: "...", title: "Step 2", description: "Tap settings" },
  { imageUrl: "...", title: "Step 3", description: "Enable feature" }
]
```

#### Avoid If
- You only have 1 image (use `media` parameter or `gallery` instead)
- Images don't relate to each other (use separate messages)
- User needs to see all items at once (use `gallery` instead)
- Content is not visual (use text or other card types)

---

### 2. Gallery (`gallery`)

#### When to Use
- Displaying a collection of photos (portfolio, album, project images)
- Showing multiple product variants or angles
- Creating a grid of media items
- Presenting screenshots or documentation images
- Any scenario where user should see multiple images at once

#### Why Use This
- **Overview**: User sees multiple items simultaneously
- **Organized grid**: Clean, structured presentation
- **Flexible layout**: Control columns and aspect ratio
- **Captions**: Each image can have its own caption
- **Thumbnails**: Optimized loading with thumbnail support

#### Technical Specification

**Required Fields:**
- `items` (array, 1-20 items) - Gallery items
  - Each item must have:
    - `mediaId` (string) - Pre-uploaded media ID

**Optional Fields (per item):**
- `caption` (string) - Image caption
- `thumbnailUrl` (string) - Thumbnail image URL for faster loading

**Optional Fields (gallery level):**
- `columns` (number, 1-4) - Number of columns in grid
- `aspectRatio` (string) - Image aspect ratio (format: "16:9", "1:1", "4:3", etc.)

**Example:**
```javascript
{
  type: "gallery",
  data: {
    items: [
      {
        mediaId: "k7abc123...",
        caption: "Living room - before renovation"
      },
      {
        mediaId: "k7def456...",
        caption: "Kitchen - modern design",
        thumbnailUrl: "https://example.com/thumb2.jpg"
      },
      {
        mediaId: "k7ghi789...",
        caption: "Bedroom - minimalist style"
      },
      {
        mediaId: "k7jkl012...",
        caption: "Bathroom - luxury finishes"
      }
    ],
    columns: 2,
    aspectRatio: "1:1"
  },
  order: 0
}
```

#### Common Patterns

**Photo album:**
```javascript
// Personal or event photos
columns: 2,
aspectRatio: "1:1",
items: [
  { mediaId: "...", caption: "Day 1 - Arrival" },
  { mediaId: "...", caption: "Day 2 - Sightseeing" }
]
```

**Product variants:**
```javascript
// Different colors/angles
columns: 3,
items: [
  { mediaId: "...", caption: "Red" },
  { mediaId: "...", caption: "Blue" },
  { mediaId: "...", caption: "Black" }
]
```

**Documentation/Screenshots:**
```javascript
// Technical documentation
columns: 1,
aspectRatio: "16:9",
items: [
  { mediaId: "...", caption: "Dashboard view" },
  { mediaId: "...", caption: "Settings panel" }
]
```

#### Avoid If
- You want images presented one at a time (use `carousel` instead)
- You only have 1 image (use `media` parameter instead)
- Images are social media posts (use `social_share` instead)
- You need titles, descriptions, or links for each item (use `carousel` instead)

---

### 3. Social Share (`social_share`)

#### When to Use
- Embedding social media posts or videos
- Sharing content from TikTok, Instagram, YouTube, Twitter/X, Vimeo, Twitch
- Referencing viral or relevant social content
- Providing examples from social platforms
- When the actual social post context matters (comments, likes, author)

#### Why Use This
- **Native embed**: Post appears as it does on the original platform
- **Platform branding**: Recognizable social media format
- **Rich context**: Includes author, metrics, engagement
- **Interactive**: Users can engage with the embed
- **Authenticity**: Shows real social content, not just a screenshot

#### Technical Specification

**Required Fields:**
- `platform` (string) - Social platform (enum)
  - Valid values: `youtube`, `tiktok`, `instagram`, `vimeo`, `twitter`, `twitch`
- `url` (string) - Valid URL to the post/video

**Optional Fields:**
- `aspectRatio` (string) - Video aspect ratio (format: "16:9" or "9:16")
- `author` (object)
  - `name` (string) - Author/creator name
  - `avatarUrl` (string) - Author profile picture URL
  - `handle` (string) - Social media handle (e.g., "@username")
- `metrics` (object)
  - `views` (number) - View count
  - `likes` (number) - Like count
  - `comments` (number) - Comment count
  - `duration` (number) - Video duration in seconds

**Example:**
```javascript
{
  type: "social_share",
  data: {
    platform: "tiktok",
    url: "https://www.tiktok.com/@creator/video/1234567890",
    aspectRatio: "9:16",
    author: {
      name: "Amazing Creator",
      handle: "@creator",
      avatarUrl: "https://example.com/avatar.jpg"
    },
    metrics: {
      views: 1500000,
      likes: 250000,
      comments: 12000,
      duration: 45
    }
  },
  order: 0
}
```

#### Common Patterns

**TikTok video:**
```javascript
{
  platform: "tiktok",
  url: "https://www.tiktok.com/@user/video/123...",
  aspectRatio: "9:16"
}
```

**Instagram Reel:**
```javascript
{
  platform: "instagram",
  url: "https://www.instagram.com/reel/ABC123/",
  aspectRatio: "9:16"
}
```

**YouTube Short:**
```javascript
{
  platform: "youtube",
  url: "https://www.youtube.com/shorts/XYZ789",
  aspectRatio: "9:16"
}
```

**YouTube standard video:**
```javascript
{
  platform: "youtube",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  aspectRatio: "16:9"
}
```

**Twitter/X post:**
```javascript
{
  platform: "twitter",
  url: "https://twitter.com/user/status/123..."
}
```

**Twitch clip:**
```javascript
{
  platform: "twitch",
  url: "https://www.twitch.tv/videos/123..."
}
```

#### Avoid If
- The platform isn't supported (only 6 platforms supported)
- You just want to share a link (use `link_preview` instead)
- URL is to a profile page, not a specific post (use `social_profile` instead)
- You need to show your own content, not external social (use `carousel` or `gallery`)

---

### 4. Social Profile (`social_profile`)

#### When to Use
- Showcasing a social media creator or influencer
- Displaying account statistics and metrics
- Recommending social profiles to follow
- Showing brand or business social presence
- When profile information is more relevant than a specific post

#### Why Use This
- **Profile focus**: Highlights the account, not just one post
- **Metrics display**: Shows follower count, engagement stats
- **Verification badges**: Displays verified status
- **Follow action**: Can include follow/subscribe CTA
- **Professional presentation**: Clean, card-based profile view

#### Technical Specification

**Required Fields:**
- `platform` (string) - Social platform
- `url` (string) - Profile URL
- `username` (string) - Display name
- `handle` (string) - Social media handle (e.g., "@username")

**Optional Fields:**
- `avatarUrl` (string) - Profile picture URL
- `bannerUrl` (string) - Banner/header image URL
- `bio` (string) - Profile bio/description
- `verified` (boolean) - Verified account status
- `metrics` (object)
  - `followers` (number) - Follower count
  - `following` (number) - Following count
  - `posts` (number) - Post count
  - `subscribers` (number) - Subscriber count (YouTube)
  - `views` (number) - Total views (YouTube)
- `profileType` (string) - Type of profile
  - Valid values: `user`, `channel`, `creator`, `brand`

**Example:**
```javascript
{
  type: "social_profile",
  data: {
    platform: "instagram",
    url: "https://instagram.com/amazingcreator",
    username: "Amazing Creator",
    handle: "@amazingcreator",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
    bio: "Digital creator 🎨 | Travel enthusiast ✈️ | Coffee lover ☕",
    verified: true,
    metrics: {
      followers: 1250000,
      following: 850,
      posts: 1432
    },
    profileType: "creator"
  },
  order: 0
}
```

#### Common Patterns

**Instagram creator:**
```javascript
{
  platform: "instagram",
  username: "Creator Name",
  handle: "@creator",
  verified: true,
  metrics: { followers: 500000, posts: 850 }
}
```

**YouTube channel:**
```javascript
{
  platform: "youtube",
  username: "Channel Name",
  handle: "@channelname",
  metrics: { subscribers: 2000000, views: 50000000 },
  profileType: "channel"
}
```

**Twitter/X profile:**
```javascript
{
  platform: "twitter",
  username: "Person Name",
  handle: "@twitterhandle",
  verified: true,
  metrics: { followers: 750000, following: 1200 }
}
```

**Brand profile:**
```javascript
{
  platform: "instagram",
  username: "Brand Name",
  handle: "@brandname",
  bio: "Official account | Shop now 👇",
  verified: true,
  profileType: "brand"
}
```

#### Avoid If
- You want to share a specific post (use `social_share` instead)
- Profile isn't on a social media platform (use `profile_card` for general profiles)
- You just need a link (use `link_preview` instead)
- Account metrics aren't relevant to the conversation

---

## Interactive Elements

### 5. Button Card (`button_card`)

#### When to Use
- Presenting user with clear action choices
- Driving user to external links (website, app, booking page)
- Triggering specific responses or workflows
- Creating call-to-action (CTA) moments
- When you need labeled, styled action buttons

#### Why Use This
- **Clear CTAs**: Obvious action buttons guide user behavior
- **Multiple actions**: Up to 6 different actions in one card
- **Visual hierarchy**: Primary, secondary, outline styles
- **Rich context**: Title, description, and image provide context
- **Action variety**: URL links, message triggers, or workflow execution

#### Technical Specification

**Required Fields:**
- `title` (string) - Card title
- `buttons` (array, 1-6 buttons) - Action buttons
  - Each button must have:
    - `id` (string) - Unique button identifier
    - `label` (string) - Button text
    - `action` (string) - Button action type (enum)
      - Valid values: `url`, `message`, `workflow`
  - Action-specific required fields:
    - If `action: "url"` → `url` (string) required
    - If `action: "message"` → `message` (string) required
    - If `action: "workflow"` → `workflowId` (string) required

**Optional Fields:**
- `description` (string) - Card description
- `imageUrl` (string) - Card header image
- Per button:
  - `variant` (string) - Button style: `primary`, `secondary`, `outline`
  - `icon` (string) - Button icon name

**Example:**
```javascript
{
  type: "button_card",
  data: {
    title: "Book Your Experience",
    description: "Choose how you'd like to experience our service",
    imageUrl: "https://example.com/experience.jpg",
    buttons: [
      {
        id: "book-premium",
        label: "Book Premium Package",
        action: "url",
        url: "https://booking.example.com/premium",
        variant: "primary"
      },
      {
        id: "book-standard",
        label: "Book Standard Package",
        action: "url",
        url: "https://booking.example.com/standard",
        variant: "secondary"
      },
      {
        id: "learn-more",
        label: "Learn More",
        action: "message",
        message: "Tell me more about the packages",
        variant: "outline"
      },
      {
        id: "contact",
        label: "Contact Support",
        action: "message",
        message: "I need help with booking",
        variant: "outline"
      }
    ]
  },
  order: 0
}
```

#### Common Patterns

**E-commerce CTA:**
```javascript
{
  title: "Product Name",
  description: "Premium quality, limited stock",
  imageUrl: "...",
  buttons: [
    { id: "buy", label: "Buy Now", action: "url", url: "...", variant: "primary" },
    { id: "details", label: "View Details", action: "url", url: "...", variant: "secondary" }
  ]
}
```

**Service selection:**
```javascript
{
  title: "Choose Your Service",
  buttons: [
    { id: "opt1", label: "Option 1", action: "message", message: "I choose option 1" },
    { id: "opt2", label: "Option 2", action: "message", message: "I choose option 2" },
    { id: "opt3", label: "Option 3", action: "message", message: "I choose option 3" }
  ]
}
```

**Navigation menu:**
```javascript
{
  title: "What would you like to do?",
  buttons: [
    { id: "explore", label: "Explore Products", action: "message", message: "Show me products" },
    { id: "track", label: "Track Order", action: "message", message: "Track my order" },
    { id: "support", label: "Contact Support", action: "url", url: "..." }
  ]
}
```

#### Avoid If
- You need more than 6 buttons (split into multiple cards or use `quick_replies`)
- Choices are simple yes/no (use `quick_replies` instead)
- You're collecting data (use `form_card` instead)
- You want to conduct a poll (use `poll` instead)

---

### 6. Quick Replies (`quick_replies`)

#### When to Use
- Simple, fast-tap response options
- Yes/No questions
- Multiple choice questions
- Quick navigation or filtering
- When you want minimal UI, maximum speed

#### Why Use This
- **Speed**: Fastest user interaction method
- **Minimal**: Clean, compact button layout
- **Multiple options**: Up to 12 quick choices
- **Keyboard-like**: Feels natural and responsive
- **Low commitment**: Easy to tap, easy to change mind

#### Technical Specification

**Required Fields:**
- `replies` (array, 1-12 replies) - Quick reply buttons
  - Each reply must have:
    - `id` (string) - Unique reply identifier
    - `label` (string) - Button text

**Optional Fields:**
- Per reply:
  - `icon` (string) - Reply icon name
  - `message` (string) - Custom message to send (defaults to label)

**Example:**
```javascript
{
  type: "quick_replies",
  data: {
    replies: [
      {
        id: "yes",
        label: "Yes",
        icon: "check"
      },
      {
        id: "no",
        label: "No",
        icon: "x"
      },
      {
        id: "maybe",
        label: "Maybe Later",
        icon: "clock"
      }
    ]
  },
  order: 0
}
```

#### Common Patterns

**Yes/No/Maybe:**
```javascript
{
  replies: [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
    { id: "later", label: "Ask Later" }
  ]
}
```

**Category selection:**
```javascript
{
  replies: [
    { id: "electronics", label: "Electronics" },
    { id: "clothing", label: "Clothing" },
    { id: "home", label: "Home & Garden" },
    { id: "sports", label: "Sports" },
    { id: "all", label: "Show All" }
  ]
}
```

**Rating scale:**
```javascript
{
  replies: [
    { id: "5", label: "⭐⭐⭐⭐⭐" },
    { id: "4", label: "⭐⭐⭐⭐" },
    { id: "3", label: "⭐⭐⭐" },
    { id: "2", label: "⭐⭐" },
    { id: "1", label: "⭐" }
  ]
}
```

**Navigation options:**
```javascript
{
  replies: [
    { id: "home", label: "🏠 Home" },
    { id: "products", label: "🛍️ Products" },
    { id: "orders", label: "📦 Orders" },
    { id: "help", label: "❓ Help" }
  ]
}
```

#### Avoid If
- Options need descriptions or images (use `button_card` instead)
- You need more than 12 options (use multiple messages or `form_card` with select)
- Collecting detailed information (use `form_card` instead)
- Each option needs a link to external URL (use `button_card` instead)

---

### 7. Poll (`poll`)

#### When to Use
- Gathering user opinions or preferences
- Making group decisions
- Engaging audience with voting
- Collecting feedback on options
- When you want visible vote counts

#### Why Use This
- **Visual feedback**: Users see vote distribution
- **Engagement**: Voting is fun and interactive
- **Transparency**: Results visible to all participants
- **Social proof**: Popular options are obvious
- **Data collection**: Gather quantitative feedback

#### Technical Specification

**Required Fields:**
- `question` (string) - Poll question
- `options` (array, 2-10 options) - Poll options
  - Each option must have:
    - `id` (string) - Unique option identifier
    - `text` (string) - Option text

**Optional Fields:**
- `allowMultiple` (boolean) - Allow multiple selections (default: false)
- `totalVotes` (number) - Total vote count
- Per option:
  - `count` (number) - Number of votes for this option

**Example:**
```javascript
{
  type: "poll",
  data: {
    question: "What's your favorite feature?",
    options: [
      {
        id: "rich-content",
        text: "Rich Content Blocks",
        count: 145
      },
      {
        id: "webhooks",
        text: "Webhook Integration",
        count: 98
      },
      {
        id: "ai-agent",
        text: "AI Agent System",
        count: 203
      },
      {
        id: "analytics",
        text: "Analytics Dashboard",
        count: 67
      }
    ],
    allowMultiple: false,
    totalVotes: 513
  },
  order: 0
}
```

#### Common Patterns

**Simple opinion poll:**
```javascript
{
  question: "Do you like the new design?",
  options: [
    { id: "love", text: "Love it! ❤️" },
    { id: "like", text: "It's good 👍" },
    { id: "neutral", text: "Neutral 😐" },
    { id: "dislike", text: "Not a fan 👎" }
  ]
}
```

**Multiple choice (allow multiple):**
```javascript
{
  question: "Which topics interest you? (Select all)",
  options: [
    { id: "tech", text: "Technology" },
    { id: "design", text: "Design" },
    { id: "business", text: "Business" },
    { id: "marketing", text: "Marketing" }
  ],
  allowMultiple: true
}
```

**Event planning:**
```javascript
{
  question: "Best day for the team meeting?",
  options: [
    { id: "mon", text: "Monday" },
    { id: "wed", text: "Wednesday" },
    { id: "fri", text: "Friday" }
  ]
}
```

#### Avoid If
- You need detailed feedback (use `form_card` with textarea instead)
- User shouldn't see others' votes (use `quick_replies` or `button_card` instead)
- Only 2 simple options (use `quick_replies` instead)
- More than 10 options (too many for a poll, use form select instead)

---

### 8. Form Card (`form_card`)

#### When to Use
- Collecting structured user data
- Registration or signup flows
- Survey or questionnaire
- Contact information collection
- Any scenario requiring user input fields

#### Why Use This
- **Data collection**: Get specific, structured information
- **Field validation**: Enforce data quality
- **Multiple inputs**: Collect many data points at once
- **Professional**: Clean, form-based interface
- **Versatile**: 5 field types (text, textarea, select, checkbox, radio)

#### Technical Specification

**Required Fields:**
- `title` (string) - Form title
- `fields` (array, 1-20 fields) - Form fields
  - Each field must have:
    - `id` (string) - Unique field identifier
    - `label` (string) - Field label
    - `type` (string) - Field type (enum)
      - Valid values: `text`, `textarea`, `select`, `checkbox`, `radio`
  - Type-specific requirements:
    - If `type: "select"` or `type: "radio"` → `options` (array) required

**Optional Fields:**
- `description` (string) - Form description
- `submitButtonText` (string) - Custom submit button text
- Per field:
  - `required` (boolean) - Whether field is required
  - `placeholder` (string) - Placeholder text
  - `defaultValue` (string) - Pre-filled value
  - `options` (array) - Options for select/radio/checkbox
    - Each option: `{ value: string, label: string }`

**Example:**
```javascript
{
  type: "form_card",
  data: {
    title: "Contact Information",
    description: "Please fill out your details so we can reach you",
    submitButtonText: "Submit",
    fields: [
      {
        id: "full-name",
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "John Doe"
      },
      {
        id: "email",
        label: "Email Address",
        type: "text",
        required: true,
        placeholder: "john@example.com"
      },
      {
        id: "phone",
        label: "Phone Number",
        type: "text",
        required: false,
        placeholder: "+1 (555) 000-0000"
      },
      {
        id: "interest",
        label: "Area of Interest",
        type: "select",
        required: true,
        options: [
          { value: "sales", label: "Sales Inquiry" },
          { value: "support", label: "Technical Support" },
          { value: "partnership", label: "Partnership" },
          { value: "other", label: "Other" }
        ]
      },
      {
        id: "message",
        label: "Message",
        type: "textarea",
        required: false,
        placeholder: "Tell us more about your inquiry..."
      },
      {
        id: "newsletter",
        label: "Subscribe to newsletter",
        type: "checkbox",
        defaultValue: "true"
      }
    ]
  },
  order: 0
}
```

#### Common Patterns

**Contact form:**
```javascript
{
  title: "Get in Touch",
  fields: [
    { id: "name", label: "Name", type: "text", required: true },
    { id: "email", label: "Email", type: "text", required: true },
    { id: "subject", label: "Subject", type: "text" },
    { id: "message", label: "Message", type: "textarea", required: true }
  ]
}
```

**Survey:**
```javascript
{
  title: "Quick Feedback Survey",
  fields: [
    {
      id: "satisfaction",
      label: "How satisfied are you?",
      type: "radio",
      required: true,
      options: [
        { value: "5", label: "Very Satisfied" },
        { value: "4", label: "Satisfied" },
        { value: "3", label: "Neutral" },
        { value: "2", label: "Unsatisfied" },
        { value: "1", label: "Very Unsatisfied" }
      ]
    },
    {
      id: "comments",
      label: "Additional Comments",
      type: "textarea"
    }
  ]
}
```

**Registration:**
```javascript
{
  title: "Create Account",
  fields: [
    { id: "username", label: "Username", type: "text", required: true },
    { id: "email", label: "Email", type: "text", required: true },
    { id: "password", label: "Password", type: "text", required: true },
    {
      id: "terms",
      label: "I agree to the terms and conditions",
      type: "checkbox",
      required: true
    }
  ]
}
```

#### Avoid If
- You only need one simple input (ask in plain text instead)
- It's just a yes/no question (use `quick_replies` instead)
- You want users to vote or choose from options publicly (use `poll` instead)
- Form would have more than 20 fields (split into multiple steps)

---

## Information Cards

### 9. Profile Card (`profile_card`)

#### When to Use
- Displaying user or contact profiles
- Showing team member information
- Author attribution for content
- General person or entity profiles (not social media specific)

#### Why Use This
- **Clean presentation**: Organized profile view
- **Essential info**: Name, bio, avatar, handle
- **Verification**: Show verified status
- **Professional**: Standard profile card format

#### Technical Specification

**Required Fields:**
- `name` (string) - Profile name

**Optional Fields:**
- `handle` (string) - Username or handle (e.g., "@username")
- `bio` (string) - Profile bio/description
- `avatarUrl` (string) - Profile picture URL
- `verified` (boolean) - Verification status

**Example:**
```javascript
{
  type: "profile_card",
  data: {
    name: "Dr. Jane Smith",
    handle: "@drjanesmith",
    bio: "Chief Medical Officer | Healthcare Innovation | Public Speaker",
    avatarUrl: "https://example.com/jane-avatar.jpg",
    verified: true
  },
  order: 0
}
```

#### Common Patterns

**Team member:**
```javascript
{
  name: "Alex Johnson",
  bio: "Senior Product Manager | 5 years experience",
  avatarUrl: "..."
}
```

**Author info:**
```javascript
{
  name: "Maria Garcia",
  handle: "@mariagarcia",
  bio: "Tech writer & blogger | Covering AI and innovation",
  verified: true
}
```

**Expert profile:**
```javascript
{
  name: "Dr. Robert Chen",
  bio: "Professor of Computer Science | Stanford University",
  avatarUrl: "...",
  verified: true
}
```

#### Avoid If
- Profile is from social media platform (use `social_profile` instead)
- You need contact details like phone/email (use `contact_card` instead)
- It's not about a person or entity (use appropriate card type)

---

### 10. Product Card (`product_card`)

#### When to Use
- Displaying products with pricing
- E-commerce recommendations
- Product search results
- Featured or promoted items
- Any item with price, rating, or purchase link

#### Why Use This
- **E-commerce optimized**: Built for product display
- **Price prominence**: Clear pricing display
- **Stock indicators**: Show availability
- **Rating display**: Social proof with stars
- **Purchase flow**: Direct link to buy

#### Technical Specification

**Required Fields:**
- `name` (string) - Product name

**Optional Fields:**
- `description` (string) - Product description
- `price` (number) - Product price (must be ≥ 0)
- `currency` (string) - Currency code (e.g., "USD", "EUR", "GBP")
- `imageUrl` (string) - Product image URL
- `url` (string) - Product page URL
- `rating` (number) - Product rating (0-5)
- `reviewCount` (number) - Number of reviews
- `inStock` (boolean) - Stock availability
- `sku` (string) - Product SKU or ID

**Example:**
```javascript
{
  type: "product_card",
  data: {
    name: "Premium Wireless Headphones",
    description: "Industry-leading noise cancellation with 30-hour battery life",
    price: 299.99,
    currency: "USD",
    imageUrl: "https://example.com/headphones.jpg",
    url: "https://store.example.com/headphones-pro",
    rating: 4.7,
    reviewCount: 2847,
    inStock: true,
    sku: "HP-PRO-2024-BLK"
  },
  order: 0
}
```

#### Common Patterns

**Featured product:**
```javascript
{
  name: "Product Name",
  description: "Brief product description",
  price: 99.99,
  currency: "USD",
  imageUrl: "...",
  rating: 4.5,
  inStock: true
}
```

**Out of stock:**
```javascript
{
  name: "Popular Item",
  price: 149.99,
  currency: "USD",
  inStock: false
}
```

**Sale item:**
```javascript
{
  name: "Sale Item",
  description: "Limited time offer!",
  price: 79.99,  // Show sale price
  currency: "USD",
  imageUrl: "..."
}
```

#### Avoid If
- Not a purchasable product (use generic card or profile card instead)
- Price isn't relevant (use different card type)
- You're showing a service, not a product (use `button_card` or custom format)

---

### 11. Event Card (`event_card`)

#### When to Use
- Displaying events, meetings, appointments
- Conference or webinar information
- Calendar invites or reminders
- Event listings or recommendations
- Any time-based gathering or occurrence

#### Why Use This
- **Time-focused**: Clear date/time display
- **Location info**: Venue or virtual meeting details
- **Attendance tracking**: Show participant counts
- **Rich context**: Description, image, registration link

#### Technical Specification

**Required Fields:**
- `title` (string) - Event title
- `startTime` (number) - Start timestamp in milliseconds

**Optional Fields:**
- `description` (string) - Event description
- `endTime` (number) - End timestamp in milliseconds
- `location` (string) - Event location
- `imageUrl` (string) - Event banner/image URL
- `url` (string) - Registration or details URL
- `attendeeCount` (number) - Number of attendees
- `maxAttendees` (number) - Maximum capacity
- `isVirtual` (boolean) - Virtual/online event

**Example:**
```javascript
{
  type: "event_card",
  data: {
    title: "AI & Machine Learning Summit 2025",
    description: "Join industry leaders for a day of insights on the future of AI",
    startTime: 1735689600000,  // Jan 1, 2025, 8:00 AM
    endTime: 1735718400000,    // Jan 1, 2025, 4:00 PM
    location: "San Francisco Convention Center, CA",
    imageUrl: "https://example.com/summit-banner.jpg",
    url: "https://events.example.com/ai-summit-2025",
    attendeeCount: 487,
    maxAttendees: 500,
    isVirtual: false
  },
  order: 0
}
```

#### Common Patterns

**Conference:**
```javascript
{
  title: "Tech Conference 2025",
  startTime: 1735689600000,
  endTime: 1735776000000,
  location: "New York City",
  imageUrl: "...",
  attendeeCount: 1200
}
```

**Virtual meeting:**
```javascript
{
  title: "Weekly Team Standup",
  startTime: 1735732800000,
  endTime: 1735734600000,  // 30 min later
  isVirtual: true,
  location: "Zoom Meeting",
  url: "https://zoom.us/j/123456789"
}
```

**Workshop:**
```javascript
{
  title: "Photography Workshop",
  description: "Learn advanced lighting techniques",
  startTime: 1735689600000,
  location: "Studio 42, Downtown",
  attendeeCount: 12,
  maxAttendees: 15,
  url: "https://register.example.com"
}
```

#### Avoid If
- It's not a time-specific event (use different card type)
- Just reminding about a task, not an event (use `reminder_card` instead)
- Event is in the past and historical context doesn't matter
- You're scheduling something, not announcing an event (use `reminder_card`)

---

### 12. Location Card (`location_card`)

#### When to Use
- Sharing physical locations or addresses
- Providing directions
- Showing business or venue locations
- Meeting point coordination
- Any scenario where GPS coordinates or address matter

#### Why Use This
- **Map integration**: Visual map display
- **GPS coordinates**: Precise location data
- **Address display**: Human-readable address
- **Navigation**: Direct link to maps/directions
- **Context**: Name and description of location

#### Technical Specification

**Required Fields:**
- `latitude` (number) - Latitude coordinate (-90 to 90)
- `longitude` (number) - Longitude coordinate (-180 to 180)

**Optional Fields:**
- `name` (string) - Location name
- `address` (string) - Street address
- `imageUrl` (string) - Location image or map screenshot
- `url` (string) - Link to maps or location details

**Example:**
```javascript
{
  type: "location_card",
  data: {
    name: "Golden Gate Bridge",
    address: "Golden Gate Bridge, San Francisco, CA 94129",
    latitude: 37.8199,
    longitude: -122.4783,
    imageUrl: "https://example.com/golden-gate.jpg",
    url: "https://maps.google.com/?q=37.8199,-122.4783"
  },
  order: 0
}
```

#### Common Patterns

**Business location:**
```javascript
{
  name: "Coffee Shop",
  address: "123 Main St, Seattle, WA 98101",
  latitude: 47.6062,
  longitude: -122.3321,
  url: "..."
}
```

**Meeting point:**
```javascript
{
  name: "Meeting Point - North Entrance",
  address: "Central Park, NYC",
  latitude: 40.7829,
  longitude: -73.9654
}
```

**Delivery address:**
```javascript
{
  name: "Delivery Location",
  address: "456 Oak Ave, Apt 3B, Portland, OR 97201",
  latitude: 45.5152,
  longitude: -122.6784
}
```

#### Avoid If
- Location isn't physical (no GPS coordinates available)
- You just need to mention a place name (use plain text)
- Address without specific coordinates is sufficient (mention in text)
- Location is for an event (use `event_card` instead with location field)

---

### 13. Contact Card (`contact_card`)

#### When to Use
- Sharing contact information
- Business card equivalent
- Providing support contact details
- Team member contact info
- When phone number or email is the primary purpose

#### Why Use This
- **Contact-focused**: Built for phone/email display
- **Actionable**: Tap to call or email
- **Complete info**: Name, company, phone, email, address
- **Professional**: Business card format

#### Technical Specification

**Required Fields:**
- `name` (string) - Contact name
- At least one of:
  - `phoneNumber` (string) - Phone number, OR
  - `email` (string) - Email address

**Optional Fields:**
- `company` (string) - Company or organization name
- `jobTitle` (string) - Job title or role
- `address` (string) - Physical address
- `avatarUrl` (string) - Profile picture URL
- `website` (string) - Website URL

**Example:**
```javascript
{
  type: "contact_card",
  data: {
    name: "John Smith",
    jobTitle: "Customer Success Manager",
    company: "Acme Corporation",
    phoneNumber: "+1 (555) 123-4567",
    email: "john.smith@acme.com",
    address: "123 Business Plaza, Suite 400, New York, NY 10001",
    avatarUrl: "https://example.com/john-avatar.jpg",
    website: "https://acme.com"
  },
  order: 0
}
```

#### Common Patterns

**Support contact:**
```javascript
{
  name: "Customer Support",
  company: "Your Company",
  phoneNumber: "+1-800-123-4567",
  email: "support@company.com"
}
```

**Sales representative:**
```javascript
{
  name: "Sarah Johnson",
  jobTitle: "Sales Executive",
  phoneNumber: "+1 (555) 987-6543",
  email: "sarah.j@company.com",
  company: "Sales Corp"
}
```

**Emergency contact:**
```javascript
{
  name: "Emergency Services",
  phoneNumber: "911",
  address: "Available 24/7"
}
```

#### Avoid If
- Contact information isn't the focus (use `profile_card` instead)
- It's a social media profile (use `social_profile` instead)
- No phone or email to share (use `profile_card` instead)

---

### 14. Link Preview (`link_preview`)

#### When to Use
- Sharing article or blog post links
- Referencing web pages with context
- Documentation or resource links
- When the link needs visual preview
- External content recommendation

#### Why Use This
- **Rich preview**: Shows title, description, image
- **Visual context**: User knows what to expect before clicking
- **Professional**: Clean, card-based link display
- **Metadata**: OG image, favicon, site info

#### Technical Specification

**Required Fields:**
- `url` (string) - Target URL (must be valid URL)
- `title` (string) - Page/content title

**Optional Fields:**
- `description` (string) - Page description or excerpt
- `imageUrl` (string) - Preview image (OG image)
- `faviconUrl` (string) - Site favicon
- `siteName` (string) - Website name

**Example:**
```javascript
{
  type: "link_preview",
  data: {
    url: "https://example.com/blog/amazing-article",
    title: "10 Tips for Better Productivity",
    description: "Discover proven strategies to boost your productivity and achieve more in less time. Expert insights from industry leaders.",
    imageUrl: "https://example.com/og-image.jpg",
    faviconUrl: "https://example.com/favicon.ico",
    siteName: "Productivity Blog"
  },
  order: 0
}
```

#### Common Patterns

**Blog article:**
```javascript
{
  url: "https://blog.example.com/post",
  title: "Article Title",
  description: "Brief excerpt from the article...",
  imageUrl: "...",
  siteName: "Blog Name"
}
```

**Documentation:**
```javascript
{
  url: "https://docs.example.com/guide",
  title: "Setup Guide",
  description: "Step-by-step instructions for getting started",
  faviconUrl: "..."
}
```

**News article:**
```javascript
{
  url: "https://news.example.com/story",
  title: "Breaking News Headline",
  description: "Latest updates on the developing story...",
  imageUrl: "...",
  siteName: "News Network"
}
```

#### Avoid If
- Link is to a social media post (use `social_share` instead)
- You just need to share a URL without preview (use plain text)
- Link requires interaction beyond viewing (use `button_card` with URL button)
- Content is your own, not external (use appropriate internal card type)

---

## Workflow & Tasks

### 15. Task Card (`task_card`)

#### When to Use
- Displaying individual tasks
- To-do items with status
- Assignment tracking
- Work items with priority
- When showing specific task details

#### Why Use This
- **Task-focused**: Built for task management
- **Status tracking**: Pending, in progress, completed, failed
- **Priority levels**: Visual priority indicators
- **Assignment**: Show who's responsible
- **Due dates**: Deadline tracking

#### Technical Specification

**Required Fields:**
- `taskId` (string) - Unique task identifier
- `title` (string) - Task title
- `status` (string) - Task status (enum)
  - Valid values: `pending`, `in_progress`, `completed`, `failed`

**Optional Fields:**
- `description` (string) - Task description
- `priority` (string) - Priority level: `low`, `medium`, `high`, `urgent`
- `dueDate` (number) - Due date timestamp in milliseconds
- `assignee` (object)
  - `name` (string) - Assignee name
  - `avatarUrl` (string) - Assignee avatar
- `tags` (array of strings) - Task tags

**Example:**
```javascript
{
  type: "task_card",
  data: {
    taskId: "TASK-1234",
    title: "Complete Q4 Product Roadmap",
    description: "Finalize features, timeline, and resource allocation for Q4",
    status: "in_progress",
    priority: "high",
    dueDate: 1735689600000,
    assignee: {
      name: "Jane Smith",
      avatarUrl: "https://example.com/jane.jpg"
    },
    tags: ["planning", "roadmap", "q4"]
  },
  order: 0
}
```

#### Common Patterns

**Active task:**
```javascript
{
  taskId: "TASK-001",
  title: "Fix login bug",
  status: "in_progress",
  priority: "urgent",
  assignee: { name: "Alex" }
}
```

**Completed task:**
```javascript
{
  taskId: "TASK-002",
  title: "Write documentation",
  status: "completed",
  priority: "medium"
}
```

**Pending task:**
```javascript
{
  taskId: "TASK-003",
  title: "Review pull request",
  status: "pending",
  dueDate: 1735689600000,
  assignee: { name: "Sam" }
}
```

#### Avoid If
- Showing multiple related tasks (use `project_card` instead)
- Task is more of a reminder (use `reminder_card` instead)
- Displaying a full workflow (use `workflow_status` instead)
- Generic to-do without status tracking (use plain text or `button_card`)

---

### 16. Project Card (`project_card`)

#### When to Use
- Displaying project overview
- Multi-task initiatives
- Team project status
- Initiative tracking with progress
- When showing project-level information

#### Why Use This
- **Project overview**: High-level project view
- **Progress tracking**: Visual progress bar (0-100%)
- **Team visibility**: Show project team members
- **Status at-a-glance**: Current project status
- **Deadline tracking**: Due date display

#### Technical Specification

**Required Fields:**
- `projectId` (string) - Unique project identifier
- `name` (string) - Project name
- `status` (string) - Project status

**Optional Fields:**
- `description` (string) - Project description
- `progress` (number) - Progress percentage (0-100)
- `dueDate` (number) - Due date timestamp
- `assignees` (array) - Team members
  - Each assignee: `{ name: string, avatarUrl?: string }`
- `tags` (array of strings) - Project tags

**Example:**
```javascript
{
  type: "project_card",
  data: {
    projectId: "PROJ-2024-001",
    name: "Website Redesign",
    description: "Complete overhaul of company website with modern design and improved UX",
    status: "In Progress",
    progress: 65,
    dueDate: 1738368000000,
    assignees: [
      { name: "Alice Johnson", avatarUrl: "https://example.com/alice.jpg" },
      { name: "Bob Chen", avatarUrl: "https://example.com/bob.jpg" },
      { name: "Carol Martinez", avatarUrl: "https://example.com/carol.jpg" }
    ],
    tags: ["design", "frontend", "ux", "high-priority"]
  },
  order: 0
}
```

#### Common Patterns

**Active project:**
```javascript
{
  projectId: "PROJ-001",
  name: "Mobile App Launch",
  status: "In Progress",
  progress: 75,
  dueDate: 1735689600000,
  assignees: [{ name: "Team A" }, { name: "Team B" }]
}
```

**Planning phase:**
```javascript
{
  projectId: "PROJ-002",
  name: "Q1 Marketing Campaign",
  status: "Planning",
  progress: 15,
  assignees: [{ name: "Marketing Team" }]
}
```

**Completed project:**
```javascript
{
  projectId: "PROJ-003",
  name: "API Integration",
  status: "Completed",
  progress: 100
}
```

#### Avoid If
- Showing a single task (use `task_card` instead)
- Project doesn't have progress tracking (use custom format or `button_card`)
- It's a workflow execution, not a project (use `workflow_status` instead)

---

### 17. Reminder Card (`reminder_card`)

#### When to Use
- Setting time-based reminders
- Scheduled notifications
- Follow-up reminders
- Deadline alerts
- Any time-specific action reminder

#### Why Use This
- **Time-focused**: Built for scheduled reminders
- **Clear deadline**: Prominent time display
- **Context**: Description of what to remember
- **Alert-style**: Visually distinct for attention

#### Technical Specification

**Required Fields:**
- `reminderId` (string) - Unique reminder identifier
- `title` (string) - Reminder title
- `reminderTime` (number) - Reminder timestamp in milliseconds

**Optional Fields:**
- `description` (string) - Reminder description or notes
- `isRecurring` (boolean) - Recurring reminder
- `category` (string) - Reminder category

**Example:**
```javascript
{
  type: "reminder_card",
  data: {
    reminderId: "REM-2025-001",
    title: "Team Meeting - Q4 Planning",
    description: "Prepare slides on team objectives and resource needs",
    reminderTime: 1735732800000,
    isRecurring: false,
    category: "meeting"
  },
  order: 0
}
```

#### Common Patterns

**Meeting reminder:**
```javascript
{
  reminderId: "REM-001",
  title: "Weekly Standup",
  reminderTime: 1735732800000,
  isRecurring: true
}
```

**Deadline reminder:**
```javascript
{
  reminderId: "REM-002",
  title: "Submit expense report",
  description: "Due by end of month",
  reminderTime: 1738368000000
}
```

**Follow-up reminder:**
```javascript
{
  reminderId: "REM-003",
  title: "Follow up with client",
  description: "Check on proposal status",
  reminderTime: 1735689600000
}
```

#### Avoid If
- It's an event with participants (use `event_card` instead)
- It's a task with status tracking (use `task_card` instead)
- No specific time component (use plain text or other card)

---

### 18. Workflow Status (`workflow_status`)

#### When to Use
- Displaying automated workflow execution
- Process status tracking
- Multi-step automation progress
- Pipeline or build status
- Background job monitoring

#### Why Use This
- **Process tracking**: Monitor workflow execution
- **Progress visibility**: Step-by-step progress
- **Status indicators**: Clear pending/running/completed/failed states
- **Current step**: Show what's happening now
- **Completion tracking**: Steps completed vs total

#### Technical Specification

**Required Fields:**
- `workflowId` (string) - Unique workflow identifier
- `name` (string) - Workflow name
- `status` (string) - Workflow status (enum)
  - Valid values: `pending`, `running`, `completed`, `failed`

**Optional Fields:**
- `description` (string) - Workflow description
- `progress` (number) - Progress percentage (0-100)
- `completedSteps` (number) - Number of completed steps
- `totalSteps` (number) - Total number of steps
- `currentStep` (string) - Current step description
- `startTime` (number) - Workflow start timestamp
- `endTime` (number) - Workflow end timestamp
- `errorMessage` (string) - Error message if failed

**Example:**
```javascript
{
  type: "workflow_status",
  data: {
    workflowId: "WF-2025-001",
    name: "Customer Onboarding Pipeline",
    description: "Automated customer setup and configuration",
    status: "running",
    progress: 60,
    completedSteps: 3,
    totalSteps: 5,
    currentStep: "Configuring user permissions",
    startTime: 1735729200000
  },
  order: 0
}
```

#### Common Patterns

**Running workflow:**
```javascript
{
  workflowId: "WF-001",
  name: "Data Processing",
  status: "running",
  progress: 45,
  currentStep: "Processing batch 3 of 7"
}
```

**Completed workflow:**
```javascript
{
  workflowId: "WF-002",
  name: "Deployment Pipeline",
  status: "completed",
  progress: 100,
  completedSteps: 5,
  totalSteps: 5,
  endTime: 1735732800000
}
```

**Failed workflow:**
```javascript
{
  workflowId: "WF-003",
  name: "Backup Process",
  status: "failed",
  progress: 30,
  errorMessage: "Connection timeout to backup server",
  currentStep: "Failed at: Database backup"
}
```

#### Avoid If
- It's a single task, not a workflow (use `task_card` instead)
- It's a manual project, not automated (use `project_card` instead)
- Status isn't about execution (use appropriate card type)

---

## Best Practices

### General Guidelines

#### 1. Keep It Relevant
- Only use rich content when it adds value
- Don't overuse visual elements just because they're available
- Plain text is often better for simple responses

#### 2. Limit Blocks Per Message
- Maximum 10 blocks allowed per message
- Recommended: 1-3 blocks for best user experience
- More blocks = more scrolling = lower engagement

#### 3. Order Matters
```javascript
// Use 'order' field to control display sequence
richContentBlocks: [
  { type: "carousel", data: {...}, order: 0 },    // Shows first
  { type: "button_card", data: {...}, order: 1 }, // Shows second
  { type: "quick_replies", data: {...}, order: 2 } // Shows third
]
```

#### 4. Combine Text + Rich Content
```javascript
{
  chatId: "...",
  content: "Here are our top products this month:",  // Text context
  richContentBlocks: [
    { type: "carousel", data: {...} }  // Visual products
  ]
}
```

### Validation & Error Handling

#### Handle Validation Errors
```javascript
// When sending rich content, check for validation errors in response
{
  error: "Rich content validation failed",
  validationErrors: [
    {
      blockIndex: 0,
      error: "Unsupported platform: facebook"
    }
  ]
}
```

#### Common Validation Issues
1. **Array size limits exceeded**
   - Carousel: max 10 items
   - Gallery: max 20 items
   - Quick replies: max 12
   - Poll: 2-10 options

2. **Missing required fields**
   - Each block type has specific required fields
   - Check technical specifications above

3. **Invalid enum values**
   - Platform names must be exact: "tiktok" not "TikTok"
   - Status values must match exactly

4. **Numeric range violations**
   - Rating must be 0-5
   - Progress must be 0-100
   - Latitude: -90 to 90
   - Longitude: -180 to 180

### Combining Block Types

#### Pattern 1: Visual + Action
```javascript
// Show images, then provide action buttons
[
  { type: "carousel", data: {...}, order: 0 },
  { type: "button_card", data: {...}, order: 1 }
]
```

#### Pattern 2: Information + Response
```javascript
// Display info, then get user input
[
  { type: "product_card", data: {...}, order: 0 },
  { type: "quick_replies", data: {...}, order: 1 }
]
```

#### Pattern 3: Social + Profile
```javascript
// Show social content and creator profile
[
  { type: "social_share", data: {...}, order: 0 },
  { type: "social_profile", data: {...}, order: 1 }
]
```

### Performance Tips

#### 1. Use Thumbnails
```javascript
// Gallery with thumbnails loads faster
{
  type: "gallery",
  data: {
    items: [
      {
        mediaId: "...",
        thumbnailUrl: "https://example.com/thumb.jpg"  // Faster initial load
      }
    ]
  }
}
```

#### 2. Pre-upload Media
```javascript
// Instead of providing URLs (requires download + upload)
media: { url: "https://example.com/large-image.jpg" }

// Use pre-uploaded mediaId (instant)
media: { mediaId: "k7abc123..." }
```

#### 3. Optimize Images
- Use appropriate image sizes
- Don't send 4K images if 1080p suffices
- Consider aspect ratios for better display

### Content Strategy

#### When to Use Multiple Blocks
**Good example:**
```javascript
// Product recommendation with action
[
  { type: "product_card", data: {...} },  // Show product
  { type: "button_card", data: {...} }    // Buy or learn more
]
```

**Bad example:**
```javascript
// Too many blocks, overwhelming
[
  { type: "carousel", ... },
  { type: "gallery", ... },
  { type: "product_card", ... },
  { type: "product_card", ... },
  { type: "button_card", ... },
  { type: "quick_replies", ... }
]
```

#### Progressive Disclosure
Instead of sending everything at once:

```javascript
// Message 1: Show options
{
  content: "What are you interested in?",
  richContentBlocks: [
    { type: "quick_replies", data: {...} }
  ]
}

// Message 2: Based on response, show details
{
  content: "Here are products in that category:",
  richContentBlocks: [
    { type: "carousel", data: {...} }
  ]
}
```

---

## Complete Examples

### Example 1: E-commerce Product Recommendation

**Scenario:** User asks for product recommendations

```javascript
{
  chatId: "user-123",
  content: "Based on your interests, I found these products you might love:",
  richContentBlocks: [
    {
      type: "carousel",
      data: {
        items: [
          {
            imageUrl: "https://store.example.com/img/product1.jpg",
            title: "Wireless Noise-Canceling Headphones",
            subtitle: "$299.99",
            description: "Premium sound quality with 30-hour battery",
            url: "https://store.example.com/products/headphones-pro"
          },
          {
            imageUrl: "https://store.example.com/img/product2.jpg",
            title: "Smart Fitness Watch",
            subtitle: "$399.99",
            description: "Track health metrics and stay connected",
            url: "https://store.example.com/products/fitness-watch"
          },
          {
            imageUrl: "https://store.example.com/img/product3.jpg",
            title: "Portable Bluetooth Speaker",
            subtitle: "$149.99",
            description: "360° sound with waterproof design",
            url: "https://store.example.com/products/speaker"
          }
        ]
      },
      order: 0
    },
    {
      type: "button_card",
      data: {
        title: "Ready to shop?",
        description: "Special offer: 15% off your first purchase!",
        buttons: [
          {
            id: "shop-now",
            label: "Shop Now",
            action: "url",
            url: "https://store.example.com",
            variant: "primary"
          },
          {
            id: "tell-more",
            label: "Tell Me More",
            action: "message",
            message: "I'd like more details about these products",
            variant: "secondary"
          }
        ]
      },
      order: 1
    },
    {
      type: "quick_replies",
      data: {
        replies: [
          { id: "electronics", label: "More Electronics" },
          { id: "deals", label: "Show Deals" },
          { id: "wishlist", label: "Add to Wishlist" }
        ]
      },
      order: 2
    }
  ]
}
```

### Example 2: Event Information with Location

**Scenario:** Informing user about an upcoming event

```javascript
{
  chatId: "user-456",
  content: "Great news! The AI Summit is happening next month. Here are the details:",
  richContentBlocks: [
    {
      type: "event_card",
      data: {
        title: "AI & Machine Learning Summit 2025",
        description: "Join industry leaders for insights on AI, machine learning, and the future of technology. Featuring keynotes, workshops, and networking.",
        startTime: 1735689600000,
        endTime: 1735776000000,
        location: "San Francisco Convention Center, Hall A",
        imageUrl: "https://events.example.com/summit-banner.jpg",
        url: "https://events.example.com/ai-summit-2025/register",
        attendeeCount: 487,
        maxAttendees: 500,
        isVirtual: false
      },
      order: 0
    },
    {
      type: "location_card",
      data: {
        name: "San Francisco Convention Center",
        address: "747 Howard St, San Francisco, CA 94103",
        latitude: 37.7840,
        longitude: -122.4014,
        imageUrl: "https://maps.example.com/sfcc.jpg",
        url: "https://maps.google.com/?q=37.7840,-122.4014"
      },
      order: 1
    },
    {
      type: "button_card",
      data: {
        title: "Register Now",
        description: "Only 13 spots remaining!",
        buttons: [
          {
            id: "register",
            label: "Register for Summit",
            action: "url",
            url: "https://events.example.com/register",
            variant: "primary"
          },
          {
            id: "calendar",
            label: "Add to Calendar",
            action: "workflow",
            workflowId: "add-to-calendar",
            variant: "secondary"
          },
          {
            id: "learn-more",
            label: "Learn More",
            action: "message",
            message: "Tell me more about the AI Summit",
            variant: "outline"
          }
        ]
      },
      order: 2
    }
  ]
}
```

### Example 3: Social Content Sharing

**Scenario:** Sharing viral social media content

```javascript
{
  chatId: "user-789",
  content: "🔥 You've got to see these trending videos about sustainable living!",
  richContentBlocks: [
    {
      type: "social_share",
      data: {
        platform: "tiktok",
        url: "https://www.tiktok.com/@sustainableliving/video/7123456789",
        aspectRatio: "9:16",
        author: {
          name: "Sustainable Living Tips",
          handle: "@sustainableliving",
          avatarUrl: "https://example.com/avatar1.jpg"
        },
        metrics: {
          views: 2500000,
          likes: 450000,
          comments: 23000,
          duration: 58
        }
      },
      order: 0
    },
    {
      type: "social_share",
      data: {
        platform: "instagram",
        url: "https://www.instagram.com/reel/ABC123xyz/",
        aspectRatio: "9:16"
      },
      order: 1
    },
    {
      type: "social_profile",
      data: {
        platform: "tiktok",
        url: "https://www.tiktok.com/@sustainableliving",
        username: "Sustainable Living Tips",
        handle: "@sustainableliving",
        avatarUrl: "https://example.com/avatar1.jpg",
        bio: "Making sustainable living easy & fun 🌱 | Daily tips | Join 1M+ eco-warriors",
        verified: true,
        metrics: {
          followers: 1250000,
          posts: 847
        },
        profileType: "creator"
      },
      order: 2
    },
    {
      type: "quick_replies",
      data: {
        replies: [
          { id: "follow", label: "Follow Creator" },
          { id: "more-eco", label: "More Eco Tips" },
          { id: "save", label: "Save for Later" }
        ]
      },
      order: 3
    }
  ]
}
```

### Example 4: Project Status Update

**Scenario:** Updating team on project progress

```javascript
{
  chatId: "team-channel",
  content: "Weekly project update: We're making great progress on the website redesign!",
  richContentBlocks: [
    {
      type: "project_card",
      data: {
        projectId: "PROJ-2024-WEB",
        name: "Website Redesign Project",
        description: "Complete overhaul with modern design, improved UX, and performance optimization",
        status: "In Progress",
        progress: 68,
        dueDate: 1738368000000,
        assignees: [
          { name: "Alice (Design)", avatarUrl: "https://example.com/alice.jpg" },
          { name: "Bob (Frontend)", avatarUrl: "https://example.com/bob.jpg" },
          { name: "Carol (Backend)", avatarUrl: "https://example.com/carol.jpg" }
        ],
        tags: ["design", "frontend", "priority"]
      },
      order: 0
    },
    {
      type: "task_card",
      data: {
        taskId: "TASK-301",
        title: "Complete Homepage Redesign",
        description: "Finalize hero section and implement new navigation",
        status: "in_progress",
        priority: "high",
        dueDate: 1735689600000,
        assignee: {
          name: "Alice",
          avatarUrl: "https://example.com/alice.jpg"
        }
      },
      order: 1
    },
    {
      type: "workflow_status",
      data: {
        workflowId: "WF-BUILD-123",
        name: "Deployment Pipeline",
        status: "completed",
        progress: 100,
        completedSteps: 5,
        totalSteps: 5,
        currentStep: "Deployed to staging",
        startTime: 1735729200000,
        endTime: 1735730100000
      },
      order: 2
    }
  ]
}
```

### Example 5: Customer Support with Form

**Scenario:** Collecting support information from user

```javascript
{
  chatId: "user-321",
  content: "I'd be happy to help! Please fill out this quick form so I can assist you better:",
  richContentBlocks: [
    {
      type: "form_card",
      data: {
        title: "Support Request",
        description: "Help us understand your issue",
        submitButtonText: "Submit Request",
        fields: [
          {
            id: "issue-type",
            label: "Issue Type",
            type: "select",
            required: true,
            options: [
              { value: "technical", label: "Technical Issue" },
              { value: "billing", label: "Billing Question" },
              { value: "account", label: "Account Access" },
              { value: "other", label: "Other" }
            ]
          },
          {
            id: "priority",
            label: "Priority",
            type: "radio",
            required: true,
            options: [
              { value: "urgent", label: "Urgent - System down" },
              { value: "high", label: "High - Blocking work" },
              { value: "normal", label: "Normal - Can work around" },
              { value: "low", label: "Low - General question" }
            ]
          },
          {
            id: "description",
            label: "Description",
            type: "textarea",
            required: true,
            placeholder: "Please describe your issue in detail..."
          },
          {
            id: "email",
            label: "Contact Email",
            type: "text",
            required: true,
            placeholder: "your.email@example.com"
          },
          {
            id: "callback",
            label: "Request callback",
            type: "checkbox"
          }
        ]
      },
      order: 0
    },
    {
      type: "contact_card",
      data: {
        name: "Emergency Support",
        company: "Our Company",
        phoneNumber: "+1-800-HELP-NOW",
        email: "emergency@example.com"
      },
      order: 1
    }
  ]
}
```

### Example 6: Restaurant Recommendation with Media

**Scenario:** Recommending restaurants with photos and social proof

```javascript
{
  chatId: "user-654",
  content: "Based on your preferences, here are the top Italian restaurants in your area! 🍝",
  media: {
    url: "https://example.com/italian-food-header.jpg",
    contentType: "image/jpeg"
  },
  richContentBlocks: [
    {
      type: "gallery",
      data: {
        items: [
          {
            mediaId: "k7rest1...",
            caption: "Luigi's Trattoria - Authentic pasta"
          },
          {
            mediaId: "k7rest2...",
            caption: "Bella Roma - Wood-fired pizza"
          },
          {
            mediaId: "k7rest3...",
            caption: "Il Giardino - Fine dining"
          },
          {
            mediaId: "k7rest4...",
            caption: "Mama's Kitchen - Family style"
          }
        ],
        columns: 2,
        aspectRatio: "1:1"
      },
      order: 0
    },
    {
      type: "carousel",
      data: {
        items: [
          {
            imageUrl: "https://example.com/luigis.jpg",
            title: "Luigi's Trattoria",
            subtitle: "⭐ 4.8 (340 reviews)",
            description: "Authentic Italian pasta and wine",
            url: "https://maps.example.com/luigis"
          },
          {
            imageUrl: "https://example.com/bella.jpg",
            title: "Bella Roma",
            subtitle: "⭐ 4.7 (520 reviews)",
            description: "Wood-fired Neapolitan pizza",
            url: "https://maps.example.com/bella"
          },
          {
            imageUrl: "https://example.com/giardino.jpg",
            title: "Il Giardino",
            subtitle: "⭐ 4.9 (180 reviews)",
            description: "Upscale Italian fine dining",
            url: "https://maps.example.com/giardino"
          }
        ]
      },
      order: 1
    },
    {
      type: "poll",
      data: {
        question: "Which restaurant interests you most?",
        options: [
          { id: "luigis", text: "Luigi's Trattoria" },
          { id: "bella", text: "Bella Roma" },
          { id: "giardino", text: "Il Giardino" },
          { id: "mamas", text: "Mama's Kitchen" }
        ]
      },
      order: 2
    }
  ]
}
```

---

## Summary

This guide covered all 18 rich content block types available in the A1Zap messaging API. As an AI agent, you now have the knowledge to:

✅ **Choose the right format** for any scenario using the decision tree  
✅ **Understand technical requirements** for each block type  
✅ **Implement rich messaging** with complete, working examples  
✅ **Follow best practices** for performance and user experience  
✅ **Combine multiple blocks** effectively for complex responses  

### Quick Reference

- **Visual Content**: `carousel`, `gallery`, `social_share`, `social_profile`
- **User Interaction**: `button_card`, `quick_replies`, `poll`, `form_card`
- **Information**: `profile_card`, `product_card`, `event_card`, `location_card`, `contact_card`, `link_preview`
- **Workflow**: `task_card`, `project_card`, `reminder_card`, `workflow_status`

### Remember

- Keep it simple - don't overuse rich content
- Max 10 blocks per message (recommended 1-3)
- Always provide text content alongside blocks
- Test thoroughly and handle validation errors
- Use the right format for the right purpose

Happy messaging! 🚀

