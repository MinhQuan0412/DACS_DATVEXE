const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ChuyenXe = require('../models/ChuyenXe');
const Ve = require('../models/Ve');
const HoaDon = require('../models/HoaDon');
const TuyenXe = require('../models/TuyenXe');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking').then(async () => {
  console.log('Connected to MongoDB for cleanup');

  // 1. Tìm các TuyenXe ảo (chứa chữ 'Test')
  const testTuyen = await TuyenXe.find({
    $or: [
      { diemDi: { $regex: /test/i } },
      { diemDen: { $regex: /test/i } }
    ]
  });
  const testTuyenIds = testTuyen.map(t => t._id);
  console.log(`Tìm thấy ${testTuyen.length} tuyến xe ảo/test.`);

  // 2. Tìm các ChuyenXe thuộc tuyến xe ảo/test
  const testChuyen = await ChuyenXe.find({
    tuyenXeId: { $in: testTuyenIds }
  });
  const testChuyenIds = testChuyen.map(c => c._id);
  console.log(`Tìm thấy ${testChuyen.length} chuyến xe ảo/test.`);

  // 3. Xóa Vé và Hóa đơn liên quan đến các chuyến xe ảo
  const deletedVe = await Ve.deleteMany({
    chuyenXeId: { $in: testChuyenIds }
  });
  console.log(`Đã xóa ${deletedVe.deletedCount} vé liên quan đến chuyến xe ảo.`);

  const deletedHoaDon = await HoaDon.deleteMany({
    veId: { $in: testChuyenIds } // Hoặc tìm theo veId khớp với vé đã xóa
  });
  console.log(`Đã xóa hóa đơn liên quan.`);

  // 4. Thực hiện xóa các chuyến xe ảo và tuyến xe ảo
  const deletedChuyen = await ChuyenXe.deleteMany({
    _id: { $in: testChuyenIds }
  });
  console.log(`Đã xóa ${deletedChuyen.deletedCount} chuyến xe ảo.`);

  const deletedTuyen = await TuyenXe.deleteMany({
    _id: { $in: testTuyenIds }
  });
  console.log(`Đã xóa ${deletedTuyen.deletedCount} tuyến xe ảo.`);

  console.log('Dọn dẹp hoàn tất!');
  mongoose.disconnect();
}).catch(err => console.error('Lỗi khi dọn dẹp:', err));
