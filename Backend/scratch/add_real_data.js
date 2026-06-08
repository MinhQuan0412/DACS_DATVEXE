const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ChuyenXe = require('../models/ChuyenXe');
const Ve = require('../models/Ve');
const HoaDon = require('../models/HoaDon');
const KhachHang = require('../models/KhachHang');
const TuyenXe = require('../models/TuyenXe');
const Xe = require('../models/Xe');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking').then(async () => {
  console.log('Connected to MongoDB');

  // Find the user Phạm Huỳnh Minh Quân
  let user = await KhachHang.findOne({ hoTen: { $regex: /phạm huỳnh minh quân/i } });
  
  if (!user) {
    user = await KhachHang.findOne({ email: 'phamminhquan05513@gmail.com' });
  }

  if (!user) {
      console.log('User not found. Exiting.');
      process.exit(1);
  }

  let xe = await Xe.findOne();
  if (!xe) {
      console.log('No Xe found, cannot create ChuyenXe');
      process.exit(1);
  }

  // Clear user's old tickets
  await Ve.deleteMany({ khachHangId: user._id });
  console.log('Cleaned up old test tickets');

  // Find all routes in database
  const allTuyen = await TuyenXe.find({ diemDi: { $ne: 'Trạm Test A' } });
  if (allTuyen.length === 0) {
      console.log('No routes found in database.');
      process.exit(1);
  }

  // Parse price helper
  const parsePrice = (t) => {
    if (!t.giaVe) return 0;
    const num = parseInt(t.giaVe.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // Find the cheapest route
  const sortedTuyen = allTuyen
    .map(t => ({ tuyen: t, price: parsePrice(t) }))
    .filter(item => item.price > 0)
    .sort((a, b) => a.price - b.price);

  if (sortedTuyen.length === 0) {
      console.log('No routes with valid prices found.');
      process.exit(1);
  }

  const cheapest = sortedTuyen[0];
  const tuyen = cheapest.tuyen;
  const giaVe = cheapest.price;
  console.log(`Cheapest route found: ${tuyen.diemDi} -> ${tuyen.diemDen} with price: ${giaVe}đ (${tuyen.giaVe})`);

  // Create 1 trip on this cheapest route
  const khoiHanh = new Date();
  khoiHanh.setDate(khoiHanh.getDate() + 2); 
  khoiHanh.setHours(9, 0, 0, 0);
  const denNoi = new Date(khoiHanh.getTime() + 4 * 60 * 60 * 1000);

  const trip = new ChuyenXe({
    tuyenXeId: tuyen._id,
    xeId: xe._id,
    thoiGianKhoiHanh: khoiHanh,
    thoiGianDen: denNoi,
    giaVe: giaVe,
    tongSoGhe: xe.soGhe || 34,
    gheDaDat: [],
    trangThai: 'active',
    loaiXe: xe.loaiXe || 'Limousine Giường Nằm',
  });

  const ghes = ['A01', 'A02'];
  trip.gheDaDat = ghes;
  await trip.save();

  const tongTien = giaVe * ghes.length;

  const dateStr = khoiHanh.toLocaleDateString('vi-VN');
  const timeStr = khoiHanh.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const denNoiStr = denNoi.toLocaleDateString('vi-VN');
  const denNoiTimeStr = denNoi.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const diemDonDau = tuyen.diemDon && tuyen.diemDon.length > 0 
    ? { tenDiem: tuyen.diemDon[0].tenDiem, diaChi: tuyen.diemDon[0].diaChi || '', thoiGian: `${timeStr} - ${dateStr}` }
    : { tenDiem: 'Bến xe đón', diaChi: 'Địa chỉ đón', thoiGian: `${timeStr} - ${dateStr}` };

  const diemTraDau = tuyen.diemTra && tuyen.diemTra.length > 0 
    ? { tenDiem: tuyen.diemTra[0].tenDiem, diaChi: tuyen.diemTra[0].diaChi || '', thoiGian: `${denNoiTimeStr} - ${denNoiStr}` }
    : { tenDiem: 'Bến xe trả', diaChi: 'Địa chỉ trả', thoiGian: `${denNoiTimeStr} - ${denNoiStr}` };

  const ve = new Ve({
    khachHangId: user._id,
    chuyenXeId: trip._id,
    danhSachGhe: ghes,
    tongTien,
    hoTen: user.hoTen,
    soDienThoai: user.soDienThoai,
    email: user.email,
    diemDon: diemDonDau,
    diemTra: diemTraDau,
    trangThai: 'paid', // Real ticket
    phuongThucThanhToan: 'Thanh toán trực tuyến (Sepay)',
    maGiaoDich: 'SP' + Math.floor(Math.random() * 1000000000),
    ghiChu: 'Hành khách nhớ đến trước 30 phút. Mang theo CMND/CCCD để đối chiếu.',
  });
  await ve.save();

  const hoaDon = new HoaDon({
    veId: ve._id,
    khachHangId: user._id,
    tongTien,
    phuongThucThanhToan: 'Thanh toán trực tuyến (Sepay)',
    trangThai: 'completed',
  });
  await hoaDon.save();

  console.log(`Created new FULL DETAILED PAID ticket on cheapest existing route (${tuyen.diemDi} -> ${tuyen.diemDen}) for ${user.hoTen}`);
  mongoose.disconnect();

}).catch(err => console.log(err));
