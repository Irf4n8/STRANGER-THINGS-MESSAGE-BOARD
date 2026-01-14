const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3001; // Using 3001 to avoid conflict with previous project

// SECURITY: HTTP Headers
app.use(helmet());

// SECURITY: Rate Limiting (limit each IP to 100 requests per 15 mins)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const DB_FILE = path.join(__dirname, '../database/messages.json');

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// POST: Encode Message
app.post('/api/encode', (req, res) => {
    const { message } = req.body;
    // Processing Logic
    const cleanMessage = message.toUpperCase().replace(/[^A-Z ]/g, ''); // Keep spaces
    const encodedArray = [];

    for (let char of cleanMessage) {
        if (char === ' ') {
            encodedArray.push('PAUSE');
        } else {
            encodedArray.push(char);
        }
    }

    // Generate unique ID (8 chars)
    const id = crypto.randomBytes(4).toString('hex');

    const db = readDB();
    db[id] = {
        original: cleanMessage,
        encoded: encodedArray,
        timestamp: Date.now()
    };
    writeDB(db);

    res.json({ link: `/decode.html?id=${id}`, id });
});

// GET: Decode Message
app.get('/api/decode/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const msg = db[id];

    if (!msg) {
        return res.status(404).json({ error: 'Message not found in the Upside Down' });
    }

    res.json(msg);
});

app.listen(PORT, () => {
    console.log(`Upside Down Server running on http://localhost:${PORT}`);
});
