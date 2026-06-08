const mongoose = require('mongoose');
const KhachHang = require('./models/KhachHang');
const ChuyenXe = require('./models/ChuyenXe');
const Ve = require('./models/Ve');
const HoaDon = require('./models/HoaDon');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    console.log('Connected to MongoDB');

    // 1. Tạo 2 khách hàng test
    const customer1 = await KhachHang.findOneAndUpdate(
      { soDienThoai: '0912345678' },
      {
        hoTen: 'Nguyễn Văn A',
        email: 'vana@example.com',
        matKhau: 'password123',
        soDienThoai: '0912345678',
        trangThai: 'active'
      },
      { upsert: true, new: true }
    );

    const customer2 = await KhachHang.findOneAndUpdate(
      { soDienThoai: '0987654321' },
      {
        hoTen: 'Trần Thị B',
        email: 'thib@example.com',
        matKhau: 'password123',
        soDienThoai: '0987654321',
        trangThai: 'active'
      },
      { upsert: true, new: true }
    );

    console.log('Created/Updated 2 test customers');

    // 2. Tạo một chuyến xe test (nếu chưa có hoặc lấy cái có sẵn)
    const tuyenId = '6a01b36a4561c8a795b1cdb0'; // Lấy từ kết quả check trước
    const xeId = '6a01947293823bc33a09a92d';    // Lấy từ kết quả check trước

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const trip = await ChuyenXe.create({
      tuyenXeId: tuyenId,
      xeId: xeId,
      thoiGianKhoiHanh: tomorrow,
      thoiGianDen: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000),
      trangThai: 'active',
      gheDaDat: ['A01', 'A02', 'B05']
    });

    console.log('Created test trip:', trip._id);

    // 3. Tạo 2 vé test
    const ve1 = await Ve.create({
      khachHangId: customer1._id,
      chuyenXeId: trip._id,
      danhSachGhe: ['A01', 'A02'],
      tongTien: 500000,
      hoTen: customer1.hoTen,
      soDienThoai: customer1.soDienThoai,
      diemDon: { tenDiem: 'Bến Xe Miền Tây', diaChi: '95 Kinh Dương Vương' },
      diemTra: { tenDiem: 'Bến xe Liên tỉnh Đà Lạt', diaChi: '01 Tô Hiến Thành' },
      phuongThucThanhToan: 'momo',
      trangThai: 'paid',
      ngayDat: new Date()
    });

    const ve2 = await Ve.create({
      khachHangId: customer2._id,
      chuyenXeId: trip._id,
      danhSachGhe: ['B05'],
      tongTien: 250000,
      hoTen: customer2.hoTen,
      soDienThoai: customer2.soDienThoai,
      diemDon: { tenDiem: 'Văn phòng Quận 5', diaChi: '231 Lê Hồng Phong' },
      diemTra: { tenDiem: 'Bến xe Liên tỉnh Đà Lạt', diaChi: '01 Tô Hiến Thành' },
      phuongThucThanhToan: 'tienmat',
      trangThai: 'pending',
      ngayDat: new Date()
    });

    // 4. Tạo hóa đơn cho vé đã thanh toán
    await HoaDon.create({
      veId: ve1._id,
      khachHangId: customer1._id,
      tongTien: ve1.tongTien,
      phuongThucThanhToan: ve1.phuongThucThanhToan,
      trangThai: 'completed'
    });

    console.log('Created 2 test tickets (1 paid, 1 pending)');
    console.log('Ticket 1 code:', ve1.maVe);
    console.log('Ticket 2 code:', ve2.maVe);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
