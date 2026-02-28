const axios = require('axios');
require('dotenv').config();

const uploadToIPFS = async (jsonData) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const response = await axios.post(url, {
    pinataContent: jsonData,
    pinataMetadata: { name: `Transaction_${Date.now()}` }
  }, {
    headers: {
      Authorization: `Bearer ${process.env.PINATA_WRITE_JWT}`
    }
  });
  return response.data.IpfsHash; // Ini CID-nya
};

module.exports = { uploadToIPFS };