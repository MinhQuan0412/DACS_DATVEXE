const express = require('express');
const DanhGia = require('../models/DanhGia');
const Ve = require('../models/Ve');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// @route   POST /api/reviews
// @desc    Add a review for a trip
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { chuyenXeId, soSao, nhanXet } = req.body;
    
    // Kiểm tra xem user đã đi chuyến xe này chưa
    const ve = await Ve.findOne({ khachHangId: req.user._id, chuyenXeId, trangThai: 'paid' });
    if (!ve) {
        return res.status(403).json({ message: 'Bạn chưa mua vé hoặc vé chưa thanh toán nên không thể đánh giá chuyến xe này' });
    }

    const danhGia = new DanhGia({
      khachHangId: req.user._id,
      chuyenXeId,
      soSao,
      nhanXet
    });

    await danhGia.save();
    res.status(201).json({ message: 'Đã thêm đánh giá thành công', danhGia });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm đánh giá', error: err.message });
  }
});

// @route   GET /api/reviews/chuyen-xe/:id
// @desc    Get reviews for a specific trip
router.get('/chuyen-xe/:id', async (req, res) => {
  try {
    const reviews = await DanhGia.find({ chuyenXeId: req.params.id })
        .populate('khachHangId', 'hoTen')
        .sort({ ngayDanhGia: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách đánh giá', error: err.message });
  }
});

module.exports = router;
