const { default: Vapi } = require('@vapi-ai/web');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VAPI_PUBLIC_KEY = process.env.VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

let messages = [];
let isLoading = false;
let currentMode = 'gemini';
let vapiInstance = null;
let isCallActive = false;
let speakOutputEnabled = true; // Default to enabled
let currentAssistantMessage = null;
let isSpeakerMuted = false;
let isMicMuted = false;

// DOM elements
const chatContainer = document.getElementById('chat-container');
const inputText = document.getElementById('input-text');
const sendBtn = document.getElementById('send-btn');
const statusEl = document.getElementById('status');
const modeOptions = document.querySelectorAll('.mode-option');
const headerTitle = document.getElementById('header-title');
const modeStatus = document.getElementById('mode-status');
const geminiInputArea = document.getElementById('gemini-input-area');
const headerControls = document.getElementById('header-controls');
const startInterviewBtn = document.getElementById('start-interview-btn-header');
const interviewIcon = document.getElementById('interview-icon-header');
const interviewText = document.getElementById('interview-text-header');
const vapiStatus = document.getElementById('vapi-status-header');
const muteSpeakerBtn = document.getElementById('mute-speaker-btn');
const muteMicBtn = document.getElementById('mute-mic-btn');
const speakerIcon = document.getElementById('speaker-icon');
const micIcon = document.getElementById('mic-icon');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Check API keys
    if (!GEMINI_API_KEY) {
        statusEl.textContent = '⚠️ Gemini API Key Not Configured';
        statusEl.style.color = '#fbbf24';
    }

    // Initialize Vapi
    console.log('Initializing Vapi...');
    console.log('VAPI_PUBLIC_KEY:', VAPI_PUBLIC_KEY ? 'Set' : 'Not Set');
    console.log('VAPI_ASSISTANT_ID:', VAPI_ASSISTANT_ID ? VAPI_ASSISTANT_ID : 'Not Set');
    
    if (VAPI_PUBLIC_KEY) {
        try {
            vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
            console.log('✅ Vapi instance created successfully');
            setupVapiListeners();
        } catch (error) {
            console.error('❌ Failed to create Vapi instance:', error);
            statusEl.textContent = '⚠️ Vapi initialization failed';
            statusEl.style.color = '#fbbf24';
        }
    } else {
        console.warn('⚠️ VAPI_PUBLIC_KEY not configured');
    }

    // Add welcome message
    addMessage('ai', 'Choose a mode to get started.');

    // Mode switching
    modeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            switchMode(mode);
        });
    });

    // Gemini event listeners
    sendBtn.addEventListener('click', sendMessage);
    inputText.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    // Vapi event listeners
    startInterviewBtn.addEventListener('click', toggleInterview);

    // Speaker mute toggle
    muteSpeakerBtn.addEventListener('click', () => {
        isSpeakerMuted = !isSpeakerMuted;
        muteSpeakerBtn.classList.toggle('muted', isSpeakerMuted);
        speakerIcon.textContent = isSpeakerMuted ? '🔇' : '🔊';
        
        if (isCallActive) {
            if (isSpeakerMuted) {
                muteAssistantAudio();
            } else {
                unmuteAssistantAudio();
            }
        }
    });

    // Microphone mute toggle
    muteMicBtn.addEventListener('click', () => {
        isMicMuted = !isMicMuted;
        muteMicBtn.classList.toggle('muted', isMicMuted);
        micIcon.textContent = isMicMuted ? '🔇' : '🎤';
        
        if (isCallActive && vapiInstance) {
            try {
                if (typeof vapiInstance.setMuted === 'function') {
                    vapiInstance.setMuted(isMicMuted);
                }
            } catch (error) {
                console.error('Error toggling microphone:', error);
            }
        }
    });
});

function switchMode(mode) {
    currentMode = mode;
    
    // Update sidebar
    modeOptions.forEach(opt => {
        if (opt.dataset.mode === mode) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // Update header and UI
    if (mode === 'gemini') {
        headerTitle.textContent = 'Gemini Chat';
        modeStatus.textContent = 'AI-powered text conversation';
        geminiInputArea.style.display = 'block';
        headerControls.style.display = 'none';
        
        // Stop Vapi if active
        if (isCallActive && vapiInstance) {
            vapiInstance.stop();
        }
    } else if (mode === 'vapi') {
        headerTitle.textContent = 'Vapi Interview';
        modeStatus.textContent = 'AI-powered voice interview';
        geminiInputArea.style.display = 'none';
        headerControls.style.display = 'flex';
        
        if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
            vapiStatus.textContent = '⚠️ Not configured';
            vapiStatus.className = 'error';
            startInterviewBtn.disabled = true;
        } else {
            vapiStatus.textContent = 'Ready';
            vapiStatus.className = '';
            startInterviewBtn.disabled = false;
        }
    }

    // Clear chat and add mode-specific welcome message
    clearChat();
    if (mode === 'gemini') {
        addMessage('ai', 'How can I help you today?');
    } else {
        addMessage('ai', 'Voice interview ready. Click \"Start\" to begin.');
    }
}

function clearChat() {
    messages = [];
    chatContainer.innerHTML = '';
}

// ========== GEMINI FUNCTIONS ==========

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
    if (currentMode !== 'gemini') return;
    
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

// ========== VAPI FUNCTIONS ==========

function setupVapiListeners() {
    console.log('📡 Setting up Vapi listeners...');
    
    // Call started
    vapiInstance.on('call-start', () => {
        console.log('✅ Event: call-start');
        isCallActive = true;
        currentAssistantMessage = null;
        updateInterviewButton(true);
        vapiStatus.textContent = '🟢 Active';
        vapiStatus.className = 'connected';
        
        // Apply speaker mute if needed
        if (isSpeakerMuted) {
            console.log('🔇 Applying speaker mute');
            muteAssistantAudio();
            setTimeout(() => muteAssistantAudio(), 100);
            setTimeout(() => muteAssistantAudio(), 500);
            setTimeout(() => muteAssistantAudio(), 1000);
        }
    });

    // Call ended
    vapiInstance.on('call-end', () => {
        console.log('✅ Event: call-end');
        isCallActive = false;
        currentAssistantMessage = null;
        updateInterviewButton(false);
        vapiStatus.textContent = 'Ready';
        vapiStatus.className = '';
    });

    // Speech started (user started speaking)
    vapiInstance.on('speech-start', () => {
        console.log('🎤 Event: speech-start - User started speaking');
        currentAssistantMessage = null;
    });

    // Speech ended (user stopped speaking)
    vapiInstance.on('speech-end', () => {
        console.log('🎤 Event: speech-end - User stopped speaking');
    });

    // Transcript message (real-time user speech)
    vapiInstance.on('message', (message) => {
        console.log('📩 Event: message -', message.type, message.role || '');
        
        if (message.type === 'transcript' && message.transcriptType === 'final') {
            // Add user's final transcript
            addMessage('user', message.transcript);
        }
        
        // AI response transcript - accumulate into single message
        if (message.type === 'transcript' && message.role === 'assistant') {
            if (!currentAssistantMessage) {
                // Create new assistant message
                currentAssistantMessage = {
                    id: Date.now(),
                    sender: 'ai',
                    text: message.transcript,
                    timestamp: new Date()
                };
                messages.push(currentAssistantMessage);
                renderMessage(currentAssistantMessage);
            } else {
                // Update existing assistant message by appending new text
                currentAssistantMessage.text += ' ' + message.transcript;
                // Update the DOM
                const lastMessageEl = chatContainer.lastChild;
                if (lastMessageEl) {
                    const textEl = lastMessageEl.querySelector('.message-text');
                    if (textEl) {
                        textEl.textContent = currentAssistantMessage.text;
                    }
                }
            }
            scrollToBottom();
        }
    });

    // Errors
    vapiInstance.on('error', (error) => {
        console.error('❌ Event: error');
        console.error('Error object:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        
        const errorMessage = error.message || error.toString() || 'Unknown error';
        vapiStatus.textContent = `❌ Error`;
        vapiStatus.className = 'error';
        console.error('Error displayed to user:', errorMessage);
        isCallActive = false;
        updateInterviewButton(false);
    });
    
    console.log('✅ Vapi listeners configured');
}

async function toggleInterview() {
    console.log('=== toggleInterview called ===');
    console.log('vapiInstance:', vapiInstance ? 'exists' : 'null');
    console.log('VAPI_ASSISTANT_ID:', VAPI_ASSISTANT_ID);
    console.log('isCallActive:', isCallActive);
    
    if (!vapiInstance) {
        console.error('❌ Vapi instance not initialized');
        vapiStatus.textContent = '⚠️ Vapi not initialized';
        vapiStatus.className = 'error';
        return;
    }
    
    if (!VAPI_ASSISTANT_ID) {
        console.error('❌ VAPI_ASSISTANT_ID not configured');
        vapiStatus.textContent = '⚠️ Assistant ID not configured';
        vapiStatus.className = 'error';
        return;
    }

    if (isCallActive) {
        // Stop the interview
        console.log('🛑 Stopping interview...');
        try {
            vapiInstance.stop();
            console.log('✅ Stop called successfully');
        } catch (error) {
            console.error('❌ Error stopping interview:', error);
        }
    } else {
        // Start the interview
        console.log('🚀 Starting interview...');
        try {
            startInterviewBtn.disabled = true;
            vapiStatus.textContent = '🔄 Connecting...';
            vapiStatus.className = '';
            currentAssistantMessage = null;
            
            // Start call with assistant ID
            console.log('Calling vapiInstance.start() with assistantId:', VAPI_ASSISTANT_ID);
            console.log('Speak output enabled:', speakOutputEnabled);
            
            if (!speakOutputEnabled) {
                console.log('🔇 Speak output is disabled');
                // Note: Voice muting should be configured in Vapi assistant settings
                // The SDK doesn't support runtime voice muting via config
            }
            
            const result = await vapiInstance.start(VAPI_ASSISTANT_ID);
            console.log('✅ Start result:', result);
            
        } catch (error) {
            console.error('❌ Failed to start interview');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            
            const errorMessage = error.message || error.toString() || 'Unknown error';
            vapiStatus.textContent = `❌ Failed: ${errorMessage}`;
            vapiStatus.className = 'error';
            startInterviewBtn.disabled = false;
            console.error('Full error details:', errorMessage);
        }
    }
}

function updateInterviewButton(active) {
    if (active) {
        startInterviewBtn.classList.add('active');
        interviewIcon.textContent = '⏹️';
        interviewText.textContent = 'Stop';
        startInterviewBtn.disabled = false;
    } else {
        startInterviewBtn.classList.remove('active');
        interviewIcon.textContent = '🎙️';
        interviewText.textContent = 'Start';
        startInterviewBtn.disabled = false;
    }
}

// ========== AUDIO CONTROL FUNCTIONS ==========

function muteAssistantAudio() {
    console.log('🔇 Attempting to mute assistant audio output only (keeping mic active)...');
    
    try {
        // Method 1: Mute all HTML audio elements (this is where Vapi plays assistant voice)
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((audio, index) => {
            audio.muted = true;
            audio.volume = 0;
            console.log(`✅ Muted audio element ${index} (assistant output)`);
        });
        
        // Method 2: Find remote audio context and mute it
        // The Vapi SDK creates audio elements for playback, we just muted those above
        // DO NOT mute vapiInstance.mediaStream - that's the user's microphone!
        
        console.log(`✅ Assistant audio muted (found ${audioElements.length} audio elements)`);
    } catch (error) {
        console.error('❌ Error muting audio:', error);
    }
}

function unmuteAssistantAudio() {
    console.log('🔊 Attempting to unmute assistant audio output...');
    
    try {
        // Unmute all HTML audio elements
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((audio, index) => {
            audio.muted = false;
            audio.volume = 1;
            console.log(`✅ Unmuted audio element ${index} (assistant output)`);
        });
        
        console.log(`✅ Assistant audio unmuted (found ${audioElements.length} audio elements)`);
    } catch (error) {
        console.error('❌ Error unmuting audio:', error);
    }
}

// Monitor for any new audio elements being added to the DOM
const audioObserver = new MutationObserver((mutations) => {
    if (isSpeakerMuted && isCallActive) {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'AUDIO') {
                    console.log('🔇 New audio element detected, muting it immediately');
                    node.muted = true;
                    node.volume = 0;
                    
                    // Also listen for any play events to re-mute if needed
                    node.addEventListener('play', () => {
                        if (isSpeakerMuted && isCallActive) {
                            console.log('🔇 Audio element tried to play, re-muting');
                            node.muted = true;
                            node.volume = 0;
                        }
                    });
                }
            });
        });
    }
});

// Start observing the document for audio elements
audioObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Also continuously check and mute audio elements while speaker is muted
setInterval(() => {
    if (isSpeakerMuted && isCallActive) {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((audio) => {
            if (!audio.muted || audio.volume !== 0) {
                console.log('🔇 Re-muting audio element that became unmuted');
                audio.muted = true;
                audio.volume = 0;
            }
        });
    }
}, 100); // Check every 100ms