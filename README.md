# Cloak - Screen-Sharing Invisible AI Assistant

A native Electron app powered by Gemini 2.5 Flash that remains visible to you but invisible to screen sharing.

## ✅ Verified Working

This app uses Electron's `setContentProtection(true)` which successfully hides the window from:
- Zoom screen sharing
- Teams screen sharing
- Discord screen sharing
- macOS screen recording
- Most screen capture tools

## Quick Start

1. **Install dependencies** (if not already done):
```bash
pnpm install
```

2. **Run the app**:
```bash
pnpm start
```

The window will open and you can start chatting with the AI. It will be visible on your screen but invisible to anyone viewing your screen share.

## Configuration

Your API key is stored in `.env`:
```
GEMINI_API_KEY=your_key_here
```

## Usage

- Type your message and press **Ctrl+Enter** or click **Send Message**
- The AI will respond using Gemini 2.5 Flash
- Press **⌘Q** to quit

## Files

- `main.js` - Electron main process with content protection
- `index.html` - Chat UI
- `renderer.js` - Chat logic and Gemini API integration
- `.env` - API key configuration

## How It Works

```javascript
// main.js
window.setContentProtection(true);
```

This native Electron API tells macOS to exclude the window from screen captures and screen sharing.
