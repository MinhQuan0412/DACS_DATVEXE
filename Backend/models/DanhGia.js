const mongoose = require('mongoose');

const danhGiaSchema = new mongoose.Schema({
  khachHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhachHang', required: true },
  chuyenXeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChuyenXe', required: true },
  soSao: { type: Number, required: true, min: 1, max: 5 },
  nhanXet: { type: String, required: true },
  ngayDanhGia: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DanhGia', danhGiaSchema);
