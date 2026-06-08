const mongoose = require('mongoose');
const ChuyenXe = require('./models/ChuyenXe');
const Ve = require('./models/Ve');
require('dotenv').config();

const checkCancel = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    
    // Tìm 1 vé đã hủy gần nhất
    const lastCancelled = await Ve.findOne({ trangThai: 'cancelled' }).sort({ updatedAt: -1 });
    if (!lastCancelled) {
        console.log('No cancelled bookings found.');
        process.exit(0);
    }
    
    console.log('Last cancelled booking:', lastCancelled.maVe);
    console.log('Seats in booking:', lastCancelled.danhSachGhe);
    
    const trip = await ChuyenXe.findById(lastCancelled.chuyenXeId);
    console.log('Seats currently in trip.gheDaDat:', trip.gheDaDat);
    
    const intersection = lastCancelled.danhSachGhe.filter(seat => trip.gheDaDat.includes(seat));
    if (intersection.length > 0) {
        console.log('FAIL: These seats should have been removed from trip.gheDaDat:', intersection);
    } else {
        console.log('SUCCESS: Seats were correctly removed from trip.gheDaDat.');
    }

    process.exit(0);
};

checkCancel();
