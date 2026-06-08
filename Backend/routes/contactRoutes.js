const express = require('express');
const LienHe = require('../models/LienHe');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// @route   POST /api/contacts
// @desc    Tạo lời nhắn liên hệ mới (Đồng thời tạo Ticket hỗ trợ cho Admin)
router.post('/', async (req, res) => {
  try {
    const { hoTen, email, soDienThoai, tieuDe, noiDung } = req.body;

    const lienHe = new LienHe({
      hoTen,
      email,
      soDienThoai,
      tieuDe,
      noiDung
    });

    await lienHe.save();

    // ĐỒNG BỘ: Tự động tạo SupportTicket để Admin thấy trong mục CSKH
    try {
      const SupportTicket = require('../models/SupportTicket');
      const newTicket = new SupportTicket({
        hoTen,
        email,
        soDienThoai: soDienThoai || 'N/A',
        tieuDe: `[Liên hệ] ${tieuDe}`,
        noiDung: noiDung,
        trangThai: 'open'
      });
      await newTicket.save();
    } catch (ticketErr) {
      console.error('Lỗi tạo Ticket đồng bộ:', ticketErr);
    }

    // Tự động tạo thông báo cho Admin
    try {
      const ThongBao = require('../models/ThongBao');
      const thongBao = new ThongBao({
        tieuDe: 'Có yêu cầu hỗ trợ mới',
        noiDung: `Khách hàng ${hoTen} vừa gửi yêu cầu: "${tieuDe}"`,
        loai: 'support',
        sender: hoTen,
        isAdminOnly: true,
        metadata: { link: '/admin/ho-tro' }
      });
      await thongBao.save();
    } catch (notifyErr) {
      console.error('Lỗi tạo thông báo Admin:', notifyErr);
    }

    res.status(201).json({ message: 'Đã gửi lời nhắn hỗ trợ thành công', lienHe });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi yêu cầu', error: err.message });
  }
});

// @route   GET /api/contacts
// @desc    Lấy danh sách phản hồi (Dành cho Admin - Gộp cả Ticket)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'nhanvien';
    if (!isAdmin) {
      return res.status(403).json({ message: 'Chỉ admin/nhân viên mới có quyền xem' });
    }

    const SupportTicket = require('../models/SupportTicket');
    
    // 1. Lấy từ LienHe
    const contacts = await LienHe.find().lean();
    
    // 2. Lấy từ SupportTicket
    const tickets = await SupportTicket.find()
      .populate('khachHangId', 'hoTen soDienThoai email')
      .lean();

    // 3. Chuẩn hóa format
    const formattedTickets = tickets.map(t => ({
        ...t,
        tieuDe: `[Hỗ trợ] ${t.tieuDe}`,
        createdAt: t.createdAt
    }));

    const formattedContacts = contacts.map(c => ({
        ...c,
        tieuDe: `[Liên hệ] ${c.tieuDe}`,
        createdAt: c.createdAt || c.ngayGui
    }));

    // 4. Gộp và trả về
    const all = [...formattedTickets, ...formattedContacts].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(all);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách phản hồi', error: err.message });
  }
});

module.exports = router;

