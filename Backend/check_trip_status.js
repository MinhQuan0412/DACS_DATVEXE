const mongoose = require('mongoose');
const ChuyenXe = require('./models/ChuyenXe');
require('dotenv').config();

const checkStatus = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    const trips = await ChuyenXe.find().select('trangThai thoiGianKhoiHanh');
    console.log(JSON.stringify(trips, null, 2));
    process.exit(0);
};

checkStatus();
