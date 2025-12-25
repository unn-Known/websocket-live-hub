# WebSocket Live Connection Hub

A systematic web application for connecting to and interacting with WebSocket servers from external websites.

## Features

- **Live WebSocket Connection**: Connect to any WebSocket server URL
- **Real-time Message Handling**: Send and receive messages instantly
- **Connection Monitoring**: Track connection status, duration, and message count
- **Event Logging**: Comprehensive log of all WebSocket events with timestamps
- **Responsive Design**: Works on desktop and mobile devices
- **Clean UI**: Modern, systematic interface with gradient styling

## Files

- `index.html` - Main HTML structure with systematic layout
- `style.css` - Comprehensive styling with responsive design
- `app.js` - WebSocket manager class with full connection handling

## How to Use

1. **Open the application** in a web browser
2. **Enter WebSocket URL** in the configuration section (e.g., `wss://echo.websocket.org`)
3. **Click Connect** to establish the connection
4. **Monitor Status** in the status section for real-time connection info
5. **Send Messages** using the message input area (Ctrl+Enter to send)
6. **View Events** in the live event log

## WebSocket URL Examples

- `wss://echo.websocket.org` - Echo server (test/demo)
- `ws://localhost:8080` - Local server
- `wss://your-domain.com/socket` - Your custom WebSocket endpoint

## Features Explained

### Connection Configuration
- Input field for WebSocket URL
- Connect/Disconnect buttons
- Clear log button

### Connection Status
- Visual status indicator (green when connected, red when disconnected)
- Server URL display
- Connection duration timer
- Message counter

### Message Sending
- Multi-line textarea for composing messages
- Send button (disabled when not connected)
- Ctrl+Enter shortcut for quick sending

### Event Log
- Timestamped entries for all events
- Color-coded message types:
  - Blue: Info messages
  - Green: Received messages
  - Orange: Sent messages
  - Red: Error messages
- Auto-scrolling to latest events
- Clearable log history

## Technical Details

- Pure JavaScript (no external dependencies)
- Native WebSocket API
- Event-driven architecture
- Responsive CSS Grid layout
- Cross-browser compatible

## Notes

- Only works with WebSocket endpoints (ws:// or wss://)
- Some public WebSocket servers may have CORS restrictions
- For testing, use `wss://echo.websocket.org`

---
Created: December 2025
