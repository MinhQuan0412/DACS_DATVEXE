const mongoose = require('mongoose');
const NhanVien = require('./models/NhanVien');
const KhachHang = require('./models/KhachHang');

const checkAndFix = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/bus-booking');
    
    const staff = await NhanVien.find({}, 'soDienThoai hoTen');
    const staffPhones = staff.map(s => s.soDienThoai);
    
    const overlaps = await KhachHang.find({ soDienThoai: { $in: staffPhones } });
    
    if (overlaps.length > 0) {
      console.log(`Found ${overlaps.length} overlaps. Fixing...`);
      for (const customer of overlaps) {
        const newPhone = '000' + customer.soDienThoai.substring(3);
        console.log(`Changing Customer ${customer.hoTen}: ${customer.soDienThoai} -> ${newPhone}`);
        customer.soDienThoai = newPhone;
        await customer.save();
      }
    } else {
      console.log('No overlaps found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAndFix();
