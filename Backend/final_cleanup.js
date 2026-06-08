const mongoose = require('mongoose');
const Xe = require('./models/Xe');
const ChuyenXe = require('./models/ChuyenXe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const cleanupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Dọn dẹp Xe Collection
    console.log('Cleaning up Xe collection...');
    const vehicles = await mongoose.connection.db.collection('xes').find({}).toArray();
    for (const xe of vehicles) {
        const update = { $unset: { soGhe: "", tuyenXeId: "" } };
        // Nếu tongSoGhe chưa có mà soGhe có, thì copy sang
        if (!xe.tongSoGhe && xe.soGhe) {
            update.$set = { tongSoGhe: xe.soGhe };
        } else if (!xe.tongSoGhe) {
            update.$set = { tongSoGhe: 34 }; // Mặc định nếu mất cả 2
        }
        
        await mongoose.connection.db.collection('xes').updateOne(
            { _id: xe._id },
            update
        );
    }
    console.log('✅ Xe collection cleaned.');

    // 2. Dọn dẹp ChuyenXe Collection (Đổi soGhe thành tongSoGhe)
    console.log('Cleaning up ChuyenXe collection...');
    const trips = await mongoose.connection.db.collection('chuyenxes').find({}).toArray();
    for (const trip of trips) {
        const update = { $unset: { soGhe: "" } };
        if (!trip.tongSoGhe && trip.soGhe) {
            update.$set = { tongSoGhe: trip.soGhe };
        } else if (!trip.tongSoGhe) {
            update.$set = { tongSoGhe: 34 };
        }

        await mongoose.connection.db.collection('chuyenxes').updateOne(
            { _id: trip._id },
            update
        );
    }
    console.log('✅ ChuyenXe collection cleaned.');

    console.log('Database cleanup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

cleanupDatabase();
