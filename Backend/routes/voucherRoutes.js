const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const authMiddleware = require('../middleware/authMiddleware');
const Ve = require('../models/Ve');

// ============================================================
// @route   GET /api/vouchers
// @desc    Lấy danh sách mã giảm giá (Shopee-style: hiện cả mã không dùng được và lý do)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { tongTien, tuyenXeId } = req.query;
    const vouchers = await Voucher.find({ trangThai: 'active' }).sort({ createdAt: -1 });
    
    const now = new Date();
    const result = await Promise.all(vouchers.map(async (v) => {
        const voucher = v.toObject();
        voucher.isAvailable = true;
        voucher.reason = "";

        // 1. Kiểm tra ngày
        if (v.ngayBatDau && v.ngayBatDau > now) {
            voucher.isAvailable = false;
            voucher.reason = "Chưa đến thời gian áp dụng";
        } else if (v.ngayHetHan && v.ngayHetHan < now) {
            voucher.isAvailable = false;
            voucher.reason = "Đã hết hạn sử dụng";
        }

        // 2. Kiểm tra số lượng
        if (voucher.isAvailable && v.daSuDung >= v.soLuong) {
            voucher.isAvailable = false;
            voucher.reason = "Đã hết lượt sử dụng";
        }

        // 3. Kiểm tra khách mới
        if (voucher.isAvailable && v.choKhachHangMoi) {
            // Chỉ tính là khách cũ nếu đã từng có đơn hàng được thanh toán thành công
            const count = await Ve.countDocuments({ 
                khachHangId: req.user._id, 
                trangThai: { $in: ['paid', 'confirmed', 'completed'] } 
            });
            if (count > 0) {
                voucher.isAvailable = false;
                voucher.reason = "Mã này chỉ dành cho khách hàng mới đặt vé lần đầu";
            }
        }

        // 4. Kiểm tra lượt dùng cá nhân
        if (req.user) {
            const userUsageCount = await Ve.countDocuments({
                khachHangId: req.user._id,
                maVoucher: v.maVoucher,
                trangThai: { $in: ['paid', 'confirmed', 'completed'] }
            });
            if (userUsageCount >= (v.luotDungToiDaMoiNguoi || 1)) {
                voucher.isAvailable = false;
                voucher.reason = "Bạn đã hết lượt dùng mã này";
            }
        }

        // 5. Kiểm tra đơn tối thiểu (Chỉ báo lý do nếu có tongTien)
        if (voucher.isAvailable && tongTien && Number(tongTien) < v.giaTriToiThieu) {
            voucher.isAvailable = false;
            voucher.reason = `Chưa đạt đơn tối thiểu ${v.giaTriToiThieu.toLocaleString()}đ`;
        }

        return voucher;
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách ưu đãi', error: err.message });
  }
});

// ============================================================
// @route   POST /api/vouchers/apply
// @desc    Kiểm tra và áp dụng mã voucher
// ============================================================
router.post('/apply', authMiddleware, async (req, res) => {
    return handleVoucherApply(req, res);
});

// Alias cho FE dễ dùng
router.post('/check', authMiddleware, async (req, res) => {
    return handleVoucherApply(req, res);
});

async function handleVoucherApply(req, res) {
  try {
    const { maVoucher, tongTien, tuyenXeId } = req.body;
    console.log(`[VOUCHER-CHECK] Khách ${req.user ? req.user.hoTen : 'Ẩn danh'} đang thử áp mã: ${maVoucher} cho đơn ${tongTien}đ`);

    if (!maVoucher || !tongTien) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã voucher và số tiền đơn hàng' });
    }

    const voucher = await Voucher.findOne({ 
        maVoucher: maVoucher.toUpperCase(), 
        trangThai: 'active' 
    });

    if (!voucher) {
      return res.status(404).json({ message: 'Mã voucher không tồn tại hoặc đã bị tắt' });
    }

    const now = new Date();
    // Kiểm tra ngày bắt đầu
    if (voucher.ngayBatDau && voucher.ngayBatDau > now) {
        return res.status(400).json({ message: 'Mã voucher này chưa đến thời gian áp dụng' });
    }
    // Kiểm tra ngày hết hạn
    if (voucher.ngayHetHan && voucher.ngayHetHan < now) {
      return res.status(400).json({ message: 'Mã voucher đã hết hạn sử dụng' });
    }

    // Kiểm tra số lượng tổng
    if (voucher.daSuDung >= voucher.soLuong) {
      return res.status(400).json({ message: 'Mã voucher đã hết lượt sử dụng' });
    }

    // Kiểm tra đơn hàng tối thiểu
    if (tongTien < voucher.giaTriToiThieu) {
      return res.status(400).json({ message: `Đơn hàng tối thiểu để dùng mã này là ${voucher.giaTriToiThieu.toLocaleString()}đ` });
    }

    // Kiểm tra tuyến xe (nếu có giới hạn)
    if (voucher.apDungTuyen === 'selected' && tuyenXeId) {
        if (!voucher.tuyenXeDuocApDung.includes(tuyenXeId)) {
            return res.status(400).json({ message: 'Mã voucher không áp dụng cho tuyến xe này' });
        }
    }

    // Kiểm tra khách hàng mới (Đảm bảo req.user tồn tại)
    // 3. Kiểm tra khách mới (Chỉ tính những ai đã thanh toán thành công)
    if (voucher.choKhachHangMoi) {
      const successCount = await Ve.countDocuments({
        khachHangId: req.user._id,
        trangThai: { $in: ['paid', 'confirmed', 'completed'] }
      });
      if (successCount > 0) {
        return res.status(400).json({ message: 'Mã giảm giá này chỉ dành cho khách hàng mới đặt vé lần đầu' });
      }
    }

    // Kiểm tra giới hạn dùng mỗi người (Đảm bảo req.user tồn tại)
    if (req.user) {
      const userUsageCount = await Ve.countDocuments({
          khachHangId: req.user._id,
          maVoucher: voucher.maVoucher,
          trangThai: { $in: ['paid', 'confirmed', 'completed'] }
      });

      if (userUsageCount >= (voucher.luotDungToiDaMoiNguoi || 1)) {
          return res.status(400).json({ message: 'Bạn đã dùng hết lượt sử dụng mã này' });
      }
    }

    // Tính toán số tiền giảm
    let soTienGiam = 0;
    if (voucher.loaiGiamGia === 'fixed') {
      soTienGiam = voucher.giaTriGiam;
    } else {
      soTienGiam = (tongTien * voucher.giaTriGiam) / 100;
      if (voucher.giamToiDa && soTienGiam > voucher.giamToiDa) {
        soTienGiam = voucher.giamToiDa;
      }
    }

    res.json({
      message: 'Áp dụng mã giảm giá thành công',
      voucher: {
        voucherId: voucher._id,
        maVoucher: voucher.maVoucher,
        soTienGiam,
        moTa: voucher.moTa
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Lỗi kiểm tra voucher', error: err.message });
  }
}

module.exports = router;
