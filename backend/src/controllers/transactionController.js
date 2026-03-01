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
    // 1. Ambil data user
    const userRes = await client.query(
      `SELECT id, company_name, email, share_enabled, share_id, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const userData = userRes.rows[0];

    // 2. Ambil semua transaksi user
    const dbRes = await client.query(
      `SELECT 
        t.id,
        t.amount,
        t.message,
        t.payment_type,
        t.encrypted_payload,
        t.cid,
        t.blockchain_tx_hash,
        t.created_at,
        sender.company_name as sender_name,
        sender.id as sender_id,
        receiver.company_name as receiver_name,
        receiver.id as receiver_id
       FROM transactions t
       LEFT JOIN users sender ON t.sender_id = sender.id
       LEFT JOIN users receiver ON t.receiver_id = receiver.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1 
       ORDER BY t.created_at DESC`,
      [userId]
    );

    const transactions = dbRes.rows;
    const verifiedTransactions = [];

    for (const item of transactions) {
      try {
        // VALIDASI LAPIS 1: Database vs IPFS
        await sleep(800); 

        const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${item.cid}`, {
          headers: { 'Authorization': `Bearer ${process.env.PINATA_READ_JWT}` },
          timeout: 15000
        });
        const ipfsData = ipfsResponse.data;

        const dbFullData = {
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          amount: parseFloat(item.amount),
          payment_type: item.payment_type,
          message: item.message,
          payload: JSON.parse(item.encrypted_payload),
          created_at: new Date(item.created_at).toISOString()
        };

        const ipfsReconstructed = {
          sender_id: ipfsData.sender_id,
          receiver_id: ipfsData.receiver_id,
          amount: ipfsData.amount,
          payment_type: ipfsData.payment_type,
          message: ipfsData.message,
          payload: ipfsData.payload,
          created_at: ipfsData.created_at
        };

        const isDataValid = JSON.stringify(dbFullData) === JSON.stringify(ipfsReconstructed);

        // VALIDASI LAPIS 2: CID Database vs CID Blockchain
        let isCidValid = false;
        try {
          const blockchainData = await getTransactionFromChain(item.id); 
          const [txUuid, blockchainCid] = blockchainData.split('.');
          isCidValid = (blockchainCid === item.cid);
        } catch (blockchainError) {
          console.error(`Blockchain validation error for tx ${item.id}:`, blockchainError.message);
          isCidValid = false;
        }

        // Jika lolos verifikasi, masukkan ke array dengan CID & Tx Hash
        if (isDataValid && isCidValid) {
          verifiedTransactions.push({
            id: item.id,
            pengirim: item.sender_name,
            penerima: item.receiver_name,
            tanggal: item.created_at,
            nominal: parseFloat(item.amount),
            pesan: item.message,
            tipe_pembayaran: item.payment_type,
            // --- DATA TAMBAHAN UNTUK USER ---
            bukti_digital: {
              cid: item.cid,
              tx_hash: item.blockchain_tx_hash,
              url_ipfs: `https://gateway.pinata.cloud/ipfs/${item.cid}`,
              url_polygonscan: `https://amoy.polygonscan.com/tx/${item.blockchain_tx_hash}`
            }
          });
        } else {
          console.log(`Transaction ${item.id} filtered out:`, { dataValid: isDataValid, cidValid: isCidValid });
        }

      } catch (err) {
        console.error(`Validation error for transaction ${item.id}:`, err.message);
      }
    }

    const total_transaksi = verifiedTransactions.length;
    const total_nilai = verifiedTransactions.reduce((sum, item) => sum + item.nominal, 0);

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        ringkasan: {
          total_transaksi: total_transaksi,
          total_nilai: total_nilai
        },
        transactions: verifiedTransactions
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {createTransaction, getVerifiedTransactions};