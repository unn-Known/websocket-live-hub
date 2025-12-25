// Advanced WebSocket Manager with Analytics, Alerts, History, and Export
class AdvancedWebSocketManager {
    constructor() {
        this.ws = null;
        this.url = '';
        this.messageCount = 0;
        this.connectionStartTime = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.autoReconnect = true;
        this.reconnectInterval = null;
        this.messages = [];
        this.alerts = [];
        this.history = [];
        this.stats = {
            startTime: null,
            totalMessages: 0,
            messageRates: [],
            messageSizes: [],
            messageTypes: {},
            alerts: []
        };
        this.charts = {};
        this.init();
    }

    init() {
        // DOM Elements
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
        this.reconnectCountSpan = document.getElementById('reconnectCount');
        this.autoReconnectCheckbox = document.getElementById('autoReconnect');
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.filterInput = document.getElementById('filterInput');
        
        // Import XML elements
        this.importUrl = document.getElementById('importUrl');
        this.importXpath = document.getElementById('importXpath');
        this.importMode = document.getElementById('importMode');
        this.importLimit = document.getElementById('importLimit');
        this.importBtn = document.getElementById('importBtn');
        this.importClearBtn = document.getElementById('importClearBtn');
        this.importStatus = document.getElementById('importStatus');
        this.importResults = document.getElementById('importResults');
        this.importHistory = document.getElementById('importHistory');
        this.importQueries = [];
        
        // Tab buttons
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Analytics
        this.statTotalMessages = document.getElementById('statTotalMessages');
        this.statMessagesPerSec = document.getElementById('statMessagesPerSec');
        this.statAvgSize = document.getElementById('statAvgSize');
        this.statUptime = document.getElementById('statUptime');
        
        // Alerts
        this.alertField = document.getElementById('alertField');
        this.alertCondition = document.getElementById('alertCondition');
        this.alertValue = document.getElementById('alertValue');
        this.addAlertBtn = document.getElementById('addAlertBtn');
        this.alertsList = document.getElementById('alertsList');
        this.alertsLog = document.querySelector('#alerts-tab .log-container');
        
        // Export
        this.exportFormat = document.getElementById('exportFormat');
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.exportStatsBtn = document.getElementById('exportStatsBtn');
        this.exportChartBtn = document.getElementById('exportChartBtn');
        this.exportPreview = document.getElementById('exportPreview');
        
        // History
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.attachEventListeners();
        this.loadHistory();
        this.loadDarkMode();
        this.startStatsUpdate();
    }

    attachEventListeners() {
        // Connection
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.clearBtn.addEventListener('click', () => this.clearLog());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.sendMessage();
        });
        
        // Preset buttons
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.wsUrlInput.value = e.target.getAttribute('data-url');
                this.log(`WebSocket URL set to: ${e.target.getAttribute('data-url')}`, 'info');
            });
        });
        
        // Import XML
        this.importBtn.addEventListener('click', () => this.importXML());
        this.importClearBtn.addEventListener('click', () => this.clearImportResults());
        this.importUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.importXML();
        });
        this.importXpath.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.importXML();
        });
        
        // Tabs
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.getAttribute('data-tab')));
        });
        
        // Dark mode
        this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
        
        // Filter
        this.filterInput.addEventListener('input', (e) => this.filterMessages(e.target.value));
        
        // Alerts
        this.addAlertBtn.addEventListener('click', () => this.addAlert());
        
        // Export
        this.exportDataBtn.addEventListener('click', () => this.exportMessages());
        this.exportStatsBtn.addEventListener('click', () => this.exportStatistics());
        this.exportChartBtn.addEventListener('click', () => this.exportCharts());
        
        // History
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Auto reconnect
        this.autoReconnectCheckbox.addEventListener('change', (e) => {
            this.autoReconnect = e.target.checked;
        });
    }

    switchTab(tabName) {
        // Remove active from all tabs and contents
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active to selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Initialize charts when analytics tab is opened
        if (tabName === 'analytics') {
            setTimeout(() => this.initializeCharts(), 100);
        }
    }

    connect() {
        this.url = this.wsUrlInput.value.trim();
        if (!this.url) {
            this.log('Error: Please enter a WebSocket URL', 'error');
            return;
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.log('Warning: Already connected', 'warning');
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
            this.log(`Error: ${error.message}`, 'error');
        }
    }

    handleOpen() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.messageCount = 0;
        this.connectionStartTime = Date.now();
        this.stats.startTime = Date.now();
        
        this.log('✅ Connection established successfully!', 'info');
        this.updateStatus(true);
        this.updateConnectionUI();
        
        // Save to history
        this.addToHistory(this.url);
        
        // Reset stats
        this.stats.totalMessages = 0;
        this.stats.messageRates = [];
        this.stats.messageSizes = [];
        this.stats.messageTypes = {};
    }

    handleMessage(event) {
        this.messageCount++;
        this.stats.totalMessages++;
        const timestamp = this.getTimestamp();
        const data = event.data;
        const messageSize = new Blob([data]).size;
        
        this.stats.messageSizes.push(messageSize);
        this.messages.push({ timestamp, data, size: messageSize });
        
        try {
            const jsonData = JSON.parse(data);
            this.log(`${timestamp} [RECEIVED] ${JSON.stringify(jsonData, null, 2)}`, 'received');
            
            // Update message types
            for (let key in jsonData) {
                this.stats.messageTypes[key] = (this.stats.messageTypes[key] || 0) + 1;
            }
            
            // Check alerts
            this.checkAlerts(jsonData);
        } catch {
            this.log(`${timestamp} [RECEIVED] ${data}`, 'received');
        }
        
        this.messageCountSpan.textContent = this.messageCount;
        this.updateExportPreview();
    }

    handleError(event) {
        this.log('❌ WebSocket Error occurred', 'error');
    }

    handleClose() {
        this.isConnected = false;
        this.log('⚠️ Connection closed', 'warning');
        this.updateStatus(false);
        this.updateConnectionUI();
        
        // Auto-reconnect logic
        if (this.autoReconnect && this.reconnectAttempts < 5) {
            this.reconnectAttempts++;
            this.reconnectCountSpan.textContent = this.reconnectAttempts;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
            this.log(`🔄 Reconnecting in ${delay / 1000}s (Attempt ${this.reconnectAttempts})...`, 'warning');
            
            setTimeout(() => this.connect(), delay);
        }
    }

    disconnect() {
        if (this.ws) {
            this.autoReconnect = false;
            this.ws.close();
            this.log('Disconnecting...', 'info');
        }
    }

    sendMessage() {
        if (!this.isConnected) {
            this.log('Error: Not connected', 'error');
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
            this.updateExportPreview();
        } catch (error) {
            this.log(`Error: ${error.message}`, 'error');
        }
    }

    updateStatus(connected) {
        if (connected) {
            this.statusDot.className = 'status-dot connected';
            this.statusText.textContent = '🟢 Connected';
            this.serverInfo.textContent = this.url;
        } else {
            this.statusDot.className = 'status-dot disconnected';
            this.statusText.textContent = '🔴 Disconnected';
            this.serverInfo.textContent = 'Not connected';
        }
    }

    updateConnectionUI() {
        if (this.isConnected) {
            this.connectBtn.disabled = true;
            this.disconnectBtn.disabled = false;
            this.sendBtn.disabled = false;
            this.wsUrlInput.disabled = true;
        } else {
            this.connectBtn.disabled = false;
            this.disconnectBtn.disabled = true;
            this.sendBtn.disabled = true;
            this.wsUrlInput.disabled = false;
            this.connectionTime.textContent = '--:--:--';
        }
    }

    startStatsUpdate() {
        setInterval(() => {
            if (this.isConnected) {
                // Update connection time
                const elapsed = Date.now() - this.connectionStartTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.connectionTime.textContent = 
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                // Update statistics
                const totalTime = (Date.now() - this.stats.startTime) / 1000;
                const messagesPerSec = this.stats.totalMessages / totalTime;
                const avgSize = this.stats.messageSizes.length > 0 
                    ? (this.stats.messageSizes.reduce((a, b) => a + b, 0) / this.stats.messageSizes.length).toFixed(0)
                    : 0;
                
                this.statTotalMessages.textContent = this.stats.totalMessages;
                this.statMessagesPerSec.textContent = messagesPerSec.toFixed(2);
                this.statAvgSize.textContent = `${avgSize} B`;
                this.statUptime.textContent = 
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                // Track message rate for chart
                this.stats.messageRates.push(messagesPerSec);
                if (this.stats.messageRates.length > 60) {
                    this.stats.messageRates.shift();
                }
                
                // Update charts if they exist
                if (this.charts.messageRate) {
                    this.charts.messageRate.data.labels = Array.from({length: this.stats.messageRates.length}, (_, i) => i);
                    this.charts.messageRate.data.datasets[0].data = this.stats.messageRates;
                    this.charts.messageRate.update();
                }
            }
        }, 1000);
    }

    log(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${this.getTimestamp()}]</span> ${this.escapeHtml(message)}`;
        logEntry.dataset.message = message;
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    filterMessages(filter) {
        const entries = this.logContainer.querySelectorAll('.log-entry');
        entries.forEach(entry => {
            const message = entry.dataset.message || entry.innerText;
            if (message.toLowerCase().includes(filter.toLowerCase())) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    clearLog() {
        this.logContainer.innerHTML = `<div class="log-entry info">Log cleared at ${this.getTimestamp()}</div>`;
        this.messages = [];
        this.updateExportPreview();
    }

    // ALERTS FUNCTIONALITY
    addAlert() {
        const field = this.alertField.value.trim();
        const condition = this.alertCondition.value;
        const value = this.alertValue.value.trim();
        
        if (!field || !value) {
            alert('Please fill in all alert fields');
            return;
        }
        
        const alert = { field, condition, value, id: Date.now() };
        this.alerts.push(alert);
        
        this.renderAlerts();
        this.alertField.value = '';
        this.alertValue.value = '';
        this.log(`📌 Alert added: ${field} ${condition} ${value}`, 'info');
    }

    checkAlerts(data) {
        this.alerts.forEach(alert => {
            const fieldValue = this.getNestedValue(data, alert.field);
            
            if (fieldValue !== undefined) {
                let triggered = false;
                
                switch (alert.condition) {
                    case 'greater':
                        triggered = parseFloat(fieldValue) > parseFloat(alert.value);
                        break;
                    case 'less':
                        triggered = parseFloat(fieldValue) < parseFloat(alert.value);
                        break;
                    case 'equals':
                        triggered = fieldValue.toString() === alert.value;
                        break;
                    case 'contains':
                        triggered = fieldValue.toString().includes(alert.value);
                        break;
                    case 'change':
                        // Would need previous value tracking
                        triggered = false;
                        break;
                }
                
                if (triggered) {
                    const message = `🚨 Alert: ${alert.field} ${alert.condition} ${alert.value} (Current: ${fieldValue})`;
                    this.log(message, 'alert');
                    this.addToAlertsLog(message);
                    this.notifyAlert(message);
                }
            }
        });
    }

    renderAlerts() {
        this.alertsList.innerHTML = '';
        this.alerts.forEach(alert => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerHTML = `
                <div class="alert-details">
                    <strong>${alert.field}</strong>
                    <div class="alert-condition">${alert.condition} ${alert.value}</div>
                </div>
                <button class="btn-remove-alert" onclick="wsManager.removeAlert(${alert.id})">Remove</button>
            `;
            this.alertsList.appendChild(div);
        });
    }

    removeAlert(id) {
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.renderAlerts();
    }

    addToAlertsLog(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry alert';
        entry.innerHTML = `<span class="log-timestamp">[${this.getTimestamp()}]</span> ${message}`;
        this.alertsLog.appendChild(entry);
        this.alertsLog.scrollTop = this.alertsLog.scrollHeight;
    }

    notifyAlert(message) {
        if (Notification.permission === 'granted') {
            new Notification('WebSocket Alert', { body: message });
        }
    }

    // HISTORY FUNCTIONALITY
    addToHistory(url) {
        let existing = this.history.find(h => h.url === url);
        if (existing) {
            existing.count++;
            existing.lastConnected = new Date().toLocaleString();
        } else {
            this.history.push({ url, count: 1, lastConnected: new Date().toLocaleString() });
        }
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';
        this.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-url" title="${item.url}">${item.url}</div>
                <div class="history-time">Last: ${item.lastConnected}</div>
                <div class="history-count">Connections: ${item.count}</div>
            `;
            div.addEventListener('click', () => {
                this.wsUrlInput.value = item.url;
                this.log(`Loaded: ${item.url}`, 'info');
            });
            this.historyList.appendChild(div);
        });
    }

    clearHistory() {
        if (confirm('Clear all connection history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            this.log('Connection history cleared', 'info');
        }
    }

    saveHistory() {
        localStorage.setItem('wsHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('wsHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.renderHistory();
        }
    }

    // EXPORT FUNCTIONALITY
    exportMessages() {
        const format = this.exportFormat.value;
        let content;
        
        if (format === 'json') {
            content = JSON.stringify(this.messages, null, 2);
        } else if (format === 'csv') {
            content = 'Timestamp,Data\n';
            this.messages.forEach(msg => {
                content += `"${msg.timestamp}","${msg.data.replace(/"/g, '""')}"\n`;
            });
        } else {
            content = this.messages.map(msg => `[${msg.timestamp}] ${msg.data}`).join('\n');
        }
        
        this.downloadFile(content, `websocket-messages.${this.getFileExtension(format)}`);
        this.log('✅ Messages exported', 'info');
    }

    exportStatistics() {
        const stats = {
            totalMessages: this.stats.totalMessages,
            averageMessageSize: (this.stats.messageSizes.reduce((a, b) => a + b, 0) / this.stats.messageSizes.length).toFixed(2),
            messageTypes: this.stats.messageTypes,
            connectionDuration: this.isConnected ? (Date.now() - this.connectionStartTime) / 1000 : 'Disconnected'
        };
        
        const content = JSON.stringify(stats, null, 2);
        this.downloadFile(content, 'websocket-statistics.json');
        this.log('✅ Statistics exported', 'info');
    }

    exportCharts() {
        const chartData = {
            messageRate: this.stats.messageRates,
            messageTypes: this.stats.messageTypes
        };
        
        const content = JSON.stringify(chartData, null, 2);
        this.downloadFile(content, 'websocket-charts.json');
        this.log('✅ Chart data exported', 'info');
    }

    updateExportPreview() {
        const preview = this.messages.slice(-10)
            .map(msg => `[${msg.timestamp}] ${msg.data.substring(0, 100)}...`)
            .join('\n') || 'No messages yet';
        this.exportPreview.textContent = preview;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // DARK MODE
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    loadDarkMode() {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    }

    // CHARTS INITIALIZATION
    initializeCharts() {
        if (this.charts.messageRate) return; // Already initialized
        
        const ctx1 = document.getElementById('messageRateChart')?.getContext('2d');
        if (ctx1) {
            this.charts.messageRate = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Messages/Second',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
        
        const ctx2 = document.getElementById('messageTypesChart')?.getContext('2d');
        if (ctx2) {
            this.charts.messageTypes = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(this.stats.messageTypes),
                    datasets: [{
                        data: Object.values(this.stats.messageTypes),
                        backgroundColor: ['#667eea', '#764ba2', '#f39c12', '#e74c3c', '#27ae60']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
            });
        }
        
        const ctx3 = document.getElementById('dataFlowChart')?.getContext('2d');
        if (ctx3) {
            this.charts.dataFlow = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: ['Sent', 'Received'],
                    datasets: [{
                        label: 'Messages',
                        data: [0, this.messageCount],
                        backgroundColor: ['#f39c12', '#27ae60']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
            });
        }
    }

    // UTILITY FUNCTIONS
    getTimestamp() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${ms}`;
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, prop) => current?.[prop], obj);
    }

    getFileExtension(format) {
        return { json: 'json', csv: 'csv', txt: 'txt' }[format] || 'txt';
    }

    // IMPORTXML FUNCTIONALITY
    async importXML() {
        const url = this.importUrl.value.trim();
        const xpath = this.importXpath.value.trim();
        const mode = this.importMode.value;
        const limit = parseInt(this.importLimit.value) || 10;

        if (!url || !xpath) {
            this.showImportStatus('Please enter both URL and XPath', 'error');
            return;
        }

        this.showImportStatus('Fetching data...', 'loading');
        this.importBtn.disabled = true;

        try {
            // Fetch the data
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            const content = data.contents;

            // Parse XML/HTML
            let parser = new DOMParser();
            let xmlDoc = null;

            if (mode === 'auto') {
                try {
                    xmlDoc = parser.parseFromString(content, 'application/xml');
                } catch {
                    xmlDoc = parser.parseFromString(content, 'text/html');
                }
            } else if (mode === 'xml') {
                xmlDoc = parser.parseFromString(content, 'application/xml');
            } else {
                xmlDoc = parser.parseFromString(content, 'text/html');
            }

            // Evaluate XPath
            const results = this.evaluateXPath(xmlDoc, xpath, limit);

            if (results.length === 0) {
                this.showImportStatus('No results found for XPath expression', 'error');
            } else {
                this.showImportStatus(`✅ Found ${results.length} result(s)`, 'success');
                this.displayImportResults(results, xpath);
                this.addToImportHistory(url, xpath, results.length);
            }
        } catch (error) {
            this.showImportStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.importBtn.disabled = false;
        }
    }

    evaluateXPath(xmlDoc, xpath, limit) {
        const results = [];
        try {
            const snapshot = xmlDoc.evaluate(
                xpath,
                xmlDoc,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );

            for (let i = 0; i < Math.min(snapshot.snapshotLength, limit); i++) {
                const node = snapshot.snapshotItem(i);
                if (node.nodeType === Node.TEXT_NODE) {
                    results.push(node.nodeValue);
                } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
                    results.push(node.nodeValue);
                } else {
                    results.push(node.textContent || node.outerHTML);
                }
            }
        } catch (error) {
            throw new Error(`Invalid XPath: ${error.message}`);
        }
        return results;
    }

    displayImportResults(results, xpath) {
        this.importResults.innerHTML = '';

        // Create table if results look like they should be in a table
        if (results.length > 1 && results.every(r => typeof r === 'string' && r.length < 200)) {
            const table = document.createElement('table');
            table.className = 'import-results-table';
            
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            const headerCell = headerRow.insertCell();
            headerCell.textContent = `Results (${results.length})`;
            headerCell.style.fontWeight = '600';

            const tbody = table.createTBody();
            results.forEach((result, index) => {
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.textContent = result;
            });

            this.importResults.appendChild(table);
        } else {
            // Display as list
            results.forEach((result, index) => {
                const div = document.createElement('div');
                div.className = 'import-result-item';
                div.innerHTML = `
                    <strong>Result ${index + 1}:</strong><br>
                    ${this.escapeHtml(result.substring(0, 500))}${result.length > 500 ? '...' : ''}
                `;
                this.importResults.appendChild(div);
            });
        }

        // Add export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-primary';
        exportBtn.style.marginTop = '15px';
        exportBtn.textContent = '💾 Export Results';
        exportBtn.addEventListener('click', () => {
            const content = JSON.stringify(results, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `importxml-results-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        this.importResults.appendChild(exportBtn);
    }

    showImportStatus(message, type) {
        this.importStatus.style.display = 'block';
        this.importStatus.className = `import-status-${type}`;
        this.importStatus.textContent = message;
    }

    clearImportResults() {
        this.importResults.innerHTML = '';
        this.importStatus.style.display = 'none';
    }

    addToImportHistory(url, xpath, resultCount) {
        this.importQueries.unshift({
            url,
            xpath,
            resultCount,
            timestamp: new Date().toLocaleString()
        });

        // Keep only last 10
        if (this.importQueries.length > 10) {
            this.importQueries.pop();
        }

        this.renderImportHistory();
    }

    renderImportHistory() {
        this.importHistory.innerHTML = '';

        if (this.importQueries.length === 0) {
            this.importHistory.innerHTML = '<p style="color: #999;">No recent queries. Start by importing data above.</p>';
            return;
        }

        this.importQueries.forEach((query, index) => {
            const div = document.createElement('div');
            div.className = 'import-history-item';
            div.innerHTML = `
                <div class="import-history-url" title="${query.url}">${query.url}</div>
                <div class="import-history-xpath" title="${query.xpath}">${query.xpath}</div>
                <div class="import-history-time">${query.timestamp} (${query.resultCount} results)</div>
            `;
            div.addEventListener('click', () => {
                this.importUrl.value = query.url;
                this.importXpath.value = query.xpath;
                this.switchTab('import');
            });
            this.importHistory.appendChild(div);
        });
    }
}

// Initialize on DOM load
let wsManager;
document.addEventListener('DOMContentLoaded', () => {
    wsManager = new AdvancedWebSocketManager();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
