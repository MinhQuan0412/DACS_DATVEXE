const mongoose = require('mongoose');
const Xe = require('./models/Xe');
const ChuyenXe = require('./models/ChuyenXe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fixDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Tạo sơ đồ ghế mẫu 34 chỗ (A01-A17, B01-B17)
    const defaultSoDoGhe = [];
    for (let i = 1; i <= 17; i++) {
      defaultSoDoGhe.push(`A${String(i).padStart(2, '0')}`);
    }
    for (let i = 1; i <= 17; i++) {
      defaultSoDoGhe.push(`B${String(i).padStart(2, '0')}`);
    }

    // 1. Cập nhật tất cả Xe
    const vehicles = await Xe.find({});
    console.log(`Found ${vehicles.length} vehicles to update...`);
    
    for (const xe of vehicles) {
      xe.tongSoGhe = 34;
      xe.soDoGhe = defaultSoDoGhe;
      await xe.save();
    }
    console.log('✅ Updated all vehicles to 34 seats with default map.');

    // 2. Cập nhật tất cả ChuyenXe (nếu có lưu soGhe)
    const trips = await ChuyenXe.find({});
    console.log(`Found ${trips.length} trips to check...`);

    for (const trip of trips) {
      trip.soGhe = 34;
      // Nếu gheDaDat có ghế nằm ngoài sơ đồ mới (A18, B18), ta xóa chúng để tránh lỗi
      if (trip.gheDaDat && trip.gheDaDat.length > 0) {
        trip.gheDaDat = trip.gheDaDat.filter(seat => defaultSoDoGhe.includes(seat));
      }
      await trip.save();
    }
    console.log('✅ Updated all trips to 34 seats.');

    console.log('Database fix completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing database:', err);
    process.exit(1);
  }
};

fixDatabase();
