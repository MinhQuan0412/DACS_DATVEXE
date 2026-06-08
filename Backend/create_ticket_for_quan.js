const mongoose = require('mongoose');
require('dotenv').config();
const KhachHang = require('./models/KhachHang');
const ChuyenXe = require('./models/ChuyenXe');
const TuyenXe = require('./models/TuyenXe');
const Xe = require('./models/Xe');
const Ve = require('./models/Ve');
const HoaDon = require('./models/HoaDon');

async function createTicket() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking');
    console.log('Connected!');

    // 1. Find user Phạm Huỳnh Minh Quân
    const query = {
      $or: [
        { hoTen: /Phạm Huỳnh Minh Quân/i },
        { hoTen: /pham huynh minh quan/i },
        { email: /phamminhquan05513/i }
      ]
    };
    
    let user = await KhachHang.findOne(query);
    if (!user) {
      console.log('User "Phạm Huỳnh Minh Quân" not found in DB. Searching for any Minh Quân user...');
      user = await KhachHang.findOne({ hoTen: /Minh Quân/i });
    }

    if (!user) {
      console.log('No such user found! Creating a new user account for Pham Huynh Minh Quan...');
      user = await KhachHang.create({
        hoTen: 'Phạm Huỳnh Minh Quân',
        email: 'phamminhquan05513@gmail.com',
        matKhau: '123456', // bcrypt will hash this on save
        soDienThoai: '0901234567',
        trangThai: 'active',
        role: 'user'
      });
      console.log('New user created:', user);
    } else {
      console.log('Found user:', {
        id: user._id,
        hoTen: user.hoTen,
        soDienThoai: user.soDienThoai,
        email: user.email
      });
    }

    // 2. Find an active trip, or create one if none exist
    let trip = await ChuyenXe.findOne({ trangThai: 'active' }).populate('tuyenXeId');
    if (!trip) {
      console.log('No active trip found. Creating a route, vehicle, and active trip...');
      
      // Find or create route
      let route = await TuyenXe.findOne();
      if (!route) {
        route = await TuyenXe.create({
          diemDi: 'TP. Hồ Chí Minh',
          diemDen: 'Đà Lạt',
          khoangCach: '300 km',
          thoiGianDi: '6 giờ',
          giaVe: '250000',
          trangThai: 'active',
          diemDon: [{ tenDiem: 'Bến Xe Miền Đông', diaChi: '292 Đinh Bộ Lĩnh', tinhThanh: 'TP. Hồ Chí Minh' }],
          diemTra: [{ tenDiem: 'Văn phòng Đà Lạt', diaChi: '01 Tô Hiến Thành', tinhThanh: 'Đà Lạt' }]
        });
        console.log('Route created:', route._id);
      }

      // Find or create vehicle
      let vehicle = await Xe.findOne();
      if (!vehicle) {
        vehicle = await Xe.create({
          bienSo: '51B-12345',
          loaiXe: 'Giường nằm 34 chỗ',
          soGhe: 34,
          trangThai: 'active'
        });
        console.log('Vehicle created:', vehicle._id);
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      trip = await ChuyenXe.create({
        tuyenXeId: route._id,
        xeId: vehicle._id,
        thoiGianKhoiHanh: tomorrow,
        thoiGianDen: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000),
        trangThai: 'active',
        gheDaDat: []
      });
      trip = await ChuyenXe.findById(trip._id).populate('tuyenXeId');
      console.log('Trip created:', trip._id);
    } else {
      console.log('Found active trip:', {
        id: trip._id,
        route: trip.tuyenXeId ? `${trip.tuyenXeId.diemDi} -> ${trip.tuyenXeId.diemDen}` : 'Unknown',
        time: trip.thoiGianKhoiHanh
      });
    }

    // 3. Find a free seat
    const seatList = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'];
    let selectedSeat = null;
    for (const seat of seatList) {
      if (!trip.gheDaDat.includes(seat)) {
        selectedSeat = seat;
        break;
      }
    }

    if (!selectedSeat) {
      selectedSeat = 'B01'; // Fallback
    }

    console.log(`Booking seat: ${selectedSeat}`);

    // Update the trip with the booked seat
    trip.gheDaDat.push(selectedSeat);
    await trip.save();
    console.log('Trip updated with seat!');

    // 4. Determine points
    const diemDon = (trip.tuyenXeId && trip.tuyenXeId.diemDon && trip.tuyenXeId.diemDon.length > 0) 
      ? { tenDiem: trip.tuyenXeId.diemDon[0].tenDiem, diaChi: trip.tuyenXeId.diemDon[0].diaChi }
      : { tenDiem: 'Bến Xe Miền Đông', diaChi: '292 Đinh Bộ Lĩnh, Bình Thạnh' };

    const diemTra = (trip.tuyenXeId && trip.tuyenXeId.diemTra && trip.tuyenXeId.diemTra.length > 0)
      ? { tenDiem: trip.tuyenXeId.diemTra[0].tenDiem, diaChi: trip.tuyenXeId.diemTra[0].diaChi }
      : { tenDiem: 'Bến Xe Đà Lạt', diaChi: '01 Tô Hiến Thành, Đà Lạt' };

    const rawGiaVe = trip.tuyenXeId ? trip.tuyenXeId.giaVe : '250000';
    const parsedPrice = parseInt(rawGiaVe.replace(/[^0-9]/g, ''), 10) || 250000;

    // 5. Create ticket
    const ticket = await Ve.create({
      khachHangId: user._id,
      chuyenXeId: trip._id,
      danhSachGhe: [selectedSeat],
      tongTien: parsedPrice,
      hoTen: user.hoTen,
      soDienThoai: user.soDienThoai,
      email: user.email,
      diemDon: diemDon,
      diemTra: diemTra,
      phuongThucThanhToan: 'tienmat',
      trangThai: 'paid', // Mark as paid so it's completed
      ngayDat: new Date()
    });

    console.log(`Ticket successfully created! Code: ${ticket.maVe}`);

    // 6. Create invoice
    const invoice = await HoaDon.create({
      veId: ticket._id,
      khachHangId: user._id,
      tongTien: ticket.tongTien,
      phuongThucThanhToan: ticket.phuongThucThanhToan,
      trangThai: 'completed'
    });

    console.log(`Invoice successfully created! ID: ${invoice._id}`);
    console.log('\nSUCCESS: Ticket created for Pham Huynh Minh Quan successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating ticket:', err);
    process.exit(1);
  }
}

createTicket();
