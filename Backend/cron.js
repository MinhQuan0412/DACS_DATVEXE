const cron = require('node-cron');
const Ve = require('./models/Ve');
const ChuyenXe = require('./models/ChuyenXe');

// Tự động chạy mỗi phút
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        
        // Tìm các vé đang ở trạng thái 'hold' và đã quá hạn
        const expiredBookings = await Ve.find({
            trangThai: 'hold',
            holdExpires: { $lt: now }
        });

        if (expiredBookings.length > 0) {
            console.log(`[CRON] Phát hiện ${expiredBookings.length} vé giữ chỗ đã hết hạn.`);

            for (const booking of expiredBookings) {
                // 1. Chuyển trạng thái sang 'expired'
                booking.trangThai = 'expired';
                await booking.save();

                // 2. Trả lại ghế cho chuyến xe
                await ChuyenXe.findByIdAndUpdate(booking.chuyenXeId, {
                    $pull: { gheDaDat: { $in: booking.danhSachGhe } }
                });

                console.log(`- Đã giải phóng ghế cho vé hết hạn: ${booking.maVe}`);
            }
        }

        // --- TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI VÉ THEO TIẾN ĐỘ CHUYẾN ĐI ---
        // 1. Tự động chuyển vé từ 'paid' -> 'confirmed' khi xe khởi hành
        const paidBookings = await Ve.find({
            trangThai: 'paid'
        }).populate('chuyenXeId');

        let autoConfirmCount = 0;
        for (const b of paidBookings) {
            if (b.chuyenXeId && new Date(b.chuyenXeId.thoiGianKhoiHanh) <= now) {
                b.trangThai = 'confirmed';
                b.ghiChu = (b.ghiChu || '') + ' [Hệ thống: Tự động chuyển sang Đã xác nhận khi đến giờ khởi hành]';
                await b.save();
                autoConfirmCount++;
            }
        }
        if (autoConfirmCount > 0) {
            console.log(`[CRON] Đã tự động xác nhận ${autoConfirmCount} vé sang trạng thái 'Đã xác nhận' khi xe khởi hành.`);
        }

        // 2. Tự động chuyển vé từ 'confirmed' -> 'completed' khi kết thúc chuyến đi
        const confirmedBookings = await Ve.find({
            trangThai: 'confirmed'
        }).populate('chuyenXeId');

        let autoCompleteCount = 0;
        for (const b of confirmedBookings) {
            if (b.chuyenXeId) {
                const arrivalTime = b.chuyenXeId.thoiGianDen
                    ? new Date(b.chuyenXeId.thoiGianDen)
                    : new Date(new Date(b.chuyenXeId.thoiGianKhoiHanh).getTime() + 6 * 60 * 60 * 1000); // Mặc định 6 tiếng

                if (arrivalTime <= now || b.chuyenXeId.trangThai === 'completed') {
                    b.trangThai = 'completed';
                    b.ghiChu = (b.ghiChu || '') + ' [Hệ thống: Tự động chuyển sang Hoàn thành khi kết thúc chuyến đi]';
                    await b.save();
                    autoCompleteCount++;
                }
            }
        }
        if (autoCompleteCount > 0) {
            console.log(`[CRON] Đã tự động chuyển ${autoCompleteCount} vé sang trạng thái 'Hoàn thành' khi kết thúc chuyến đi.`);
        }
    } catch (err) {
        console.error('[CRON ERROR]:', err);
    }
});

console.log('--- Hệ thống tự động quét vé hết hạn (Cron Job) đã khởi động ---');
