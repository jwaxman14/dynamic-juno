const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const activeAgentName = document.getElementById('active-agent-name');
const bookNameDisplay = document.getElementById('book-name-display');
const researchState = document.getElementById('research-state');
const editorState = document.getElementById('editor-state');

// Generate or retrieve a session ID
let sessionId = localStorage.getItem('wt_session_id');
if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('wt_session_id', sessionId);
}

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.scrollHeight > 200) {
        this.style.overflowY = 'scroll';
    } else {
        this.style.overflowY = 'hidden';
    }
});

// Handle Enter to submit (Shift+Enter for newline)
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

function appendMessage(role, text, author = 'coordinator') {
    const div = document.createElement('div');
    div.className = `message ${role} ${author}`;
    
    let contentHtml = text;
    if (role === 'assistant') {
        // Use marked.js to parse markdown
        contentHtml = marked.parse(text);
        
        // Add author badge if not coordinator
        let authorBadge = '';
        if (author && author !== 'coordinator') {
            const prettyAuthor = author.replace('_agent', '').charAt(0).toUpperCase() + author.replace('_agent', '').slice(1);
            authorBadge = `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase;">${prettyAuthor}</div>`;
        }
        
        div.innerHTML = `
            <div class="message-content">
                ${authorBadge}
                ${contentHtml}
            </div>
        `;
    } else {
        div.innerHTML = `<div class="message-content">${text}</div>`;
    }
    
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function applyState(state) {
    if (state.book_name) {
        bookNameDisplay.textContent = state.book_name;
    }
    if (state.current_agent) {
        const display = state.current_agent.replace('_agent', '');
        activeAgentName.textContent = display.charAt(0).toUpperCase() + display.slice(1);
    }
    if (state.research_status) {
        researchState.innerHTML = marked.parse(state.research_status);
    }
    if (state.editor_status) {
        editorState.innerHTML = marked.parse(state.editor_status);
    }
}

async function fetchState() {
    try {
        const res = await fetch(`/api/state/${sessionId}`);
        if (res.ok) {
            const state = await res.json();
            applyState(state);
        }
    } catch(e) {
        console.error("Failed to fetch state", e);
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    // UI Update
    appendMessage('user', text);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    activeAgentName.textContent = "Thinking...";

    // Temporary loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant coordinator';
    loadingDiv.id = 'loading-message';
    loadingDiv.innerHTML = '<div class="message-content"><span style="opacity: 0.5;">Typing...</span></div>';
    chatHistory.appendChild(loadingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, session_id: sessionId })
        });

        // Remove loading message
        document.getElementById('loading-message')?.remove();

        // Read Server-Sent Events (Line delimited JSON)
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6);
                    try {
                        const data = JSON.parse(dataStr);
                        
                        if (data.type === 'status' && data.author) {
                            const displayName = data.author.replace('_agent', '');
                            activeAgentName.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1) + " is typing...";
                        } else if (data.type === 'state') {
                            // Real-time panel update from mid-stream state event
                            applyState(data);
                        } else if (data.type === 'message') {
                            appendMessage('assistant', data.text, data.author);
                        } else if (data.type === 'error') {
                            appendMessage('assistant', `**Error**: ${data.text}`);
                        }
                    } catch (err) {
                        console.error('JSON parse error:', err, dataStr);
                    }
                }
            }
        }
        
        // Final state refresh after stream completes
        fetchState();
        
    } catch (error) {
        document.getElementById('loading-message')?.remove();
        appendMessage('assistant', '**Connection Error**: Could not reach the server.');
    } finally {
        sendButton.disabled = false;
        activeAgentName.textContent = "Idle";
    }
});

// Initial state fetch
fetchState();
setInterval(fetchState, 5000); // Polling as a fallback safety net
