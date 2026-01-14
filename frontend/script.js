const API_URL = 'http://localhost:3000/api/messages'; // Assuming local dev

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('messageForm');
    const contentInput = document.getElementById('content');
    const refreshBtn = document.getElementById('refreshBtn');

    // Load messages on start
    fetchMessages();

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const content = document.getElementById('content').value;
        const avatar = document.getElementById('avatar').value;

        if (!username || !content) return;

        const submitBtn = form.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmitting...';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, content, character_avatar: avatar })
            });

            if (response.ok) {
                contentInput.value = ''; // Clear message but keep username
                fetchMessages();
            } else {
                alert('Transmission failed.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Lost connection to the Upside Down.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'SEND TRANSMISSION';
        }
    });

    // Handle Refresh
    refreshBtn.addEventListener('click', fetchMessages);

    // Auto-refresh every 10 seconds
    setInterval(fetchMessages, 10000);
});

async function fetchMessages() {
    const container = document.getElementById('messagesContainer');
    // Don't show loading on auto-refresh to avoid flickering, only on initial load if empty
    if (container.children.length === 0) {
        container.innerHTML = '<div class="loading">Aligning satellite dish...</div>';
    }

    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.message === 'success') {
            renderMessages(result.data);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        container.innerHTML = '<div class="loading" style="color:var(--red-glow)">SIGNAL LOST</div>';
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    messages.forEach(msg => {
        const date = new Date(msg.timestamp).toLocaleString();

        const card = document.createElement('div');
        card.className = 'message-card';

        // Simple avatar visual (could be improved with images)
        const avatarInitial = msg.character_avatar ? msg.character_avatar[0].toUpperCase() : '?';
        const avatarColor = getAvatarColor(msg.character_avatar);

        card.innerHTML = `
            <div class="meta-info">
                <span class="user-tag">
                    <span class="avatar-icon" style="background:${avatarColor}">${avatarInitial}</span>
                    ${escapeHtml(msg.username)}
                </span>
                <span class="timestamp">${date}</span>
            </div>
            <div class="msg-content">${escapeHtml(msg.content)}</div>
        `;

        container.appendChild(card);
    });
}

function getAvatarColor(char) {
    const colors = {
        'eleven': '#ff00ae',
        'mike': '#3498db',
        'dustin': '#2ecc71',
        'lucas': '#e67e22',
        'will': '#9b59b6',
        'max': '#e74c3c',
        'steve': '#f1c40f',
        'hopper': '#95a5a6',
        'demogorgon': '#34495e'
    };
    return colors[char] || '#555';
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
