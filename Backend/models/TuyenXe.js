const mongoose = require('mongoose');

const diemSchema = {
  tenDiem: { type: String, required: true },
  diaChi: { type: String },
  tinhThanh: { type: String, required: true }, // VD: TP. Hồ Chí Minh, Đà Lạt
  thuTu: { type: Number, default: 0 }
};

const tuyenXeSchema = new mongoose.Schema({
  diemDi: { type: String, required: true },
  diemDen: { type: String, required: true },
  khoangCach: { type: String },
  thoiGianDi: { type: String }, // Đổi từ thoiGianDuKien sang thoiGianDi cho khớp Frontend
  giaVe: { type: String, default: "0 đ" }, // Thêm Giá vé mặc định cho tuyến
  trangThai: { type: String, enum: ['active', 'inactive'], default: 'active' },
  diemDon: [diemSchema],  // Điểm đón khách
  diemTra: [diemSchema]   // Điểm trả khách
}, { timestamps: true });

module.exports = mongoose.model('TuyenXe', tuyenXeSchema);
