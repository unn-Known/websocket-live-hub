// WebSocket Connection Manager
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.url = '';
        this.messageCount = 0;
        this.connectionStartTime = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        // Get DOM elements
        this.wsUrlInput = document.getElementById('wsUrl');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.logContainer = document.getElementById('logContainer');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.serverInfo = document.getElementById('serverInfo');
        this.connectionTime = document.getElementById('connectionTime');
        this.messageCountSpan = document.getElementById('messageCount');

        // Attach event listeners
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.clearBtn.addEventListener('click', () => this.clearLog());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.sendMessage();
            }
        });

        // Attach preset button listeners
        const presetButtons = document.querySelectorAll('.btn-preset');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                this.wsUrlInput.value = url;
                this.log(`WebSocket URL set to: ${url}`, 'info');
            });
        });
    }

    connect() {
        this.url = this.wsUrlInput.value.trim();

        if (!this.url) {
            this.log('Error: Please enter a WebSocket URL', 'error');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.log('Warning: Already connected. Disconnect first.', 'warning');
            return;
        }

        this.log(`Attempting to connect to: ${this.url}`, 'info');

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (event) => this.handleError(event);
            this.ws.onclose = () => this.handleClose();
        } catch (error) {
            this.log(`Error creating WebSocket: ${error.message}`, 'error');
            this.updateStatus(false);
        }
    }

    handleOpen() {
        this.isConnected = true;
        this.messageCount = 0;
        this.connectionStartTime = Date.now();
        this.log('Connection established successfully!', 'info');
        this.updateStatus(true);
        this.connectBtn.disabled = true;
        this.disconnectBtn.disabled = false;
        this.sendBtn.disabled = false;
        this.wsUrlInput.disabled = true;
        this.startConnectionTimer();
    }

    handleMessage(event) {
        this.messageCount++;
        const timestamp = this.getTimestamp();
        const data = event.data;

        try {
            // Try to parse as JSON for better formatting
            const jsonData = JSON.parse(data);
            this.log(`${timestamp} [RECEIVED] ${JSON.stringify(jsonData, null, 2)}`, 'received');
        } catch {
            // If not JSON, display as-is
            this.log(`${timestamp} [RECEIVED] ${data}`, 'received');
        }

        this.messageCountSpan.textContent = this.messageCount;
    }

    handleError(event) {
        this.log('WebSocket Error occurred', 'error');
        console.error('WebSocket error:', event);
    }

    handleClose() {
        this.isConnected = false;
        this.log('Connection closed', 'warning');
        this.updateStatus(false);
        this.connectBtn.disabled = false;
        this.disconnectBtn.disabled = true;
        this.sendBtn.disabled = true;
        this.wsUrlInput.disabled = false;
        this.connectionTime.textContent = '--:--:--';
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.log('Disconnecting...', 'info');
        }
    }

    sendMessage() {
        if (!this.isConnected) {
            this.log('Error: Not connected to any WebSocket server', 'error');
            return;
        }

        const message = this.messageInput.value.trim();

        if (!message) {
            this.log('Error: Message cannot be empty', 'error');
            return;
        }

        try {
            this.ws.send(message);
            const timestamp = this.getTimestamp();
            this.log(`${timestamp} [SENT] ${message}`, 'sent');
            this.messageInput.value = '';
        } catch (error) {
            this.log(`Error sending message: ${error.message}`, 'error');
        }
    }

    updateStatus(connected) {
        if (connected) {
            this.statusDot.className = 'status-dot connected';
            this.statusText.textContent = 'Connected';
            this.serverInfo.textContent = this.url;
        } else {
            this.statusDot.className = 'status-dot disconnected';
            this.statusText.textContent = 'Disconnected';
            this.serverInfo.textContent = 'Not connected';
        }
    }

    startConnectionTimer() {
        setInterval(() => {
            if (this.isConnected && this.connectionStartTime) {
                const elapsed = Date.now() - this.connectionStartTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.connectionTime.textContent = 
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    log(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${this.getTimestamp()}]</span> ${this.escapeHtml(message)}`;
        this.logContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    clearLog() {
        this.logContainer.innerHTML = '<div class="log-entry info">Log cleared at ' + this.getTimestamp() + '</div>';
    }

    getTimestamp() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${ms}`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize WebSocket Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.wsManager = new WebSocketManager();
});
