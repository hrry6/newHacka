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


const getTransactionFromChain = async (txUuid) => {
  try {
    // Koneksi ke provider (Amoy)
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    // Inisialisasi contract
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      ['function getRecord(string memory _txId) public view returns (string memory cid, uint256 timestamp)'],
      provider
    );
    
    // Panggil function getRecord dengan txUuid
    const record = await contract.getRecord(txUuid);
    
    // Format return: "UUID.CID" (sesuai dengan data yang disimpan)
    return `${txUuid}.${record.cid}`;
    
  } catch (error) {
    console.error("Blockchain fetch error:", error);
    throw new Error(`Failed to fetch from blockchain: ${error.message}`);
  }
};


module.exports = { getTransactionFromChain, recordOnChain };