const mongoose = require('mongoose');
const TuyenXe = require('./models/TuyenXe');
const ChuyenXe = require('./models/ChuyenXe');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await TuyenXe.deleteMany({});
    await ChuyenXe.deleteMany({});

    // Create Routes
    const route1 = await TuyenXe.create({
      diemDi: 'TP. Hồ Chí Minh',
      diemDen: 'Đà Lạt',
      khoangCach: 300,
      thoiGianDuKien: '7 giờ'
    });

    const route2 = await TuyenXe.create({
      diemDi: 'TP. Hồ Chí Minh',
      diemDen: 'Nha Trang',
      khoangCach: 450,
      thoiGianDuKien: '9 giờ'
    });

    const route3 = await TuyenXe.create({
      diemDi: 'Hà Nội',
      diemDen: 'Sapa',
      khoangCach: 320,
      thoiGianDuKien: '6 giờ'
    });

    // Create Trips
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    await ChuyenXe.create([
      {
        tuyenXeId: route1._id,
        xeId: '51B-123.45',
        thoiGianKhoiHanh: tomorrow,
        giaVe: 250000
      },
      {
        tuyenXeId: route1._id,
        xeId: '51B-678.90',
        thoiGianKhoiHanh: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000), // +4 hours
        giaVe: 280000
      },
      {
        tuyenXeId: route2._id,
        xeId: '79A-111.22',
        thoiGianKhoiHanh: tomorrow,
        giaVe: 300000
      },
      {
        tuyenXeId: route3._id,
        xeId: '29B-333.44',
        thoiGianKhoiHanh: tomorrow,
        giaVe: 350000
      }
    ]);

    console.log('Seed data created successfully!');
    process.exit();
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
