const pool = require('../config/db');
const axios = require('axios');
const { getTransactionFromChain } = require('../services/blockchain');

// Fungsi helper untuk memberi jeda (agar tidak kena error 429)
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
  const { userId } = req.params;
  const client = await pool.connect();

  try {
    // 1. Ambil data dari Postgres
    const dbRes = await client.query(
      `SELECT * FROM transactions 
       WHERE sender_id = $1 OR receiver_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const transactions = dbRes.rows;
    const verifiedResults = [];

    console.log(`🔍 Memproses ${transactions.length} transaksi...`);

    for (const item of transactions) {
      try {
        await sleep(800);

        // Ambil data dari IPFS
        const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${item.cid}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_READ_JWT}`
          },
          timeout: 15000
        });
        const ipfsData = ipfsResponse.data;

        // Validasi Payload (Bandingkan data dari IPFS dengan database)
        const dbPayloadStr = typeof item.encrypted_payload === 'string' 
          ? item.encrypted_payload 
          : JSON.stringify(item.encrypted_payload);
        
        const isPayloadValid = JSON.stringify(ipfsData.payload) === dbPayloadStr;

        console.log(`--- TX: ${item.id.substring(0,8)} ---`);
        console.log(`Payload Match: ${isPayloadValid}`);

        // Masukkan semua transaksi, beri status berdasarkan validasi payload
        verifiedResults.push({
          id: item.id,
          amount: item.amount,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          message: item.message,
          payload: ipfsData.payload,
          cid: item.cid,
          tx_hash: item.blockchain_tx_hash,
          verified_status: isPayloadValid ? "VERIFIED" : "INVALID",
          created_at: item.created_at
        });

      } catch (err) {
        console.error(`⚠️ Gagal ambil data dari IPFS untuk TX ${item.id}: ${err.message}`);
        // Tetap masukkan transaksi walau IPFS gagal
        verifiedResults.push({
          id: item.id,
          amount: item.amount,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          message: item.message,
          payload: null,
          cid: item.cid,
          tx_hash: item.blockchain_tx_hash,
          verified_status: "IPFS_ERROR",
          created_at: item.created_at,
          error: err.message
        });
      }
    }

    // Ringkasan
    console.log("\n=== RINGKASAN VERIFIKASI ===");
    console.log(`Total: ${verifiedResults.length}`);
    console.log(`Verified: ${verifiedResults.filter(tx => tx.verified_status === "VERIFIED").length}`);
    console.log(`Invalid: ${verifiedResults.filter(tx => tx.verified_status === "INVALID").length}`);
    console.log(`IPFS Error: ${verifiedResults.filter(tx => tx.verified_status === "IPFS_ERROR").length}`);
    console.log("============================\n");

    res.status(200).json({
      success: true,
      count: verifiedResults.length,
      data: verifiedResults
    });

  } catch (error) {
    console.error("🔥 Fetch Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

module.exports = { createTransaction, getVerifiedTransactions };