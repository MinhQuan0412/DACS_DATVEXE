const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const collections = ['xes', 'ves', 'tuyenxes', 'hoadons', 'chuyenxes'];
    
    for (const colName of collections) {
        await mongoose.connection.db.collection(colName).deleteMany({});
        console.log(`✅ Cleared all data from collection: ${colName}`);
    }

    console.log('All requested data has been wiped successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during clearing data:', err);
    process.exit(1);
  }
};

clearData();
