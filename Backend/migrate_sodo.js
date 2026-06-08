const mongoose = require('mongoose');
const Xe = require('./models/Xe');
const SoDoGhe = require('./models/SoDoGhe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const migrateToSeparateSoDoGhe = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Tạo sơ đồ ghế 34 chỗ mẫu
    const danhSachGhe34 = [];
    for (let i = 1; i <= 17; i++) danhSachGhe34.push(`A${String(i).padStart(2, '0')}`);
    for (let i = 1; i <= 17; i++) danhSachGhe34.push(`B${String(i).padStart(2, '0')}`);

    let sodo34 = await SoDoGhe.findOne({ tenSoDo: "Sơ đồ xe giường nằm 34 chỗ" });
    if (!sodo34) {
      sodo34 = new SoDoGhe({
        tenSoDo: "Sơ đồ xe giường nằm 34 chỗ",
        loaiXe: "Giường nằm",
        tongSoGhe: 34,
        soTang: 2,
        danhSachGhe: danhSachGhe34
      });
      await sodo34.save();
      console.log('✅ Created default 34-seat map');
    }

    // 2. Cập nhật tất cả Xe để trỏ tới sơ đồ này
    const vehicles = await Xe.find({});
    console.log(`Found ${vehicles.length} vehicles to migrate...`);
    
    for (const xe of vehicles) {
      xe.soDoGheId = sodo34._id;
      xe.tongSoGhe = 34;
      await xe.save();
    }
    console.log('✅ Migrated all vehicles to use SoDoGhe model.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
};

migrateToSeparateSoDoGhe();
