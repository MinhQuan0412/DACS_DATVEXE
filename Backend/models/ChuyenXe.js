const mongoose = require('mongoose');

const chuyenXeSchema = new mongoose.Schema({
  tuyenXeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TuyenXe', required: true },
  xeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Xe', required: true },
  thoiGianKhoiHanh: { type: Date, required: true },
  thoiGianDen: { type: Date }, // Giờ đến dự kiến
  trangThai: { type: String, enum: ['active', 'running', 'completed', 'cancelled', 'inactive'], default: 'active' },
  gheDaDat: { type: [String], default: [] } // VD: ["A01","A02","B03"]
}, { timestamps: true });

module.exports = mongoose.model('ChuyenXe', chuyenXeSchema);
