const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ChuyenXe = require('../models/ChuyenXe');
const Ve = require('../models/Ve');
const HoaDon = require('../models/HoaDon');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bus-booking').then(async () => {
  console.log('Connected to MongoDB to clean duplicates');

  // Group ChuyenXe by tuyenXeId and thoiGianKhoiHanh
  const duplicates = await ChuyenXe.aggregate([
    {
      $group: {
        _id: { tuyenXeId: "$tuyenXeId", thoiGianKhoiHanh: "$thoiGianKhoiHanh" },
        count: { $sum: 1 },
        docs: { $push: { id: "$_id", gheDaDat: "$gheDaDat" } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  console.log(`Tìm thấy ${duplicates.length} nhóm chuyến xe bị trùng tuyến và cùng giờ khởi hành.`);

  let totalDeleted = 0;

  for (const group of duplicates) {
    const docs = group.docs;
    console.log(`\nNhóm trùng: Tuyến ${group._id.tuyenXeId}, Giờ: ${group._id.thoiGianKhoiHanh}`);

    // Xác định xem chuyến xe nào có vé (hoặc có ghế đã đặt)
    let bestDocId = null;
    let maxBookedSeats = -1;

    for (const doc of docs) {
      const hasTickets = await Ve.exists({ chuyenXeId: doc.id });
      const score = (hasTickets ? 10 : 0) + (doc.gheDaDat ? doc.gheDaDat.length : 0);
      if (score > maxBookedSeats) {
        maxBookedSeats = score;
        bestDocId = doc.id;
      }
    }

    // Nếu không tìm được cái nào nổi trội, mặc định giữ cái đầu tiên
    if (!bestDocId) {
      bestDocId = docs[0].id;
    }

    console.log(`-> Giữ lại chuyến xe ID: ${bestDocId} (Độ ưu tiên/Số ghế đã đặt cao nhất)`);

    // Xóa tất cả các chuyến còn lại trong nhóm
    for (const doc of docs) {
      if (doc.id.toString() !== bestDocId.toString()) {
        // Trước khi xóa, đảm bảo xóa/chuyển các vé liên quan (nếu lỡ có vé ở chuyến bị xóa)
        const ticketsToMigrate = await Ve.find({ chuyenXeId: doc.id });
        if (ticketsToMigrate.length > 0) {
          console.log(`   * Di chuyển ${ticketsToMigrate.length} vé từ chuyến bị xóa sang chuyến được giữ lại`);
          for (const t of ticketsToMigrate) {
            t.chuyenXeId = bestDocId;
            await t.save();
          }
          // Đồng bộ lại gheDaDat của chuyến được giữ lại
          const targetTrip = await ChuyenXe.findById(bestDocId);
          const allSeats = ticketsToMigrate.flatMap(t => t.danhSachGhe);
          targetTrip.gheDaDat = [...new Set([...targetTrip.gheDaDat, ...allSeats])];
          await targetTrip.save();
        }

        await ChuyenXe.findByIdAndDelete(doc.id);
        totalDeleted++;
        console.log(`   * Đã xóa chuyến xe trùng: ${doc.id}`);
      }
    }
  }

  console.log(`\nĐã xóa tổng cộng ${totalDeleted} chuyến xe trùng lặp.`);
  mongoose.disconnect();
}).catch(err => console.error('Lỗi khi dọn dẹp trùng lặp:', err));
