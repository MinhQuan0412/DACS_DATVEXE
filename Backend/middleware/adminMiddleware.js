const jwt = require('jsonwebtoken');
const NhanVien = require('../models/NhanVien');

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await NhanVien.findById(decoded.id).select('-matKhau');
    
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản nhân viên không tồn tại' });
    }

    if (user.trangThai !== 'active') {
      return res.status(403).json({ message: 'Tài khoản này đã bị vô hiệu hóa' });
    }

    // Unify user object for easier permission checking
    req.user = {
      _id: user._id,
      hoTen: user.hoTen,
      email: user.email,
      role: user.vaiTro, // 'admin' or 'staff'
      isStaff: true
    };
    
    // Legacy support for req.admin
    req.admin = user;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = adminMiddleware;
