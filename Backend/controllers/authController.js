const crypto = require('crypto');
const KhachHang = require('../models/KhachHang');
const sendEmail = require('../utils/sendEmail'); // Bạn tạo file này trong thư mục utils

exports.forgotPassword = async (req, res) => {
    const { soDienThoai } = req.body;
    const user = await KhachHang.findOne({ soDienThoai });

    if (!user) return res.status(404).json({ message: "Số điện thoại không tồn tại" });

    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Lưu vào database (cần thêm field resetPasswordToken và resetPasswordExpires vào Schema KhachHang)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Hết hạn sau 1 giờ
    await user.save();

    // Giả lập gửi SMS hoặc email (vì không có email)
    const resetUrl = `http://localhost:5001/reset-password/${resetToken}`; 
    const message = `Bạn nhận được tin nhắn này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link: \n\n ${resetUrl}`;

    try {
        // In a real app, send an SMS here. We are just returning it for Postman testing.
        res.status(200).json({ message: "Đã gửi yêu cầu khôi phục mật khẩu", resetToken });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(500).json({ message: "Lỗi gửi yêu cầu" });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { matKhauMoi } = req.body;

    const user = await KhachHang.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });

    // Cập nhật mật khẩu (Password sẽ tự hash nếu bạn có middleware .pre('save') trong model)
    user.matKhau = matKhauMoi;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
};