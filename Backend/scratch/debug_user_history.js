const mongoose = require('mongoose');
require('dotenv').config();
const KhachHang = require('../models/KhachHang');
const Ve = require('../models/Ve');

async function debugUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    
    const user = await KhachHang.findOne({ hoTen: /Trương Huỳnh Gia Linh/i });
    if (!user) {
        console.log('User not found');
        process.exit();
    }

    const bookings = await Ve.find({ khachHangId: user._id });
    console.log('--- ALL BOOKINGS FOR USER ---');
    bookings.forEach(b => {
        console.log(`MaVe: ${b.maVe}, Status: ${b.trangThai}, Total: ${b.tongTien}, Voucher: ${b.maVoucher}`);
    });

    const successCount = await Ve.countDocuments({ 
        khachHangId: user._id, 
        trangThai: { $in: ['paid', 'confirmed', 'completed'] } 
    });
    console.log(`\nSUCCESS COUNT (Non-New): ${successCount}`);
    console.log(`Is Eligible for CHAOBANMOI: ${successCount === 0}`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugUser();
