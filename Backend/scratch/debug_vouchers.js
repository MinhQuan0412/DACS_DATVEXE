const mongoose = require('mongoose');
require('dotenv').config();
const KhachHang = require('../models/KhachHang');
const Ve = require('../models/Ve');
const Voucher = require('../models/Voucher');

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    
    // 1. Check User
    const user = await KhachHang.findOne({ hoTen: /Trương Huỳnh Gia Linh/i });
    if (user) {
        const bookings = await Ve.countDocuments({ 
            khachHangId: user._id, 
            trangThai: { $in: ['paid', 'confirmed', 'completed'] } 
        });
        console.log('--- USER STATUS ---');
        console.log(`User: ${user.hoTen}`);
        console.log(`Booking Count (Successful): ${bookings}`);
        console.log(`Is New Customer: ${bookings === 0}`);
    } else {
        console.log('User "Trương Huỳnh Gia Linh" not found.');
    }

    // 2. Check Vouchers
    const vouchers = await Voucher.find({ trangThai: 'active' });
    console.log('\n--- ACTIVE VOUCHERS ---');
    vouchers.forEach(v => {
        console.log(`- Code: ${v.maVoucher}, Name: ${v.tenVoucher}, NewCustOnly: ${v.choKhachHangMoi}`);
    });

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStatus();
