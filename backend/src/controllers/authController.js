const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const register = async (req, res) => {
    const { company_name, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await pool.query(
            'INSERT INTO users (company_name, email, password) VALUES ($1, $2, $3) RETURNING id, email',
            [company_name, email, hashedPassword]
        );
        res.status(201).json({ message: "User created", user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: "User not found" });
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid password" });
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, company_name: user.company_name } });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const generateShareId = async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE users SET share_id = gen_random_uuid(), share_enabled = TRUE WHERE id = $1 RETURNING share_id',
            [req.user.id]
        );
        res.json({ share_id: result.rows[0].share_id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteShareId = async (req, res) => {
    try {
        await pool.query('UPDATE users SET share_id = NULL, share_enabled = FALSE WHERE id = $1', [req.user.id]);
        res.json({ message: "Sharing disabled" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getUserByShareId = async (req, res) => {
    const { shareId } = req.params;
    const client = await pool.connect();

    try {
        const userQuery = await client.query(
            'SELECT id, company_name, email, created_at FROM users WHERE share_id = $1 AND share_enabled = TRUE',
            [shareId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Public profile not found or disabled" 
            });
        }

        const user = userQuery.rows[0];

        const txRes = await client.query(
            `SELECT 
                t.amount,
                t.message,
                t.payment_type,
                t.created_at,
                sender.company_name as sender_name,
                receiver.company_name as receiver_name
            FROM transactions t
            LEFT JOIN users sender ON t.sender_id = sender.id
            LEFT JOIN users receiver ON t.receiver_id = receiver.id
            WHERE t.sender_id = $1 OR t.receiver_id = $1 
            ORDER BY t.created_at DESC`,
            [user.id]
        );

        const transactions = txRes.rows.map(item => ({
            pengirim: item.sender_name,
            penerima: item.receiver_name,
            tanggal: item.created_at,
            nominal: parseFloat(item.amount),
            pesan: item.message,
            tipe_pembayaran: item.payment_type
        }));

        const total_transaksi = transactions.length;
        const total_nilai = transactions.reduce((sum, item) => sum + item.nominal, 0);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    company_name: user.company_name,
                    email: user.email,
                    created_at: user.created_at
                },
                ringkasan: {
                    total_transaksi: total_transaksi,
                    total_nilai: total_nilai
                },
                transactions: transactions
            }
        });

    } catch (err) {
        console.error("Share Error:", err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    } finally {
        client.release();
    }
};

module.exports = { register, login, generateShareId, deleteShareId, getUserByShareId };