const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const khachHangSchema = new mongoose.Schema({
  hoTen: { type: String, required: true },
  email: { type: String },
  matKhau: { type: String, required: true },
  soDienThoai: { type: String, required: true, unique: true },
  diaChi: { type: String },
  gioiTinh: { type: String, default: 'nam' },
  ngaySinh: { type: Date },
  ngheNghiep: { type: String },
  role: { type: String, default: 'user' },
  otp: { type: String },
  otpExpires: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  trangThai: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lyDoKhoa: { type: String } // Lưu lý do khi tài khoản bị khóa
}, { timestamps: true });

// Pre-save hook to hash password
khachHangSchema.pre('save', async function(next) {
  if (!this.isModified('matKhau')) return next();
  const salt = await bcrypt.genSalt(10);
  this.matKhau = await bcrypt.hash(this.matKhau, salt);
  next();
});

// Method to check password
khachHangSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.matKhau);
};

module.exports = mongoose.model('KhachHang', khachHangSchema);
