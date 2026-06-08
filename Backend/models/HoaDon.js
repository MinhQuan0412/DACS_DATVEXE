const crypto = require('crypto');
const mongoose = require('mongoose');

const hoaDonSchema = new mongoose.Schema({
  maHoaDon: { type: String, unique: true }, // VD: HD-20260507-001
  veId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ve', required: true },
  khachHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang', required: true },
  tongTien: { type: Number, required: true },
  phuongThucThanhToan: { type: String, required: true }, // momo, zalopay, vnpay, tienmat
  trangThai: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  ngayThanhToan: { type: Date, default: Date.now }
}, { timestamps: true });

// Tự tạo mã hóa đơn
hoaDonSchema.pre('save', async function(next) {
  if (!this.maHoaDon) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.maHoaDon = `HD-${dateStr}-${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('HoaDon', hoaDonSchema);
