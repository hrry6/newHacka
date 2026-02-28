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
            return res.status(404).json({ message: "Public profile not found or disabled" });
        }

        const user = userQuery.rows[0];

        const txRes = await client.query(
            `SELECT * FROM transactions 
             WHERE sender_id = $1 OR receiver_id = $1 
             ORDER BY created_at DESC`,
            [user.id]
        );

        const transactions = txRes.rows;
        const verifiedResults = [];

        for (const item of transactions) {
            try {
                await sleep(500);

                const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${item.cid}`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PINATA_READ_JWT}`
                    },
                    timeout: 10000
                });
                const ipfsData = ipfsResponse.data;

                const dbPayloadStr = typeof item.encrypted_payload === 'string' 
                    ? item.encrypted_payload 
                    : JSON.stringify(item.encrypted_payload);
                
                const ipfsPayloadStr = JSON.stringify(ipfsData.payload);
                const isPayloadValid = ipfsPayloadStr === dbPayloadStr;

                verifiedResults.push({
                    id: item.id,
                    amount: item.amount,
                    sender_id: item.sender_id,
                    receiver_id: item.receiver_id,
                    message: item.message,
                    payload: ipfsData.payload,
                    cid: item.cid,
                    tx_hash: item.blockchain_tx_hash,
                    status: item.status,
                    verified_status: isPayloadValid ? "VERIFIED" : "INVALID",
                    created_at: item.created_at
                });

            } catch (err) {
                verifiedResults.push({
                    ...item,
                    payload: null,
                    verified_status: "IPFS_ERROR",
                    error: err.message
                });
            }
        }

        res.json({
            profile: {
                company_name: user.company_name,
                email: user.email,
                joined_at: user.created_at
            },
            transactions: verifiedResults
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};


module.exports = { register, login, generateShareId, deleteShareId, getUserByShareId };