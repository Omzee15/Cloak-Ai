const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

let messages = [];
let isLoading = false;

// DOM elements
const chatContainer = document.getElementById('chat-container');
const inputText = document.getElementById('input-text');
const sendBtn = document.getElementById('send-btn');
const statusEl = document.getElementById('status');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (!GEMINI_API_KEY) {
        statusEl.textContent = '⚠️ API Key Not Configured';
        statusEl.style.color = '#fbbf24';
        addMessage('ai', 'Error: GEMINI_API_KEY not found in .env file. Please configure it.');
    } else {
        addMessage('ai', 'Hello! I\'m your AI assistant powered by Gemini 2.5 Flash. This window is invisible to screen sharing. How can I help you today?');
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    inputText.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});

function addMessage(sender, text) {
    const message = {
        id: Date.now(),
        sender,
        text,
        timestamp: new Date()
    };
    messages.push(message);
    renderMessage(message);
    scrollToBottom();
}

function renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.innerHTML = `
        <div class="message-icon">${message.sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender ${message.sender}">${message.sender === 'user' ? 'You' : 'AI'}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
        </div>
    `;
    chatContainer.appendChild(messageEl);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = inputText.value.trim();
    if (!text || isLoading || !GEMINI_API_KEY) return;

    // Add user message
    addMessage('user', text);
    inputText.value = '';

    // Set loading state
    isLoading = true;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Thinking...';

    try {
        const response = await callGeminiAPI(text);
        addMessage('ai', response);
    } catch (error) {
        addMessage('ai', `Error: ${error.message}`);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Message';
        inputText.focus();
    }
}

async function callGeminiAPI(message) {
    const url = `${API_URL}?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
        contents: [{
            parts: [{ text: message }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        return text;
    } else {
        throw new Error('Invalid response format from API');
    }
}
