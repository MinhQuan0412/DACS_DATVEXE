const jwt = require('jsonwebtoken');
const KhachHang = require('../models/KhachHang');
const TokenBlacklist = require('../models/TokenBlacklist');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập' });
    }

    // Kiểm tra token có trong blacklist không (đã logout)
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token đã bị vô hiệu hóa, vui lòng đăng nhập lại' });
    }

    // Sử dụng 'secret_key' làm fallback giống như trong authRoutes.js
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Đảm bảo lấy được ID dù Token lưu là id hay _id
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: 'Token không chứa thông tin người dùng' });
    }

    const user = await KhachHang.findById(userId).select('-matKhau');
    
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản khách hàng không tồn tại trên hệ thống' });
    }

    req.user = {
      id: user._id,
      _id: user._id, // Cung cấp thêm _id để tương thích với các route cũ
      hoTen: user.hoTen,
      email: user.email,
      soDienThoai: user.soDienThoai,
      role: 'customer'
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = authMiddleware;
