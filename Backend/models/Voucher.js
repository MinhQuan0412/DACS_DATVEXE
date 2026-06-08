const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  tenVoucher: { type: String, required: true },
  maVoucher: { type: String, required: true, unique: true },
  moTa: { type: String },
  loaiGiamGia: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
  giaTriGiam: { type: Number, required: true }, // % hoặc số tiền
  giaTriToiThieu: { type: Number, default: 0 }, // Đơn hàng tối thiểu để áp dụng
  giamToiDa: { type: Number }, // Nếu là % thì có thể giới hạn số tiền giảm tối đa
  ngayBatDau: { type: Date, default: Date.now },
  ngayHetHan: { type: Date }, // (Nếu trống = Vĩnh viễn)
  soLuong: { type: Number, default: 100 }, // Tổng số mã phát ra
  daSuDung: { type: Number, default: 0 },
  trangThai: { type: String, enum: ['active', 'inactive'], default: 'active' },
  choKhachHangMoi: { type: Boolean, default: false },
  luotDungToiDaMoiNguoi: { type: Number, default: 1 }, // Mặc định mỗi khách chỉ dùng 1 lần
  apDungTuyen: { type: String, enum: ['all', 'selected'], default: 'all' },
  tuyenXeDuocApDung: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TuyenXe' }]
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
