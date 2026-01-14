const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// GET: Retrieve messages
app.get('/api/messages', (req, res) => {
    const sql = `SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// POST: Create a new message
app.post('/api/messages', (req, res) => {
    const { username, content, character_avatar } = req.body;

    if (!username || !content) {
        return res.status(400).json({ error: "Username and content are required." });
    }

    // Optional Feature: Profanity Filter
    const badWords = ['badword', 'spam', 'vecna']; // extensible list
    const hasProfanity = badWords.some(word => content.toLowerCase().includes(word) || username.toLowerCase().includes(word));

    if (hasProfanity) {
        return res.status(400).json({ error: "Watch your language! The Mind Flayer is listening." });
    }

    const sql = 'INSERT INTO messages (username, content, character_avatar) VALUES (?, ?, ?)';
    const params = [username, content, character_avatar || 'default'];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: {
                id: this.lastID,
                username,
                content,
                character_avatar,
                timestamp: new Date().toISOString() // Approximate time for immediate UI update
            }
        });
    });
});

// Serve frontend for root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
