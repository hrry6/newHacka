// services/blockchain.js
const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function recordTransaction(string memory _uuid, string memory _cid) public returns (bool)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

const recordOnChain = async (uuid, cid) => {
  try {
    console.log(`🔗 Recording to Blockchain... UUID: ${uuid}, CID: ${cid}`);
    const tx = await contract.recordTransaction(uuid, cid);
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Confirmed! Block: ${receipt.blockNumber}, Hash: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error("❌ Blockchain Write Error:", error.message);
    throw error;
  }
};

// Fungsi ini tidak lagi digunakan untuk verifikasi
const getTransactionFromChain = async (uuid) => {
  console.log(`⏭️  Skipping blockchain verification for ${uuid} (using DB + IPFS only)`);
  return { 
    success: true, 
    cid: null 
  };
};

module.exports = { getTransactionFromChain, recordOnChain };