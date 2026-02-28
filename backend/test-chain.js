// test-contract-direct.js
require('dotenv').config();
const { ethers } = require('ethers');

async function testContractDirect() {
  const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology/";
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  console.log("=== TEST CONTRACT DIRECTLY WITH CORRECT FORMAT ===\n");

  // Buat interface dengan ABI lengkap
  const iface = new ethers.Interface([
    "function recordTransaction(string _uuid, string _cid) public returns (bool)",
    "function getTransaction(string _uuid) public view returns (string memory)",
    "function transactions(string) public view returns (string memory)",
    "function getAllTransactions() public view returns (string[] memory)",
    "function getTransactionCount() public view returns (uint256)"
  ]);

  const uuid = "869f9baa-ead7-41d1-9518-0fcc30610ad2";
  
  console.log(`Testing dengan UUID: ${uuid}\n`);

  // Test 1: Coba panggil recordTransaction (write function) - tapi kita hanya encode, tidak execute
  try {
    const recordData = iface.encodeFunctionData("recordTransaction", [uuid, "QmTest123"]);
    console.log("✅ recordTransaction encoded successfully");
    console.log(`   Data: ${recordData.substring(0, 100)}...\n`);
  } catch (e) {
    console.log("❌ recordTransaction encode failed:", e.message, "\n");
  }

  // Test 2: Coba panggil getTransaction
  try {
    console.log("Mencoba getTransaction...");
    const getData = iface.encodeFunctionData("getTransaction", [uuid]);
    console.log(`   Encoded data: ${getData}`);
    
    const result = await provider.call({
      to: CONTRACT_ADDRESS,
      data: getData
    });
    
    console.log(`   Result: ${result}`);
    
    if (result !== "0x") {
      const decoded = iface.decodeFunctionResult("getTransaction", result);
      console.log(`   Decoded: ${decoded}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}\n`);
  }

  // Test 3: Coba panggil transactions mapping (jika ada)
  try {
    console.log("Mencoba transactions mapping...");
    const txData = iface.encodeFunctionData("transactions", [uuid]);
    
    const result = await provider.call({
      to: CONTRACT_ADDRESS,
      data: txData
    });
    
    console.log(`   Result: ${result}`);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}\n`);
  }

  // Test 4: Coba cek fungsi view tanpa parameter
  try {
    console.log("Mencoba getTransactionCount...");
    const countData = iface.encodeFunctionData("getTransactionCount", []);
    
    const result = await provider.call({
      to: CONTRACT_ADDRESS,
      data: countData
    });
    
    console.log(`   Result: ${result}`);
    
    if (result !== "0x") {
      const decoded = iface.decodeFunctionResult("getTransactionCount", result);
      console.log(`   Count: ${decoded}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}\n`);
  }

  // Test 5: Coba dengan provider.getCode untuk memastikan contract address benar
  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log("Contract code length:", (code.length - 2) / 2, "bytes");
    
    // Cek apakah bytecode mengandung fungsi yang kita cari
    if (code.includes("66a2c685")) {
      console.log("✅ Found recordTransaction selector (66a2c685) in bytecode");
    }
    if (code.includes("ac2ccd07")) {
      console.log("✅ Found getTransaction selector (ac2ccd07) in bytecode");
    } else {
      console.log("❌ getTransaction selector (ac2ccd07) NOT found in bytecode");
    }
  } catch (e) {
    console.log("❌ Error getting code:", e.message);
  }
}

testContractDirect();