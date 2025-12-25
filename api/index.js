const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, '..', filePath);

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.md':
            contentType = 'text/markdown';
            break;
        case '.html':
            contentType = 'text/html';
            break;
    }

    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        res.setHeader('Content-Type', contentType);
        res.status(200).send(data);
    } catch (err) {
        res.status(404).send('<h1>404 - File Not Found</h1><p>The requested file could not be found.</p>');
    }
};
