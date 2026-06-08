const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  khachHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang' },
  hoTen: { type: String, required: true },
  email: { type: String },
  soDienThoai: { type: String, required: true },
  tieuDe: { type: String, required: true },
  noiDung: { type: String, required: true },
  maVe: { type: String }, // Mã vé khách hàng cần hỗ trợ
  veId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ve' }, // Link trực tiếp tới vé
  trangThai: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  phanHoi: { type: String } // Admin reply
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
