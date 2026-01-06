# Cloak - Screen-Sharing Invisible AI Assistant

A native Electron app with dual modes: **Gemini Chat** (text) and **Vapi Interview** (voice). The window remains visible to you but invisible to screen sharing.

## ✅ Verified Working

This app uses Electron's `setContentProtection(true)` which successfully hides the window from:
- Zoom, Teams, Discord screen sharing
- macOS screen recording
- Most screen capture tools

## Features

### 🔀 Dual Mode Support

**Gemini Chat Mode:**
- Text-based AI conversation
- Powered by Gemini 2.5 Flash
- Real-time chat interface

**Vapi Interview Mode:**
- Real-time voice AI interview
- WebSocket + WebRTC connection
- Live voice transcription
- Interactive voice responses

## Quick Start

1. **Install dependencies**:
```bash
pnpm install
```

2. **Configure API keys** in `.env`:
```env
GEMINI_API_KEY=your_gemini_key
VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_ASSISTANT_ID=your_vapi_assistant_id
```

3. **Run the app**:
```bash
pnpm start
```

## Usage

### Switching Modes
- Use the left sidebar to toggle between **Gemini Chat** and **Vapi Interview**

### Gemini Chat Mode
- Type your message and press **Ctrl+Enter** or click **Send Message**
- AI responds with text

### Vapi Interview Mode
- Click **Start Interview** to begin voice conversation
- Speak naturally - your voice is transcribed in real-time
- AI responds with voice
- Click **End Interview** to stop

## Configuration

Edit `.env` file:
```env
# Gemini (required for chat mode)
GEMINI_API_KEY=your_key_here

# Vapi (required for interview mode)
VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_ASSISTANT_ID=your_assistant_id
```

Get your keys:
- **Gemini**: https://makersuite.google.com/app/apikey
- **Vapi**: https://vapi.ai (sign up and create an assistant)

## Technical Details

### Screen Sharing Invisibility
```javascript
window.setContentProtection(true);
```

### Vapi Integration
- Uses `@vapi-ai/web` SDK (v2.5.2)
- WebSocket for signaling and messages
- WebRTC for real-time audio streaming
- Automatic microphone access
- Live transcription and voice responses

## Files

- `main.js` - Electron main process
- `index.html` - UI with sidebar and dual-mode interface
- `renderer.js` - Chat logic, Gemini API, and Vapi WebSocket/WebRTC integration
- `.env` - API keys
