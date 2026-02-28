require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createTransaction, getVerifiedTransactions } = require('./src/controllers/transactionController');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/transactions', createTransaction);

app.get('/api/transactions/user/:userId', getVerifiedTransactions);

app.get('/ping', (req, res) => res.send('Pong! 🚀'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    🔥 Server Berhasil Jalan!
    📍 URL: http://localhost:${PORT}
    🛠️  Target: Polygon Amoy
    ✅ GET  /api/transactions/user/:userId -> Untuk Verifikasi Triple-Check
    `);
});