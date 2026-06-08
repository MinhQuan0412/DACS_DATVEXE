import React, { useState, useEffect } from 'react';
import './LienHe.css';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaClock } from 'react-icons/fa';
import { authStorage } from '../../utils/authStorage';
import authApi from '../../api/authApi';
import axiosClient from '../../api/axiosClient';
import Swal from 'sweetalert2';

const LienHe = () => {
  const [formData, setFormData] = useState({
    hoTen: '',
    soDienThoai: '',
    email: '',
    tieuDe: '',
    maVe: '',
    noiDung: ''
  });

  useEffect(() => {
    const user = authStorage.getUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        hoTen: user.hoTen || '',
        soDienThoai: user.soDienThoai || '',
        email: user.email || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Thử gửi qua cổng mở cho khách vãng lai
      await authApi.sendSupportRequest(formData);
      
      Swal.fire({
        title: 'Thành công!',
        text: 'Yêu cầu hỗ trợ về "' + formData.tieuDe + '" đã được gửi đến bộ phận CSKH.',
        icon: 'success',
        confirmButtonText: 'Đóng'
      });
      
      setFormData(prev => ({ ...prev, tieuDe: '', maVe: '', noiDung: '' }));
    } catch (err) {
      console.warn('Gửi qua cổng vãng lai thất bại, thử gửi qua cổng định danh...', err);
      
      try {
        // 2. Thử gửi qua cổng cũ (có thể BE chưa mở cổng mới hoàn toàn)
        await axiosClient.post('/api/auth/support-requests', formData);
        
        Swal.fire({
          title: 'Thành công!',
          text: 'Yêu cầu đã được gửi qua cổng định danh.',
          icon: 'success',
          confirmButtonText: 'Đóng'
        });
        setFormData(prev => ({ ...prev, tieuDe: '', maVe: '', noiDung: '' }));
      } catch (err2) {
        console.error('Cả hai cổng đều thất bại:', err2);
        Swal.fire({
          title: 'Thất bại',
          text: `Chi tiết: ${err2.message || (typeof err2 === 'string' ? err2 : 'Lỗi máy chủ')}`,
          icon: 'error'
        });
      }
    }
  };

  return (
    <div className="contact-page fade-in">
      <div className="contact-banner">
        <div className="container">
          <h1>Liên Hệ Với Chúng Tôi</h1>
          <p>BlueBus luôn sẵn sàng lắng nghe và hỗ trợ hành khách 24/7</p>
        </div>
      </div>

      <div className="container contact-content">
        <div className="contact-grid">
          
          <div className="contact-info-card">
            <h2>Thông Tin Hệ Thống</h2>
            <p className="contact-desc">Mọi thắc mắc về việc đặt vé, thay đổi lịch trình hoặc khiếu nại, vui lòng liên hệ trực tiếp với chúng tôi qua các kênh sau:</p>
            
            <div className="info-list">
              <div className="info-item">
                <div className="icon-wrapper"><FaPhoneAlt /></div>
                <div>
                  <h4>Tổng đài đặt vé (1000đ/phút)</h4>
                  <p><strong>1900 1234</strong></p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="icon-wrapper"><FaEnvelope /></div>
                <div>
                  <h4>Email Hỗ Trợ</h4>
                  <p>hotro@bluebus.vn</p>
                </div>
              </div>

              <div className="info-item">
                <div className="icon-wrapper"><FaClock /></div>
                <div>
                  <h4>Giờ làm việc</h4>
                  <p>24/7 (Cả dịp Lễ, Tết)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-card">
            <h2>Gửi Tin Nhắn</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group-contact">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  name="hoTen"
                  placeholder="Nhập tên của bạn" 
                  value={formData.hoTen}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group-contact">
                  <label>Số điện thoại</label>
                  <input 
                    type="tel" 
                    name="soDienThoai"
                    placeholder="Ví dụ: 0912345678" 
                    value={formData.soDienThoai}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="form-group-contact">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Ví dụ: phamquann@gmail.com" 
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group-contact">
                <label>Tiêu đề cần hỗ trợ</label>
                <input 
                  type="text" 
                  name="tieuDe"
                  placeholder="VD: Khiếu nại dịch vụ, Hoàn tiền vé..." 
                  value={formData.tieuDe}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="form-group-contact">
                <label>Mã vé (Nếu có)</label>
                <input 
                  type="text" 
                  name="maVe"
                  placeholder="VD: VE-1712345678" 
                  value={formData.maVe}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-contact">
                <label>Nội dung chi tiết</label>
                <textarea 
                  name="noiDung"
                  rows="5" 
                  placeholder="Bạn cần BlueBus hỗ trợ vấn đề gì?" 
                  value={formData.noiDung}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-submit-contact">
                Gửi Yêu Cầu <FaPaperPlane />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LienHe;
