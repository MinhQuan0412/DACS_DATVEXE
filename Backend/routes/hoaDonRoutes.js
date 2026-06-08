const express = require('express');
const HoaDon = require('../models/HoaDon');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// ============================================================
// @route   GET /api/invoices/:invoiceId
// @desc    Xem chi tiết hóa đơn của user
// ============================================================
router.get('/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const invoice = await HoaDon.findById(req.params.invoiceId)
      .populate({
        path: 'veId',
        populate: {
          path: 'chuyenXeId',
          populate: { path: 'tuyenXeId' }
        }
      })
      .populate('khachHangId', 'hoTen soDienThoai email');

    if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

    // Kiểm tra quyền sở hữu
    if (invoice.khachHangId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xem hóa đơn này' });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết hóa đơn', error: err.message });
  }
});

module.exports = router;
