const mongoose = require('mongoose');
require('dotenv').config();
const Voucher = require('../models/Voucher');

async function seedVouchers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    
    // Xóa mã cũ để tránh trùng lặp
    await Voucher.deleteMany({});

    const vouchers = [
      {
        tenVoucher: "Ưu đãi Chào Bạn Mới",
        maVoucher: "CHAOBANMOI",
        moTa: "Giảm 50% cho bạn mới đặt vé lần đầu",
        loaiGiamGia: "percentage",
        giaTriGiam: 50,
        giamToiDa: 100000,
        giaTriToiThieu: 50000,
        ngayBatDau: new Date(),
        ngayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        soLuong: 1000,
        daSuDung: 0,
        choKhachHangMoi: true,
        trangThai: "active",
        luotDungToiDaMoiNguoi: 1
      },
      {
        tenVoucher: "Ưu đãi BlueBus 10K",
        maVoucher: "BLUEBUS10K",
        moTa: "Giảm 10k cho mọi đơn hàng",
        loaiGiamGia: "fixed",
        giaTriGiam: 10000,
        giaTriToiThieu: 50000,
        ngayBatDau: new Date(),
        ngayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        soLuong: 500,
        daSuDung: 0,
        choKhachHangMoi: false,
        trangThai: "active",
        luotDungToiDaMoiNguoi: 5
      },
      {
        tenVoucher: "Khuyến mãi Hè Rực Rỡ",
        maVoucher: "HE2026",
        moTa: "Giảm 20% cho đơn từ 200k",
        loaiGiamGia: "percentage",
        giaTriGiam: 20,
        giamToiDa: 50000,
        giaTriToiThieu: 200000,
        ngayBatDau: new Date(),
        ngayHetHan: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        soLuong: 200,
        daSuDung: 0,
        choKhachHangMoi: false,
        trangThai: "active",
        luotDungToiDaMoiNguoi: 1
      }
    ];

    await Voucher.insertMany(vouchers);
    console.log('--- ĐÃ NẠP DANH SÁCH VOUCHER MỚI THÀNH CÔNG ---');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedVouchers();
