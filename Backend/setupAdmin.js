const mongoose = require('mongoose');
const NhanVien = require('./models/NhanVien');
require('dotenv').config();

const createInitialAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if any admin exists
    const adminCount = await NhanVien.countDocuments();
    if (adminCount > 0) {
      console.log('Admin account already exists. Skipping insertion.');
      process.exit(0);
    }

    const admin = new NhanVien({
      hoTen: 'Quản Trị Viên',
      email: 'admin@gmail.com',
      matKhau: '123456', // Sẽ được tự động hash trước khi save nhờ mongoose hook
      soDienThoai: '0987654321'
    });

    await admin.save();
    console.log('✅ Created root admin account successfully:');
    console.log('Email: admin@gmail.com');
    console.log('Password: 123456');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

createInitialAdmin();
