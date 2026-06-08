const mongoose = require('mongoose');

const lienHeSchema = new mongoose.Schema({
  hoTen: { type: String, required: true },
  email: { type: String, required: true },
  soDienThoai: { type: String },
  tieuDe: { type: String, required: true },
  noiDung: { type: String, required: true },
  trangThai: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  ngayGui: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LienHe', lienHeSchema);
