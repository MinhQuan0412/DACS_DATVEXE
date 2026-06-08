const express = require('express');
const TuyenXe = require('../models/TuyenXe');
const router = express.Router();

// @route   GET /api/routes
// @desc    Get all routes (Tuyen xe)
router.get('/', async (req, res) => {
  try {
    const routes = await TuyenXe.find().sort({ diemDi: 1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách tuyến xe', error: err.message });
  }
});

// @route   GET /api/routes/:id
// @desc    Get single route by ID
router.get('/:id', async (req, res) => {
  try {
    const route = await TuyenXe.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Không tìm thấy tuyến xe' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy thông tin tuyến xe', error: err.message });
  }
});

module.exports = router;
