const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const authMiddleware = require('../middleware/authMiddleware');
const ThongBao = require('../models/ThongBao');
const NhanVien = require('../models/NhanVien');
const router = express.Router();

// ============================================================
// @route   POST /api/support/tickets (hoặc /api/support-requests)
// @desc    Gửi phản hồi hỗ trợ (Yêu cầu đăng nhập)
// ============================================================
const createTicketHandler = async (req, res) => {
  try {
    const { tieuDe, noiDung, email, soDienThoai, maVe, veId } = req.body;

    if (!tieuDe || !noiDung) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và nội dung' });
    }

    // Ưu tiên SĐT nhập trong form, nếu không có mới lấy từ User profile
    const finalPhone = soDienThoai || req.user.soDienThoai;
    if (!finalPhone) {
        return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại liên hệ' });
    }

    const ticket = new SupportTicket({
      khachHangId: req.user._id,
      hoTen: req.user.hoTen,
      email: email || req.user.email,
      soDienThoai: finalPhone,
      tieuDe,
      noiDung,
      maVe,
      veId
    });

    await ticket.save();

    // GỬI THÔNG BÁO CHO ADMIN
    const admins = await NhanVien.find({ trangThai: 'active' }).select('_id');
    const recipients = admins.map(admin => ({
        userId: admin._id,
        recipientModel: 'NhanVien',
        isRead: false
    }));

    if (recipients.length > 0) {
        const notification = new ThongBao({
            tieuDe: 'Yêu cầu hỗ trợ mới',
            noiDung: `Khách hàng ${req.user.hoTen} vừa gửi yêu cầu: "${tieuDe}"`,
            loai: 'support',
            sender: req.user.hoTen,
            recipients,
            relatedId: ticket._id,
            isAdminOnly: true,
            metadata: { 
                link: '/admin/ho-tro',
                maVe: maVe || null
            }
        });
        await notification.save();
    }

    res.status(201).json({
      message: 'Đã gửi yêu cầu hỗ trợ thành công',
      ticket
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi yêu cầu hỗ trợ', error: err.message });
  }
};

router.post('/tickets', authMiddleware, createTicketHandler);
router.post('/', authMiddleware, createTicketHandler); // Hỗ trợ gọi trực tiếp vào /api/support-requests

// ============================================================
// @route   GET /api/support/tickets/:ticketId
// @desc    Chi tiết phản hồi hỗ trợ
// ============================================================
router.get('/tickets/:ticketId', authMiddleware, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ' });

    // Kiểm tra quyền sở hữu
    if (ticket.khachHangId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xem yêu cầu này' });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết yêu cầu hỗ trợ', error: err.message });
  }
});

module.exports = router;
