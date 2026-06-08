const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL: tự xóa sau 24h
});

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
