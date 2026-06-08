const mongoose = require('mongoose');

const soDoGheSchema = new mongoose.Schema({
  tenSoDo: { type: String, required: true, unique: true }, // VD: "Xe giường nằm 34 chỗ", "Xe ghế ngồi 29 chỗ"
  tongSoGhe: { type: Number, required: true },
  soTang: { type: Number, default: 1 },
  danhSachGhe: { type: [String], required: true } // VD: ["A01", "A02", ...]
}, { timestamps: true });

module.exports = mongoose.model('SoDoGhe', soDoGheSchema);
