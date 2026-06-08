const mongoose = require('mongoose');
require('dotenv').config();

// Load Models with correct relative paths
const Ve = require('../models/Ve');
const HoaDon = require('../models/HoaDon');
const ThongBao = require('../models/ThongBao');
const LienHe = require('../models/LienHe');
const DanhGia = require('../models/DanhGia');
const ChuyenXe = require('../models/ChuyenXe');
const Voucher = require('../models/Voucher');

async function totalReset() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    console.log('--- ĐANG TIẾN HÀNH DỌN DẸP HỆ THỐNG CHO BUỔI DEMO ---');

    // 1. Xóa các bảng dữ liệu lịch sử
    const deletedVe = await Ve.deleteMany({});
    const deletedHD = await HoaDon.deleteMany({});
    const deletedTB = await ThongBao.deleteMany({});
    const deletedLH = await LienHe.deleteMany({});
    const deletedDG = await DanhGia.deleteMany({});
    
    console.log(`- Đã xóa ${deletedVe.deletedCount} vé.`);
    console.log(`- Đã xóa ${deletedHD.deletedCount} hóa đơn.`);
    console.log(`- Đã xóa ${deletedTB.deletedCount} thông báo.`);
    console.log(`- Đã xóa ${deletedLH.deletedCount} phản hồi khách hàng.`);
    console.log(`- Đã xóa ${deletedDG.deletedCount} đánh giá.`);

    // 2. Reset trạng thái các Chuyến xe (Làm trống tất cả ghế)
    const resetTrips = await ChuyenXe.updateMany({}, { 
        $set: { gheDaDat: [], tongSoGheTrong: 34 } 
    });
    console.log(`- Đã reset ${resetTrips.modifiedCount} chuyến xe về trạng thái trống ghế 100%.`);

    // 3. Reset lượt dùng Voucher
    const resetVouchers = await Voucher.updateMany({}, { $set: { daSuDung: 0 } });
    console.log(`- Đã reset lượt dùng của ${resetVouchers.modifiedCount} mã voucher về 0.`);

    console.log('\n=> KẾT QUẢ: Dashboard đã về 0, biểu đồ đã sạch, hệ thống sẵn sàng Demo!');
    process.exit();
  } catch (err) {
    console.error('LỖI KHI DỌN DẸP:', err);
    process.exit(1);
  }
}

totalReset();
