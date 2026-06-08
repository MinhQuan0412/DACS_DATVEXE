import React from 'react';
import './Footer.css';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h3>Về BlueBus</h3>
          <p>Hệ thống đặt vé xe trực tuyến hàng đầu, mang đến trải nghiệm du lịch an toàn, tiện lợi và nhanh chóng nhất cho mọi hành khách trên toàn quốc.</p>
        </div>
        
        <div className="footer-col">
          <h3>Liên Kết</h3>
          <ul>
            <li><a href="#">Lịch trình</a></li>
            <li><a href="#">Tra cứu vé</a></li>
            <li><a href="#">Tuyển dụng</a></li>
            <li><a href="#">Quy định chung</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h3>Liên Hệ</h3>
          <ul className="contact-info">
            <li><FaEnvelope className="icon" /> Email: hotro@bluebus.vn</li>
            <li><FaEnvelope className="icon" /> hotro@bluebus.vn</li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Tải Ứng Dụng</h3>
          <p>Đặt vé dễ dàng hơn qua ứng dụng BlueBus trên điện thoại.</p>
          <div className="social-icons">
            <a href="#" className="social-link"><FaFacebook /></a>
            <a href="#" className="social-link"><FaYoutube /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
