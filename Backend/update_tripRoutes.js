const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'tripRoutes.js');
let code = fs.readFileSync(filePath, 'utf8');

// The new combined handler
const newSearchCode = `// Logic chung cho tìm kiếm chuyến xe
const searchTrips = async (req, res) => {
  try {
    const {
      diemDi, diemDen, ngay,
      giaVeTu, giaVeDen,
      loaiXe,
      conGhe,
      page = 1,
      limit = 20,
      sort = '-thoiGianKhoiHanh'
    } = req.query;

    // 3. Không cho phép điểm đi trùng điểm đến
    if (diemDi && diemDen && diemDi.trim().toLowerCase() === diemDen.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Điểm đi và điểm đến không được trùng nhau' });
    }

    let query = { trangThai: 'active' };

    // 1. Lọc chuyến xe có giờ khởi hành > hiện tại
    const now = new Date();
    query.thoiGianKhoiHanh = { $gt: now };

    // 5. Lọc theo tuyến (chỉ lấy tuyến đang active)
    if (diemDi || diemDen) {
      const routeFilter = { trangThai: 'active' };
      if (diemDi) routeFilter.diemDi = { $regex: diemDi, $options: 'i' };
      if (diemDen) routeFilter.diemDen = { $regex: diemDen, $options: 'i' };
      const routes = await TuyenXe.find(routeFilter);
      const routeIds = routes.map(r => r._id);
      
      if (routeIds.length === 0) {
        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 }});
      }
      query.tuyenXeId = { $in: routeIds };
    }

    // 4. Xử lý múi giờ khi lọc theo ngày (Asia/Ho_Chi_Minh là UTC+7)
    if (ngay) {
      const dateParts = ngay.split('-');
      if (dateParts.length === 3) {
        // Tạo chuỗi ISO đại diện cho 00:00:00 giờ VN (+07:00)
        const startOfVNDay = new Date(\`\${ngay}T00:00:00+07:00\`);
        const endOfVNDay = new Date(\`\${ngay}T23:59:59.999+07:00\`);

        query.thoiGianKhoiHanh = { 
          $gte: now > startOfVNDay ? now : startOfVNDay, 
          $lte: endOfVNDay 
        };
      }
    }

    if (giaVeTu || giaVeDen) {
      query.giaVe = {};
      if (giaVeTu) query.giaVe.$gte = Number(giaVeTu);
      if (giaVeDen) query.giaVe.$lte = Number(giaVeDen);
    }

    // 7. Xử lý filter typo cho loại xe
    if (loaiXe) {
      // Nếu user tìm "giường", ta match cả "giường" và "gường" (do typo trong DB)
      let regexStr = loaiXe;
      if (loaiXe.toLowerCase().includes('giường')) {
        regexStr = regexStr.replace(/giường/ig, '(giường|gường)');
      }
      query.loaiXe = { $regex: regexStr, $options: 'i' };
    }

    // 2 & 6. Lọc số ghế trống trực tiếp bằng MongoDB để phân trang không bị sai
    if (conGhe === 'true' || conGhe === 'false') {
      const seatCond = {
        $lt: [
          { $size: { $ifNull: ["$gheDaDat", []] } },
          { $ifNull: ["$soGhe", 36] }
        ]
      };

      if (conGhe === 'true') {
        query.$expr = seatCond;
      } else {
        query.$expr = { $not: seatCond }; // Đã full
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let sortOption = {};
    if (sort.startsWith('-')) {
      sortOption[sort.substring(1)] = -1;
    } else {
      sortOption[sort] = 1;
    }

    const [trips, totalCount] = await Promise.all([
      ChuyenXe.find(query)
        .populate('tuyenXeId')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      ChuyenXe.countDocuments(query)
    ]);

    const data = trips.map(t => {
      const trip = t.toObject();
      const max = trip.soGhe || 36;
      trip.soGheTrong = max - (trip.gheDaDat || []).length;
      return trip;
    });

    res.json({
      data,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tìm kiếm chuyến xe', error: err.message });
  }
};

// @route   GET /api/trips
// @desc    Lấy danh sách chuyến xe + bộ lọc + phân trang + sắp xếp
router.get('/', searchTrips);

// @route   GET /api/trips/search
// @desc    Alias — dùng chung bộ lọc với GET /api/trips
router.get('/search', searchTrips);`;

// Find everything from line 6 to 191 (inclusive).
// A robust way is to just use a regular expression to match from '// @route   GET /api/trips' 
// down to the end of the search block before '// @route   GET /api/trips/:tripId/seats'

const regex = /\/\/ @route   GET \/api\/trips\n[\s\S]*?\/\/ @route   GET \/api\/trips\/search\n[\s\S]*?\}\);\n/g;
code = code.replace(regex, newSearchCode + "\n\n");

fs.writeFileSync(filePath, code);
console.log("Updated tripRoutes.js successfully!");
