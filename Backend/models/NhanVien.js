const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const nhanVienSchema = new mongoose.Schema({
  hoTen: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  matKhau: { type: String }, // Không bắt buộc vì dùng tài khoản chung để đăng nhập
  soDienThoai: { type: String },
  vaiTro: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  trangThai: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// Hash password before saving
nhanVienSchema.pre('save', async function (next) {
  if (!this.isModified('matKhau') || !this.matKhau || this.matKhau === 'shared_account_no_password') return next();
  const salt = await bcrypt.genSalt(10);
  this.matKhau = await bcrypt.hash(this.matKhau, salt);
  next();
});

// Compare password
nhanVienSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.matKhau);
};

module.exports = mongoose.model('NhanVien', nhanVienSchema);
