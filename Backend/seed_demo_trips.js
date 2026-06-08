const mongoose = require('mongoose');
require('dotenv').config();

const ChuyenXe = require('./models/ChuyenXe');
const Ve = require('./models/Ve');
const HoaDon = require('./models/HoaDon');

// ===== DỮ LIỆU CÓ SẴN =====
const TUYEN = [
  { id: '6a01b36a4561c8a795b1cdb0', di: 'TP. Hồ Chí Minh', den: 'Đà Lạt',    gia: 250000 },
  { id: '6a020ae80c37bd3ac641830b', di: 'Bạc Liêu',        den: 'Cần Thơ',    gia: 160000 },
  { id: '6a030ac6983ebe41078e076c', di: 'Cần Thơ',         den: 'An Giang',   gia: 150000 },
  { id: '6a030bd38545913f74c2fdf8', di: 'Tiền Giang',      den: 'Cà Mau',     gia: 200000 },
  { id: '6a0446bb833147826947a0ff', di: 'Đà Nẵng',         den: 'Cần Thơ',    gia: 450000 },
];

const XE = [
  '6a01947293823bc33a09a92d',
  '6a042f6cd5fae2ee030db8b9',
  '6a042f84d5fae2ee030db8c5',
  '6a0793a7752bcab266b4fdef',
  '6a0812e1b324c9ffb3fb5402',
];

const KHACH = [
  { id: '69fc69c1460b2bb262d6a79a', ten: 'Nguyễn Văn A',        sdt: '0912345678', email: 'a@gmail.com' },
  { id: '69fcaaa27d3787765e5ee2e4', ten: 'Le Ngọc Thu',          sdt: '0906805512', email: 'thu@gmail.com' },
  { id: '69fd6846001c41c39bc9616d', ten: 'Gia Vỹ',               sdt: '0911222333', email: 'vy@gmail.com' },
  { id: '69fe8391a044a5daed02077d', ten: 'Gia Hyy',              sdt: '0988776655', email: 'hyy@gmail.com' },
  { id: '6a02dd77110a2fb15b7f7267', ten: 'Lê Văn Tám',           sdt: '0901234567', email: 'tam@gmail.com' },
  { id: '6a02e979585b81d700d1c759', ten: 'Phạm Minh Tuấn',       sdt: '0906805531', email: 'tuan@gmail.com' },
  { id: '6a0315fcc0f7693393a4d433', ten: 'Phạm Minh Quân',       sdt: '0856523614', email: 'quan@gmail.com' },
  { id: '6a032fb071882d64c3c81e5f', ten: 'Ngọc Thu',             sdt: '0906805513', email: 'thu2@gmail.com' },
  { id: '6a04d2dc2a4c1fff90198441', ten: 'Trương Huỳnh Gia',     sdt: '0933832671', email: 'gia@gmail.com' },
  { id: '6a05a1d26533a2af0cc43fab', ten: 'Phạm Huỳnh Minh Quân', sdt: '0817610291', email: 'minhquan@gmail.com' },
];

const ALL_SEATS = [
  'A01','A02','A03','A04','A05','A06','A07','A08','A09','A10','A11','A12','A13','A14','A15','A16','A17',
  'B01','B02','B03','B04','B05','B06','B07','B08','B09','B10','B11','B12','B13','B14','B15','B16','B17'
];

// Tạo ngày trong tương lai
const futureDate = (daysFromNow, hour = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');

  // ===== TẠO 8 CHUYẾN XE THƯỜNG =====
  const normalTrips = [];
  const tripConfigs = [
    { tuyenIdx: 0, xeIdx: 0, days: 1, hour: 6  },
    { tuyenIdx: 0, xeIdx: 1, days: 1, hour: 14 },
    { tuyenIdx: 1, xeIdx: 2, days: 2, hour: 7  },
    { tuyenIdx: 2, xeIdx: 3, days: 2, hour: 8  },
    { tuyenIdx: 3, xeIdx: 4, days: 3, hour: 6  },
    { tuyenIdx: 4, xeIdx: 0, days: 3, hour: 9  },
    { tuyenIdx: 1, xeIdx: 1, days: 4, hour: 7  },
    { tuyenIdx: 2, xeIdx: 2, days: 5, hour: 6  },
  ];

  for (const cfg of tripConfigs) {
    const tuyen = TUYEN[cfg.tuyenIdx];
    const khoiHanh = futureDate(cfg.days, cfg.hour);
    const denNoi = new Date(khoiHanh.getTime() + 6 * 60 * 60 * 1000);

    const trip = new ChuyenXe({
      tuyenXeId: tuyen.id,
      xeId: XE[cfg.xeIdx],
      thoiGianKhoiHanh: khoiHanh,
      thoiGianDen: denNoi,
      giaVe: tuyen.gia,
      tongSoGhe: 34,
      gheDaDat: [],
      trangThai: 'active',
      loaiXe: 'Limousine Giường Nằm',
    });
    await trip.save();
    normalTrips.push(trip);
    console.log(`✅ Tạo chuyến: ${tuyen.di} → ${tuyen.den} | ${khoiHanh.toLocaleString('vi-VN')}`);
  }

  // ===== TẠO 1 CHUYẾN ĐẶC BIỆT: 33/34 GHẾ ĐÃ ĐẶT =====
  const specialTuyen = TUYEN[0]; // HCM → Đà Lạt
  const specialKhoiHanh = futureDate(2, 10);
  const specialDen = new Date(specialKhoiHanh.getTime() + 6 * 60 * 60 * 1000);

  // 33 ghế đặt, còn lại B17
  const bookedSeats = ALL_SEATS.slice(0, 33); // A01-A17 + B01-B16 = 33 ghế
  const remainingSeat = 'B17';

  const specialTrip = new ChuyenXe({
    tuyenXeId: specialTuyen.id,
    xeId: XE[3],
    thoiGianKhoiHanh: specialKhoiHanh,
    thoiGianDen: specialDen,
    giaVe: specialTuyen.gia,
    tongSoGhe: 34,
    gheDaDat: bookedSeats,
    trangThai: 'active',
    loaiXe: 'Limousine Giường Nằm',
  });
  await specialTrip.save();
  console.log(`\n🔥 Tạo chuyến ĐẶC BIỆT: ${specialTuyen.di} → ${specialTuyen.den}`);
  console.log(`   33 ghế đã đặt, còn dư: ${remainingSeat}`);

  // Tạo vé cho 33 ghế, chia đều cho các khách hàng
  // Mỗi khách đặt 3-4 ghế
  const seatGroups = [
    { khachIdx: 0, ghes: ['A01','A02','A03'] },
    { khachIdx: 1, ghes: ['A04','A05','A06'] },
    { khachIdx: 2, ghes: ['A07','A08','A09'] },
    { khachIdx: 3, ghes: ['A10','A11','A12'] },
    { khachIdx: 4, ghes: ['A13','A14','A15'] },
    { khachIdx: 5, ghes: ['A16','A17','B01'] },
    { khachIdx: 6, ghes: ['B02','B03','B04'] },
    { khachIdx: 7, ghes: ['B05','B06','B07'] },
    { khachIdx: 8, ghes: ['B08','B09','B10'] },
    { khachIdx: 9, ghes: ['B11','B12','B13','B14','B15','B16'] },
  ];

  for (const group of seatGroups) {
    const khach = KHACH[group.khachIdx];
    const tongTien = specialTuyen.gia * group.ghes.length;
    const maVe = 'VE-DEMO-' + Date.now() + '-' + group.khachIdx;

    const ve = new Ve({
      khachHangId: khach.id,
      chuyenXeId: specialTrip._id,
      danhSachGhe: group.ghes,
      tongTien,
      hoTen: khach.ten,
      soDienThoai: khach.sdt,
      email: khach.email,
      maVe,
      diemDon: { tenDiem: 'Bến xe Miền Đông' },
      diemTra: { tenDiem: 'Bến xe Đà Lạt' },
      trangThai: 'paid',
      phuongThucThanhToan: 'Sepay',
    });
    await ve.save();

    // Tạo hóa đơn
    const hoaDon = new HoaDon({
      veId: ve._id,
      khachHangId: khach.id,
      tongTien,
      phuongThucThanhToan: 'Sepay',
      trangThai: 'completed',
    });
    await hoaDon.save();

    console.log(`   👤 ${khach.ten}: ghế ${group.ghes.join(', ')} | ${tongTien.toLocaleString()}đ`);
  }

  console.log(`\n✅ XONG! Tổng kết:`);
  console.log(`   - 8 chuyến xe thường đã tạo`);
  console.log(`   - 1 chuyến đặc biệt: 33/34 ghế đã đặt, còn dư ghế ${remainingSeat}`);
  console.log(`   - 10 vé paid đã tạo cho chuyến đặc biệt`);

  mongoose.disconnect();
}).catch(err => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
