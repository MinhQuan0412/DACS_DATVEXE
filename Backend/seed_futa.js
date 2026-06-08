const mongoose = require('mongoose');
const TuyenXe = require('./models/TuyenXe');
const ChuyenXe = require('./models/ChuyenXe');
require('dotenv').config();

const futaData = [
  {
    diemDi: 'TP. Hồ Chí Minh',
    diemDen: 'Đà Lạt',
    khoangCach: 310,
    thoiGianDuKien: '8 giờ',
    giaVe: 290000,
    loaiXe: 'Giường nằm / Limousine'
  },
  {
    diemDi: 'TP. Hồ Chí Minh',
    diemDen: 'Cần Thơ',
    khoangCach: 172,
    thoiGianDuKien: '3.5 giờ',
    giaVe: 165000,
    loaiXe: 'Giường nằm'
  },
  {
    diemDi: 'Đà Lạt',
    diemDen: 'Đà Nẵng',
    khoangCach: 700,
    thoiGianDuKien: '14 giờ',
    giaVe: 430000,
    loaiXe: 'Giường nằm'
  },
  {
    diemDi: 'Đà Nẵng',
    diemDen: 'TP. Hồ Chí Minh',
    khoangCach: 990,
    thoiGianDuKien: '20 giờ',
    giaVe: 430000,
    loaiXe: 'Giường nằm'
  },
  {
    diemDi: 'Đà Nẵng',
    diemDen: 'Nha Trang',
    khoangCach: 550,
    thoiGianDuKien: '10 giờ',
    giaVe: 445000,
    loaiXe: 'Giường nằm'
  }
];

const seedFuta = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for Futa seeding...');

    // Clear existing data
    await TuyenXe.deleteMany({});
    await ChuyenXe.deleteMany({});

    for (const data of futaData) {
      // Create Route
      const route = await TuyenXe.create({
        diemDi: data.diemDi,
        diemDen: data.diemDen,
        khoangCach: data.khoangCach,
        thoiGianDuKien: data.thoiGianDuKien
      });

      // Generate Trips for the next 3 days
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Morning trip
        const morning = new Date(date); morning.setHours(8, 0, 0, 0);
        await ChuyenXe.create({
          tuyenXeId: route._id,
          xeId: `FUTA-${Math.floor(Math.random() * 9000) + 1000}`,
          thoiGianKhoiHanh: morning,
          giaVe: data.giaVe,
          loaiXe: data.loaiXe
        });

        // Afternoon trip
        const afternoon = new Date(date); afternoon.setHours(14, 0, 0, 0);
        await ChuyenXe.create({
          tuyenXeId: route._id,
          xeId: `FUTA-${Math.floor(Math.random() * 9000) + 1000}`,
          thoiGianKhoiHanh: afternoon,
          giaVe: data.giaVe,
          loaiXe: data.loaiXe
        });

        // Night trip
        const night = new Date(date); night.setHours(22, 0, 0, 0);
        await ChuyenXe.create({
          tuyenXeId: route._id,
          xeId: `FUTA-${Math.floor(Math.random() * 9000) + 1000}`,
          thoiGianKhoiHanh: night,
          giaVe: data.giaVe,
          loaiXe: data.loaiXe
        });
      }
    }

    console.log('Futa Bus data seeded successfully! 5 routes and 45 trips created.');
    process.exit();
  } catch (err) {
    console.error('Error seeding Futa data:', err);
    process.exit(1);
  }
};

seedFuta();
