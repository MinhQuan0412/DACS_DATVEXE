const mongoose = require('mongoose');

const xeSchema = new mongoose.Schema({
  bienSo: { type: String, required: true, unique: true, trim: true },
  loaiXe: { type: String, required: true }, 
  tongSoGhe: { type: Number, required: true },
  soDoGheId: { type: mongoose.Schema.Types.ObjectId, ref: 'SoDoGhe', required: true },
  tuyenXeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TuyenXe' }, // Tuyến đường cố định của xe
  soTang: { type: Number, default: 1 },
  trangThai: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Xe', xeSchema);
