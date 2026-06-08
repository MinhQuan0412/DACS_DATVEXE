const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const KhachHang = require('./models/KhachHang');
  const TuyenXe = require('./models/TuyenXe');
  const Xe = require('./models/Xe');
  const ChuyenXe = require('./models/ChuyenXe');
  const Ve = require('./models/Ve');
  const SoDoGhe = require('./models/SoDoGhe');

  // 1. Lấy khách hàng
  const customers = await KhachHang.find({ trangThai: { $ne: 'inactive' } }).lean();
  console.log(`Tìm thấy ${customers.length} khách hàng`);

  // 2. Lấy 1 chuyến trong tương lai (chưa đầy)
  const trips = await ChuyenXe.find({ 
    trangThai: 'active',
    thoiGianKhoiHanh: { $gt: new Date() }
  }).populate('tuyenXeId').populate('xeId').sort({ thoiGianKhoiHanh: 1 });

  let trip = null;
  let seatMap = null;
  let availableSeats = [];
  let allSeats = [];

  for (const t of trips) {
    const sm = await SoDoGhe.findById(t.xeId.soDoGheId).lean();
    if (!sm) continue;
    const seats = sm.danhSachGhe.map(g => g.maGhe);
    const avail = seats.filter(s => !(t.gheDaDat || []).includes(s));
    if (avail.length > 10) {  // Chọn chuyến còn nhiều ghế trống
      trip = t;
      seatMap = sm;
      allSeats = seats;
      availableSeats = avail;
      break;
    }
  }

  if (!trip) { console.log('Không tìm thấy chuyến phù hợp!'); process.exit(1); }

  console.log(`\n🚌 Chuyến: ${trip.tuyenXeId.diemDi} -> ${trip.tuyenXeId.diemDen}`);
  console.log(`   Xe: ${trip.xeId.bienSo}`);
  console.log(`   Giờ đi: ${new Date(trip.thoiGianKhoiHanh).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
  console.log(`   Còn trống: ${availableSeats.length}/${allSeats.length} ghế`);

  // 3. Giá vé & điểm
  const giaVeNum = parseInt(trip.tuyenXeId.giaVe.replace(/\D/g, '')) || 0;
  const diemDon = trip.tuyenXeId.diemDon?.[0] || { tenDiem: 'Bến xe' };
  const diemTra = trip.tuyenXeId.diemTra?.[0] || { tenDiem: 'Bến xe' };
  const pttt = ['Sepay', 'Momo', 'VnPay', 'Chuyển khoản'];

  // 4. Tạo vé từng cái (để kích hoạt pre-save hook tạo mã vé)
  let seatIndex = 0;
  let customerIndex = 0;
  const allBookedSeats = [...(trip.gheDaDat || [])];
  let totalCreated = 0;

  console.log('\n--- Đang tạo vé ---');

  while (seatIndex < availableSeats.length) {
    const customer = customers[customerIndex % customers.length];
    const seatsPerCustomer = Math.min(
      Math.floor(Math.random() * 3) + 1,
      availableSeats.length - seatIndex
    );
    
    const customerSeats = availableSeats.slice(seatIndex, seatIndex + seatsPerCustomer);

    const ve = new Ve({
      khachHangId: customer._id,
      chuyenXeId: trip._id,
      danhSachGhe: customerSeats,
      tongTien: giaVeNum * customerSeats.length,
      hoTen: customer.hoTen,
      soDienThoai: customer.soDienThoai,
      email: customer.email || `${customer.soDienThoai}@bluebus.vn`,
      diemDon: { tenDiem: diemDon.tenDiem, diaChi: diemDon.diaChi },
      diemTra: { tenDiem: diemTra.tenDiem, diaChi: diemTra.diaChi },
      phuongThucThanhToan: pttt[Math.floor(Math.random() * pttt.length)],
      trangThai: 'paid',
      ngayDat: new Date()
    });

    await ve.save();  // Kích hoạt pre-save hook để tạo mã vé
    console.log(`  🎫 ${ve.maVe} | ${customer.hoTen} | Ghế: ${customerSeats.join(',')} | ${(giaVeNum * customerSeats.length).toLocaleString()}đ`);

    allBookedSeats.push(...customerSeats);
    seatIndex += seatsPerCustomer;
    customerIndex++;
    totalCreated++;
  }

  // 5. Cập nhật chuyến xe
  await ChuyenXe.findByIdAndUpdate(trip._id, { gheDaDat: allBookedSeats });

  console.log(`\n✅ HOÀN TẤT! Đã tạo ${totalCreated} vé`);
  console.log(`🚌 Chuyến ${trip.tuyenXeId.diemDi} -> ${trip.tuyenXeId.diemDen} giờ ĐÃ ĐẦY: ${allBookedSeats.length}/${allSeats.length} ghế`);

  process.exit();
}).catch(e => { console.error(e); process.exit(1); });
