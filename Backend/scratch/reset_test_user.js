const mongoose = require('mongoose');
require('dotenv').config();
const KhachHang = require('../models/KhachHang');
const Ve = require('../models/Ve');

async function resetUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    
    const user = await KhachHang.findOne({ hoTen: /Phạm Huỳnh Minh Quân/i });
    if (!user) {
        console.log('User not found');
        process.exit();
    }

    const result = await Ve.deleteMany({ khachHangId: user._id });
    console.log(`Đã xóa ${result.deletedCount} vé cũ của khách hàng: ${user.hoTen}`);
    console.log('Bây giờ tài khoản này đã là KHÁCH HÀNG MỚI 100%!');
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetUser();
