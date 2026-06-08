const mongoose = require('mongoose');
const Voucher = require('./models/Voucher');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking')
  .then(async () => {
    console.log('Connected to MongoDB to seed vouchers...');
    
    const vouchers = [
      {
        maVoucher: 'CHAOHÈ',
        moTa: 'Giảm giá cực sốc 20% cho mùa hè rực rỡ',
        loaiGiamGia: 'percentage',
        giaTriGiam: 20,
        giamToiDa: 50000,
        giaTriToiThieu: 100000,
        ngayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        soLuong: 100,
        daSuDung: 0,
        trangThai: 'active'
      },
      {
        maVoucher: 'BANMOI',
        moTa: 'Ưu đãi dành riêng cho khách hàng mới đặt vé lần đầu',
        loaiGiamGia: 'fixed',
        giaTriGiam: 30000,
        giaTriToiThieu: 50000,
        ngayHetHan: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        soLuong: 500,
        daSuDung: 0,
        trangThai: 'active'
      },
      {
        maVoucher: 'BLUEBUS50',
        moTa: 'Giảm thẳng 50.000đ khi đặt vé qua hệ thống BlueBus',
        loaiGiamGia: 'fixed',
        giaTriGiam: 50000,
        giaTriToiThieu: 200000,
        ngayHetHan: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        soLuong: 50,
        daSuDung: 0,
        trangThai: 'active'
      }
    ];

    await Voucher.deleteMany({});
    await Voucher.insertMany(vouchers);
    
    console.log('✅ Đã nạp thành công 3 mã giảm giá mẫu!');
    process.exit();
  })
  .catch(err => {
    console.error('Lỗi seed vouchers:', err);
    process.exit(1);
  });
