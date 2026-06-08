const QRCode = require('qrcode');

/**
 * Tạo mã QR dưới dạng Base64 string
 * @param {string} text - Nội dung mã QR
 * @returns {Promise<string>} - Chuỗi base64 image
 */
const generateQR = async (text) => {
  try {
    const qrImage = await QRCode.toDataURL(text);
    return qrImage;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

module.exports = generateQR;
