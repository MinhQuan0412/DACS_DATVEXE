const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'bookingRoutes.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Transaction cho /hold-seats
const holdSeatsOld = `router.post('/hold-seats', authMiddleware, async (req, res) => {
  try {
    const { chuyenXeId, danhSachGhe } = req.body;

    if (!chuyenXeId || !danhSachGhe || danhSachGhe.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn chuyến xe và ghế' });
    }
    // Check ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(chuyenXeId)) {
      return res.status(400).json({ message: 'ID chuyến xe không hợp lệ' });
    }

    const trip = await ChuyenXe.findById(chuyenXeId);
    if (!trip) return res.status(404).json({ message: 'Không tìm thấy chuyến xe' });

    // Không cho đặt vé chuyến đã khởi hành
    if (trip.trangThai !== 'active') {
      return res.status(400).json({ message: 'Chuyến xe không còn hoạt động' });
    }
    if (new Date(trip.thoiGianKhoiHanh) < new Date()) {
      return res.status(400).json({ message: 'Không thể đặt vé chuyến đã khởi hành' });
    }

    // Dọn ghế hold đã hết hạn
    const expiredHolds = await Ve.find({
      chuyenXeId,
      trangThai: 'hold',
      holdExpires: { $lt: new Date() }
    });
    for (const hold of expiredHolds) {
      trip.gheDaDat = trip.gheDaDat.filter(seat => !hold.danhSachGhe.includes(seat));
      hold.trangThai = 'cancelled';
      await hold.save();
    }
    await trip.save();

    // Kiểm tra ghế đã bị đặt chưa
    const alreadyTaken = danhSachGhe.filter(seat => trip.gheDaDat.includes(seat));
    if (alreadyTaken.length > 0) {
      return res.status(400).json({ message: \`Các ghế \${alreadyTaken.join(', ')} đã có người đặt\` });
    }
    // Không cho đặt quá số ghế xe
    const totalBooked = trip.gheDaDat.length + danhSachGhe.length;
    const maxSeats = trip.soGhe || 36;
    if (totalBooked > maxSeats) {
      return res.status(400).json({ message: \`Chuyến xe chỉ còn \${maxSeats - trip.gheDaDat.length} ghế trống\` });
    }

    const tongTien = trip.giaVe * danhSachGhe.length;
    const holdExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const booking = new Ve({
      khachHangId: req.user._id,
      chuyenXeId,
      danhSachGhe,
      tongTien,
      trangThai: 'hold',
      holdExpires
    });
    await booking.save();

    // Đánh dấu ghế đã giữ
    trip.gheDaDat.push(...danhSachGhe);
    await trip.save();

    res.status(201).json({
      message: 'Đã giữ ghế thành công, vui lòng thanh toán trong 15 phút',
      booking,
      holdExpires
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi giữ ghế', error: err.message });
  }
});`;

const holdSeatsNew = `router.post('/hold-seats', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { chuyenXeId, danhSachGhe } = req.body;

    if (!chuyenXeId || !danhSachGhe || danhSachGhe.length === 0) {
      throw new Error('Vui lòng chọn chuyến xe và ghế');
    }
    if (!mongoose.Types.ObjectId.isValid(chuyenXeId)) {
      throw new Error('ID chuyến xe không hợp lệ');
    }

    const trip = await ChuyenXe.findById(chuyenXeId).session(session);
    if (!trip) throw new Error('Không tìm thấy chuyến xe');

    if (trip.trangThai !== 'active') throw new Error('Chuyến xe không còn hoạt động');
    if (new Date(trip.thoiGianKhoiHanh) < new Date()) throw new Error('Không thể đặt vé chuyến đã khởi hành');

    // Kiểm tra ghế đã bị đặt chưa bằng cách check trực tiếp trong DB (atomic)
    // Hoặc do ta đang trong transaction nên đọc xong check là an toàn
    const alreadyTaken = danhSachGhe.filter(seat => trip.gheDaDat.includes(seat));
    if (alreadyTaken.length > 0) {
      throw new Error(\`Các ghế \${alreadyTaken.join(', ')} đã có người đặt\`);
    }

    const totalBooked = trip.gheDaDat.length + danhSachGhe.length;
    const maxSeats = trip.soGhe || 36;
    if (totalBooked > maxSeats) {
      throw new Error(\`Chuyến xe chỉ còn \${maxSeats - trip.gheDaDat.length} ghế trống\`);
    }

    const tongTien = trip.giaVe * danhSachGhe.length;
    const holdExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const booking = new Ve({
      khachHangId: req.user._id,
      chuyenXeId,
      danhSachGhe,
      tongTien,
      trangThai: 'hold',
      holdExpires
    });
    await booking.save({ session });

    trip.gheDaDat.push(...danhSachGhe);
    await trip.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Đã giữ ghế thành công, vui lòng tiếp tục đặt vé trong 15 phút',
      booking,
      holdExpires
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || 'Lỗi giữ ghế' });
  }
});`;

code = code.replace(holdSeatsOld, holdSeatsNew);

// 2. Chặn đặt vé trực tiếp nếu không có hold (State Machine + Price Validation)
// Trong BƯỚC 2:
const postBookOld = `    const existingHold = await Ve.findOne({
      khachHangId: req.user._id,
      chuyenXeId,
      trangThai: 'hold',
      holdExpires: { $gt: new Date() } // còn hạn
    });

    if (existingHold) {
      // Kiểm tra ghế trong hold có khớp không
      const holdSeats = existingHold.danhSachGhe;
      const sameSeat = danhSachGhe.every(s => holdSeats.includes(s)) && danhSachGhe.length === holdSeats.length;

      if (sameSeat) {
        // Upgrade hold → pending + cập nhật thêm thông tin
        existingHold.trangThai = 'pending';
        existingHold.holdExpires = undefined;
        if (hoTen) existingHold.hoTen = hoTen;
        if (soDienThoai) existingHold.soDienThoai = soDienThoai;
        if (email) existingHold.email = email;
        if (diemDon) existingHold.diemDon = typeof diemDon === 'string' ? { tenDiem: diemDon } : diemDon;
        if (diemTra) existingHold.diemTra = typeof diemTra === 'string' ? { tenDiem: diemTra } : diemTra;
        await existingHold.save();

        return res.status(201).json({
          message: 'Đã chuyển đặt giữ chỗ thành đơn đặt vé',
          bookingId: existingHold._id,
          maVe: existingHold.maVe,
          tongTien: existingHold.tongTien,
          soLuongVe: existingHold.danhSachGhe.length,
          danhSachGhe: existingHold.danhSachGhe,
          soGhe: existingHold.danhSachGhe.length,
          diemDon: existingHold.diemDon,
          diemTra: existingHold.diemTra,
          trangThai: existingHold.trangThai
        });
      }
    }

    // Ghế bị đặt bởi người KHÁC (loại trừ hold của chính user này)
    const myHoldSeats = existingHold ? existingHold.danhSachGhe : [];
    const alreadyTaken = danhSachGhe.filter(seat =>
      trip.gheDaDat.includes(seat) && !myHoldSeats.includes(seat)
    );
    if (alreadyTaken.length > 0) {
      return res.status(400).json({ message: \`Các ghế \${alreadyTaken.join(', ')} đã có người đặt\` });
    }

    const maxSeats = trip.soGhe || 36;
    const otherBookedSeats = trip.gheDaDat.filter(s => !myHoldSeats.includes(s));
    if (otherBookedSeats.length + danhSachGhe.length > maxSeats) {
      return res.status(400).json({ message: \`Chuyến xe chỉ còn \${maxSeats - otherBookedSeats.length} ghế trống\` });
    }

    const tongTien = trip.giaVe * danhSachGhe.length;

    // Parse diemDon/diemTra: hỗ trợ string hoặc object
    const parsedDiemDon = diemDon
      ? (typeof diemDon === 'string' ? { tenDiem: diemDon } : diemDon)
      : undefined;
    const parsedDiemTra = diemTra
      ? (typeof diemTra === 'string' ? { tenDiem: diemTra } : diemTra)
      : undefined;

    const booking = new Ve({
      khachHangId: req.user._id,
      chuyenXeId,
      danhSachGhe,
      tongTien,
      hoTen: hoTen || req.user.hoTen,
      soDienThoai: soDienThoai || req.user.soDienThoai,
      ...(parsedDiemDon && { diemDon: parsedDiemDon }),
      ...(parsedDiemTra && { diemTra: parsedDiemTra }),
      trangThai: 'pending'
    });

    await booking.save();
    trip.gheDaDat.push(...danhSachGhe);
    await trip.save();

    res.status(201).json({
      message: 'Tạo đơn đặt vé thành công',
      bookingId: booking._id,
      maVe: booking.maVe,
      tongTien: booking.tongTien,
      soLuongVe: booking.danhSachGhe.length,
      danhSachGhe: booking.danhSachGhe,
      soGhe: booking.danhSachGhe.length,
      diemDon: booking.diemDon,
      diemTra: booking.diemTra,
      trangThai: booking.trangThai
    });`;

const postBookNew = `    const existingHold = await Ve.findOne({
      khachHangId: req.user._id,
      chuyenXeId,
      trangThai: 'hold',
      holdExpires: { $gt: new Date() } // còn hạn
    });

    if (!existingHold) {
      return res.status(400).json({ message: 'Vui lòng chọn ghế và giữ chỗ trước khi đặt vé. Trạng thái hold không tồn tại hoặc đã hết hạn.' });
    }

    // Kiểm tra ghế trong hold có khớp không
    const holdSeats = existingHold.danhSachGhe;
    const sameSeat = danhSachGhe.every(s => holdSeats.includes(s)) && danhSachGhe.length === holdSeats.length;

    if (!sameSeat) {
      return res.status(400).json({ message: 'Danh sách ghế không khớp với dữ liệu đã giữ chỗ' });
    }

    // Upgrade hold → pending + cập nhật thêm thông tin
    existingHold.trangThai = 'pending';
    // BE TỰ TÍNH TỔNG TIỀN THEO DB (Price Validation)
    existingHold.tongTien = trip.giaVe * danhSachGhe.length;
    // Cho phép giữ thêm 15 phút để thanh toán
    existingHold.holdExpires = new Date(Date.now() + 15 * 60 * 1000); 

    if (hoTen) existingHold.hoTen = hoTen;
    if (soDienThoai) existingHold.soDienThoai = soDienThoai;
    if (email) existingHold.email = email;
    if (diemDon) existingHold.diemDon = typeof diemDon === 'string' ? { tenDiem: diemDon } : diemDon;
    if (diemTra) existingHold.diemTra = typeof diemTra === 'string' ? { tenDiem: diemTra } : diemTra;
    await existingHold.save();

    return res.status(201).json({
      message: 'Đã chuyển đặt giữ chỗ thành đơn đặt vé',
      bookingId: existingHold._id,
      maVe: existingHold.maVe,
      tongTien: existingHold.tongTien,
      soLuongVe: existingHold.danhSachGhe.length,
      danhSachGhe: existingHold.danhSachGhe,
      soGhe: existingHold.danhSachGhe.length,
      diemDon: existingHold.diemDon,
      diemTra: existingHold.diemTra,
      trangThai: existingHold.trangThai
    });`;

code = code.replace(postBookOld, postBookNew);

// 3. Khớp dữ liệu Stops ở PUT /pickup-dropoff
const putStopsOld = `    // Hỗ trợ cả string lẫn object
    // String: "Bến xe Miền Tây" → lưu vào tenDiem
    // Object: { tenDiem, diaChi, thoiGian }
    if (diemDon) {
      booking.diemDon = typeof diemDon === 'string'
        ? { tenDiem: diemDon }
        : diemDon;
    }
    if (diemTra) {
      booking.diemTra = typeof diemTra === 'string'
        ? { tenDiem: diemTra }
        : diemTra;
    }
    await booking.save();`;

const putStopsNew = `    const trip = await ChuyenXe.findById(booking.chuyenXeId).populate('tuyenXeId');
    const stopsDon = trip.diemDon?.length ? trip.diemDon : (trip.tuyenXeId?.diemDon || []);
    const stopsTra = trip.diemTra?.length ? trip.diemTra : (trip.tuyenXeId?.diemTra || []);

    if (diemDon && stopsDon.length > 0) {
      const tenDon = typeof diemDon === 'string' ? diemDon : diemDon.tenDiem;
      const valid = stopsDon.some(s => s.tenDiem?.toLowerCase() === tenDon?.toLowerCase());
      if (!valid) {
        return res.status(400).json({
          message: \`Điểm đón "\${tenDon}" không hợp lệ\`,
          diemDonHopLe: stopsDon.map(s => s.tenDiem)
        });
      }
      booking.diemDon = typeof diemDon === 'string' ? { tenDiem: diemDon } : diemDon;
    }

    if (diemTra && stopsTra.length > 0) {
      const tenTra = typeof diemTra === 'string' ? diemTra : diemTra.tenDiem;
      const valid = stopsTra.some(s => s.tenDiem?.toLowerCase() === tenTra?.toLowerCase());
      if (!valid) {
        return res.status(400).json({
          message: \`Điểm trả "\${tenTra}" không hợp lệ\`,
          diemTraHopLe: stopsTra.map(s => s.tenDiem)
        });
      }
      booking.diemTra = typeof diemTra === 'string' ? { tenDiem: diemTra } : diemTra;
    }
    await booking.save();`;

code = code.replace(putStopsOld, putStopsNew);

// 4. Update POST /pay: Bỏ qua soTien (Price Validation) & Requires 'pending'
const postPayOld = `    if (!['hold', 'pending'].includes(booking.trangThai)) {
      return res.status(400).json({ message: 'Vé đã thanh toán hoặc đã hủy' });
    }
    if (booking.trangThai === 'hold' && booking.holdExpires < new Date()) {
      booking.trangThai = 'cancelled';
      await booking.save();
      return res.status(400).json({ message: 'Thời gian giữ ghế đã hết hạn, vui lòng đặt lại' });
    }

    const validMethods = ['momo', 'zalopay', 'vnpay', 'tienmat'];
    if (!phuongThucThanhToan || !validMethods.includes(phuongThucThanhToan)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ', validMethods });
    }

    // Kiểm tra số tiền khớp
    if (soTien !== undefined && soTien !== booking.tongTien) {
      return res.status(400).json({
        message: \`Số tiền không khớp. Cần thanh toán: \${booking.tongTien}đ\`
      });
    }`;

const postPayNew = `    if (booking.trangThai !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể thanh toán vé ở trạng thái pending' });
    }
    if (booking.holdExpires && booking.holdExpires < new Date()) {
      booking.trangThai = 'cancelled';
      await booking.save();
      return res.status(400).json({ message: 'Thời gian giữ ghế đã hết hạn, vui lòng đặt lại' });
    }

    const validMethods = ['momo', 'zalopay', 'vnpay', 'tienmat'];
    if (!phuongThucThanhToan || !validMethods.includes(phuongThucThanhToan)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ', validMethods });
    }

    // BE Tự tính lại, hoàn toàn không tin soTien client truyền lên
    // booking.tongTien đã được chốt ở bước /book (pending)
    const actualPrice = booking.tongTien;`;

code = code.replace(postPayOld, postPayNew);

// Add payment-intent before cancel
const cancelRegex = /\/\/ @route   POST \/api\/bookings\/:bookingId\/cancel/;
const paymentIntentCode = `// ============================================================
// @route   POST /api/bookings/:bookingId/payment-intent
// @desc    Gia hạn thêm 10 phút khi khách bắt đầu bấm thanh toán
// ============================================================
router.post('/:bookingId/payment-intent', authMiddleware, async (req, res) => {
  try {
    const booking = await findBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy vé' });

    if (booking.khachHangId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện trên vé này' });
    }
    if (booking.trangThai !== 'pending') {
      return res.status(400).json({ message: 'Vé không ở trạng thái pending' });
    }

    // Gia hạn thêm 10 phút từ hiện tại
    booking.holdExpires = new Date(Date.now() + 10 * 60 * 1000);
    await booking.save();

    res.json({
      message: 'Đã gia hạn thời gian thanh toán thêm 10 phút',
      holdExpires: booking.holdExpires
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo payment intent', error: err.message });
  }
});

// ============================================================
// @route   POST /api/bookings/:bookingId/cancel`;

code = code.replace(cancelRegex, paymentIntentCode);

fs.writeFileSync(filePath, code);
console.log("Updated bookingRoutes.js successfully!");
