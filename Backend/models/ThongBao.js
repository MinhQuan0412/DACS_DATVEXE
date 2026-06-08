const mongoose = require('mongoose');

const thongBaoSchema = new mongoose.Schema({
  tieuDe: { type: String, required: true },
  noiDung: { type: String, required: true },
  loai: { 
    type: String, 
    enum: ['trip_cancelled', 'new_booking', 'system', 'support', 'cancel'],
    default: 'system' 
  },
  sender: { type: String, default: 'System' },
  recipients: [{
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel' },
    recipientModel: { type: String, enum: ['KhachHang', 'NhanVien'] },
    isRead: { type: Boolean, default: false }
  }],
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID của chuyến xe, vé, hoặc support ticket liên quan
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Lưu thêm các thông tin như { link: '/admin/ho-tro' }
  isAdminOnly: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ThongBao', thongBaoSchema);
