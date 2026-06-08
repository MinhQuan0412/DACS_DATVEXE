const mongoose = require('mongoose');
const Xe = require('./models/Xe');
const ChuyenXe = require('./models/ChuyenXe');

async function fixData() {
  await mongoose.connect('mongodb://localhost:27017/bus-booking');
  console.log('Connected to MongoDB');

  const trips = await ChuyenXe.find({});
  const xes = await Xe.find({});

  for (const trip of trips) {
    if (mongoose.Types.ObjectId.isValid(trip.xeId)) {
      const xe = xes.find(x => x._id.toString() === trip.xeId);
      if (xe) {
        trip.xeId = xe.bienSo;
        await trip.save();
        console.log(`Updated trip ${trip._id} to use bienSo ${xe.bienSo}`);
      }
    }
  }

  console.log('Done');
  process.exit(0);
}

fixData();
