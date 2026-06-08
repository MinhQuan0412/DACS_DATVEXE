const fs = require('fs');
const path = require('path');

// 1. Cập nhật Ve.js
const vePath = path.join(__dirname, 'models', 'Ve.js');
let veCode = fs.readFileSync(vePath, 'utf8');

if (!veCode.includes('crypto')) {
  veCode = "const crypto = require('crypto');\n" + veCode;
}

const veOldLogic = `    const count = await mongoose.model('Ve').countDocuments();
    this.maVe = \`VE-\${dateStr}-\${String(count + 1).padStart(3, '0')}\`;`;

const veNewLogic = `    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.maVe = \`VE-\${dateStr}-\${randomStr}\`;`;

veCode = veCode.replace(veOldLogic, veNewLogic);
fs.writeFileSync(vePath, veCode);


// 2. Cập nhật HoaDon.js
const hoaDonPath = path.join(__dirname, 'models', 'HoaDon.js');
let hoaDonCode = fs.readFileSync(hoaDonPath, 'utf8');

if (!hoaDonCode.includes('crypto')) {
  hoaDonCode = "const crypto = require('crypto');\n" + hoaDonCode;
}

const hoaDonOldLogic = `    const count = await mongoose.model('HoaDon').countDocuments();
    this.maHoaDon = \`HD-\${dateStr}-\${String(count + 1).padStart(3, '0')}\`;`;

const hoaDonNewLogic = `    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.maHoaDon = \`HD-\${dateStr}-\${randomStr}\`;`;

hoaDonCode = hoaDonCode.replace(hoaDonOldLogic, hoaDonNewLogic);
fs.writeFileSync(hoaDonPath, hoaDonCode);


// 3. Cập nhật bookingRoutes.js
const bookingPath = path.join(__dirname, 'routes', 'bookingRoutes.js');
let bookingCode = fs.readFileSync(bookingPath, 'utf8');

// A. /hold-seats validation
const holdSeatsOld = `    if (!chuyenXeId || !danhSachGhe || danhSachGhe.length === 0) {
      throw new Error('Vui lòng chọn chuyến xe và ghế');
    }`;

const holdSeatsNew = `    if (!chuyenXeId || !danhSachGhe || danhSachGhe.length === 0) {
      throw new Error('Vui lòng chọn chuyến xe và ghế');
    }
    
    // Validate số lượng và định dạng ghế
    if (danhSachGhe.length > 6) {
      throw new Error('Chỉ được đặt tối đa 6 ghế mỗi lần');
    }
    const validSeatRegex = /^(A|B)(0[1-9]|1[0-8])$/;
    const invalidSeats = danhSachGhe.filter(seat => !validSeatRegex.test(seat));
    if (invalidSeats.length > 0) {
      throw new Error(\`Ghế không hợp lệ: \${invalidSeats.join(', ')}\`);
    }`;

bookingCode = bookingCode.replace(holdSeatsOld, holdSeatsNew);

// B. POST / validation
const postBookOld = `    const {
      chuyenXeId, danhSachGhe,
      hoTen, soDienThoai, email,
      diemDon, diemTra          // có thể truyền string hoặc object
    } = req.body;
    if (!chuyenXeId || !danhSachGhe || danhSachGhe.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn chuyến xe và ghế' });
    }`;

const postBookNew = `    const {
      chuyenXeId, danhSachGhe,
      hoTen, soDienThoai, email,
      diemDon, diemTra          // có thể truyền string hoặc object
    } = req.body;

    // VALIDATION THÔNG TIN KHÁCH HÀNG
    if (soDienThoai && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(soDienThoai)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ (Phải là số ĐT Việt Nam)' });
    }
    if (email && !/^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: 'Email không đúng định dạng' });
    }
    if (hoTen && !/^[a-zA-Z\\sÀ-Ỹà-ỹ]+$/.test(hoTen)) {
      return res.status(400).json({ message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng (không chứa số hoặc ký tự đặc biệt)' });
    }

    if (!chuyenXeId || !danhSachGhe || danhSachGhe.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn chuyến xe và ghế' });
    }`;

bookingCode = bookingCode.replace(postBookOld, postBookNew);

fs.writeFileSync(bookingPath, bookingCode);

console.log('Update validation and security completed!');
