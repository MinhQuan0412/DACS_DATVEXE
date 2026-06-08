const crypto = require('crypto');
const mongoose = require('mongoose');

const veSchema = new mongoose.Schema({
  maVe: { type: String, unique: true }, // VD: VE-20260507-001
  khachHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang', required: true },
  chuyenXeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChuyenXe', required: true },
  danhSachGhe: { type: [String], required: true }, // VD: ["A01","A02","B03"]
  tongTien: { type: Number, required: true },
  hoTen: { type: String },       // Tên khách (có thể khác user đăng nhập, đặt hộ)
  soDienThoai: { type: String },  // SĐT liên hệ
  email: { type: String },        // Email nhận vé
  maVoucher: { type: String },    // Mã voucher đã áp dụng
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  soTienGiam: { type: Number, default: 0 },
  diemDon: {
    tenDiem: { type: String },
    diaChi: { type: String },
    thoiGian: { type: String }
  },
  diemTra: {
    tenDiem: { type: String },
    diaChi: { type: String },
    thoiGian: { type: String }
  },
  phuongThucThanhToan: { type: String }, // momo, zalopay, vnpay, tienmat
  maGiaoDich: { type: String },           // Mã giao dịch từ cổng thanh toán
  ghiChu: { type: String },               // Ghi chú xác nhận
  trangThai: {
    type: String,
    enum: ['hold', 'pending', 'paid', 'confirmed', 'completed', 'cancelled', 'expired'],
    default: 'hold'
  },
  holdExpires: { type: Date },
  ngayDat: { type: Date, default: Date.now }
}, { timestamps: true });

// Tự tạo mã vé trước khi save
veSchema.pre('save', async function(next) {
  if (!this.maVe) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.maVe = `VE-${dateStr}-${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('Ve', veSchema);
