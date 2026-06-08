const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
require('dotenv').config();

const seedSupport = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const tickets = [
      {
        hoTen: 'Nguyễn Văn A',
        soDienThoai: '0901234567',
        email: 'nguyenvana@gmail.com',
        tieuDe: 'Không thể thanh toán qua MoMo',
        noiDung: 'Tôi đã chọn ghế và bấm thanh toán qua MoMo nhưng bị lỗi liên tục, vui lòng hỗ trợ.',
        trangThai: 'open'
      },
      {
        hoTen: 'Trần Thị B',
        soDienThoai: '0912345678',
        email: 'tranthib@gmail.com',
        tieuDe: 'Yêu cầu đổi điểm đón',
        noiDung: 'Tôi đã đặt vé chuyến Sài Gòn - An Giang ngày 10/05, muốn đổi điểm đón từ Bến xe Miền Tây sang điểm đón Quận 7.',
        trangThai: 'in_progress',
        phanHoi: 'Chúng tôi đã tiếp nhận yêu cầu, vui lòng chờ xác nhận.'
      },
      {
        hoTen: 'Lê Văn C',
        soDienThoai: '0923456789',
        tieuDe: 'Hủy vé và hoàn tiền',
        noiDung: 'Tôi muốn hủy vé mã VE20260508001 và yêu cầu hoàn tiền vào tài khoản ngân hàng.',
        trangThai: 'resolved',
        phanHoi: 'Vé đã được hủy thành công. Tiền sẽ được hoàn trong 3-5 ngày làm việc.'
      }
    ];

    await SupportTicket.deleteMany({});
    await SupportTicket.insertMany(tickets);

    console.log('✅ Đã tạo 3 yêu cầu hỗ trợ test thành công');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi:', err);
    process.exit(1);
  }
};

seedSupport();
