const mongoose = require('mongoose');
const KhachHang = require('./models/KhachHang');
require('dotenv').config();

const checkPhone = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    const user = await KhachHang.findOne({ soDienThoai: '0933832671' });
    console.log('User found:', user);
    process.exit(0);
};

checkPhone();
