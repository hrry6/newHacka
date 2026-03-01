const pool = require('../config/db');
const axios = require('axios');
const { getTransactionFromChain } = require('../services/blockchain');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createTransaction = async (req, res) => {
  const { sender_id, receiver_id, amount, payment_type, message, payload } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const createdAt = new Date().toISOString();

    const fullSnapshot = {
      sender_id,
      receiver_id,
      amount,
      payment_type,
      message,
      payload, 
      created_at: createdAt
    };

    const cid = await uploadToIPFS(fullSnapshot);

    const dbRes = await client.query(
      `INSERT INTO transactions (
        sender_id, 
        receiver_id, 
        amount, 
        payment_type, 
        message, 
        encrypted_payload, 
        cid, 
        status, 
        created_at
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8) RETURNING id`,
      [
        sender_id, 
        receiver_id, 
        amount, 
        payment_type, 
        message, 
        JSON.stringify(payload), 
        cid, 
        createdAt
      ]
    );
    const txUuid = dbRes.rows[0].id;

    const txHash = await recordOnChain(txUuid, cid);

    await client.query(
      `UPDATE transactions SET blockchain_tx_hash = $1, status = 'CONFIRMED' WHERE id = $2`,
      [txHash, txUuid]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
      success: true, 
      txUuid, 
      txHash, 
      cid,
      verified_at: createdAt 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Transaction Error:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

const getVerifiedTransactions = async (req, res) => {
  const userId = req.user.id; 
  const client = await pool.connect();

  try {
    const userRes = await client.query(
      `SELECT id, company_name, email, share_enabled, share_id, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const userData = userRes.rows[0];

    const dbRes = await client.query(
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
      [userId]
    );

    // Format transaksi simpel
    const transactions = dbRes.rows.map(item => ({
      pengirim: item.sender_name,
      penerima: item.receiver_name,
      tanggal: item.created_at,
      nominal: parseFloat(item.amount),
      pesan: item.message,
      tipe_pembayaran: item.payment_type
    }));

    // Hitung total transaksi dan total nilai
    const total_transaksi = transactions.length;
    const total_nilai = transactions.reduce((sum, item) => sum + item.nominal, 0);

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        ringkasan: {
          total_transaksi: total_transaksi,
          total_nilai: total_nilai
        },
        transactions: transactions
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  } finally {
    client.release();
  }
};

module.exports = {createTransaction, getVerifiedTransactions};