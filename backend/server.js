require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { register, login, generateShareId, deleteShareId, getUserByShareId } = require('./src/controllers/authController');
const { createTransaction, getVerifiedTransactions } = require('./src/controllers/transactionController');
const { aiAnalyze } = require('./src/controllers/analyzeController.js');
const authMiddleware = require('./src/middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => res.send('Pong! 🚀'));
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/public/share/:shareId', getUserByShareId);

app.post('/api/user/share/generate', authMiddleware, generateShareId);
app.delete('/api/user/share/delete', authMiddleware, deleteShareId);
app.post('/api/transactions', createTransaction);
app.get('/api/transactions/user', authMiddleware, getVerifiedTransactions);
app.post('/api/analyze', authMiddleware, aiAnalyze);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🔥 Server Berhasil Jalan!\n📍 URL: http://localhost:${PORT}`);
});