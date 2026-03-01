const axios = require('axios');
const pool = require('../config/db');

// System prompt yang spesifik ke user
const SYSTEM_PROMPT = (userName) => `
Anda adalah asisten keuangan pribadi untuk ${userName}. 
Analisis transaksi mereka dan berikan insight relevan.
Gunakan Bahasa Indonesia yang natural.
Fokus pada pola transaksi yang berhubungan dengan bisnis/user ini.
Jangan gunakan bullet points. Respons dalam 2-3 paragraf.
`;

async function getUserData(userId) {
  // Ambil data user
  const userQuery = await pool.query(
    'SELECT id, company_name, email FROM users WHERE id = $1',
    [userId]
  );
  return userQuery.rows[0];
}

async function getUserTransactions(userId) {
  // Ambil SEMUA transaksi user (baik sebagai pengirim atau penerima)
  const query = `
    SELECT 
      t.amount,
      t.payment_type,
      t.message,
      t.created_at,
      sender.company_name as sender_name,
      sender.id as sender_id,
      receiver.company_name as receiver_name,
      receiver.id as receiver_id
    FROM transactions t
    LEFT JOIN users sender ON t.sender_id = sender.id
    LEFT JOIN users receiver ON t.receiver_id = receiver.id
    WHERE t.sender_id = $1 OR t.receiver_id = $1
    ORDER BY t.created_at DESC
  `;
  
  const result = await pool.query(query, [userId]);
  
  // Format transaksi dengan konteks "saya" vs "mereka"
  return result.rows.map(t => {
    const isUserSender = t.sender_id === userId;
    return {
      arah: isUserSender ? 'MENGIRIM' : 'MENERIMA',
      lawan_transaksi: isUserSender ? t.receiver_name : t.sender_name,
      nominal: Number(t.amount),
      metode: t.payment_type,
      pesan: t.message || '-',
      waktu: new Date(t.created_at).toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
    };
  });
}

async function askQwen(userData, transactions, question) {
  // Hitung statistik personal
  const dikirim = transactions.filter(t => t.arah === 'MENGIRIM');
  const diterima = transactions.filter(t => t.arah === 'MENERIMA');
  
  const totalDikirim = dikirim.reduce((sum, t) => sum + t.nominal, 0);
  const totalDiterima = diterima.reduce((sum, t) => sum + t.nominal, 0);
  
  // Top partners
  const partnerCount = {};
  transactions.forEach(t => {
    partnerCount[t.lawan_transaksi] = (partnerCount[t.lawan_transaksi] || 0) + 1;
  });
  const topPartner = Object.entries(partnerCount)
    .sort((a, b) => b[1] - a[1])[0];

  // Data yang dikirim ke AI - FOKUS ke user
  const dataForAI = {
    user: {
      nama: userData.company_name,
      email: userData.email
    },
    ringkasan: {
      total_transaksi: transactions.length,
      total_nominal: `Rp${(totalDikirim + totalDiterima).toLocaleString('id-ID')}`,
      sebagai_pengirim: `${dikirim.length} transaksi (Rp${totalDikirim.toLocaleString('id-ID')})`,
      sebagai_penerima: `${diterima.length} transaksi (Rp${totalDiterima.toLocaleString('id-ID')})`,
      partner_terbanyak: topPartner ? `${topPartner[0]} (${topPartner[1]} transaksi)` : '-'
    },
    transaksi_terbaru: transactions.slice(0, 5).map(t => 
      `${t.arah} ${t.nominal.toLocaleString('id-ID')} dari/ke ${t.lawan_transaksi} pada ${t.waktu}`
    ),
    detail_transaksi: transactions.map(t => ({
      waktu: t.waktu,
      arah: t.arah,
      lawan: t.lawan_transaksi,
      nominal: t.nominal,
      metode: t.metode,
      pesan: t.pesan
    }))
  };

  const response = await axios.post(
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      model: 'qwen-plus',
      messages: [
        { 
          role: 'system', 
          content: SYSTEM_PROMPT(userData.company_name) 
        },
        { 
          role: 'user', 
          content: `Data transaksi saya (${userData.company_name}):\n${JSON.stringify(dataForAI, null, 2)}\n\nPertanyaan: ${question}` 
        }
      ],
      temperature: 0.4,
      max_tokens: 1000
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`
      }
    }
  );

  return response.data.choices[0].message.content;
}

const aiAnalyze = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pertanyaan tidak boleh kosong' 
      });
    }

    // Ambil data user dan transaksinya
    const userData = await getUserData(userId);
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        error: 'User tidak ditemukan' 
      });
    }

    const transactions = await getUserTransactions(userId);
    
    if (transactions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Belum ada transaksi untuk dianalisis' 
      });
    }

    console.log(`📊 Analisis ${transactions.length} transaksi untuk ${userData.company_name}`);

    // Minta AI analisis
    const analysis = await askQwen(userData, transactions, question);

    // Response yang fokus ke user
    res.json({
      success: true,
      data: {
        user: {
          nama: userData.company_name,
          email: userData.email
        },
        ringkasan: {
          total_transaksi: transactions.length,
          total_nominal: `Rp${transactions.reduce((sum, t) => sum + t.nominal, 0).toLocaleString('id-ID')}`,
          sebagai_pengirim: transactions.filter(t => t.arah === 'MENGIRIM').length,
          sebagai_penerima: transactions.filter(t => t.arah === 'MENERIMA').length,
          periode: `${new Date(transactions[transactions.length-1].waktu).toLocaleDateString('id-ID')} - ${new Date(transactions[0].waktu).toLocaleDateString('id-ID')}`
        },
        analisis: analysis
      }
    });

  } catch (error) {
    console.error('🔥 Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Gagal memproses analisis' 
    });
  }
};

module.exports = { aiAnalyze };