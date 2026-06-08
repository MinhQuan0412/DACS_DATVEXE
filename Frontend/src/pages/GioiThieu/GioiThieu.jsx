import React from 'react';
import { FaBullseye, FaHeart, FaLightbulb } from 'react-icons/fa';
import './GioiThieu.css';

const GioiThieu = () => {
  return (
    <div className="about-page fade-in">
      <div className="about-hero-section">
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content container" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#0060C4', fontSize: '32px', textTransform: 'uppercase', marginBottom: '10px' }}>BLUE BUS</h1>
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>"Chất lượng là danh dự"</h2>
        </div>
      </div>

      <div className="container about-main-content">
        <div className="about-text-intro" style={{ marginBottom: '40px', textAlign: 'justify', lineHeight: '1.8', fontSize: '15px' }}>
          <p>Công ty Cổ phần Xe khách Blue Bus được thành lập năm 2026. Với hoạt động kinh doanh chính trong lĩnh vực vận tải hành khách và kinh doanh dịch vụ, Blue Bus đang dần trở thành cái tên quen thuộc đồng hành cùng người Việt trên mọi nẻo đường.</p>
          <p style={{ marginTop: '15px' }}>Trải qua quá trình hình thành và phát triển đặt khách hàng là trọng tâm, chúng tôi tự hào trở thành doanh nghiệp vận tải đóng góp tích cực vào sự phát triển chung của ngành vận tải nói riêng và nền kinh tế đất nước nói chung. Luôn cải tiến mang đến chất lượng dịch vụ tối ưu nhất dành cho khách hàng.</p>
        </div>

        {/* Section 1: Tầm nhìn sứ mệnh */}
        <div className="about-section-row">
          <div className="about-col-img">
            <div className="about-card-illustration theme-orange">
              <FaBullseye className="about-card-icon" />
              <h4>TẦM NHÌN TƯƠNG LAI</h4>
            </div>
          </div>
          <div className="about-col-text">
            <h3 className="section-heading">TẦM NHÌN VÀ SỨ MỆNH</h3>
            <h4 style={{ color: '#0060C4', marginBottom: '10px', fontSize: '16px' }}>AN TOÀN - CHUYÊN NGHIỆP - TẬN TÂM.</h4>
            <p style={{ marginBottom: '15px' }}>Trở thành hãng xe khách uy tín và chất lượng hàng đầu Việt Nam với cam kết:</p>
            <ul className="about-bullet-list">
              <li>Tạo môi trường chuyên nghiệp, an toàn mọi nẻo đường.</li>
              <li>Phát triển từ lòng tin và trải nghiệm của khách hàng.</li>
              <li>Dẫn đầu trong dịch vụ xe khách công nghệ.</li>
            </ul>
            <p style={{ color: '#0060C4', marginTop: '15px', fontStyle: 'italic' }}>Blue Bus luôn phấn đấu làm việc hiệu quả nhất, mang lại giá trị thiết thực.</p>
          </div>
        </div>

        {/* Section 2: Giá trị cốt lõi */}
        <div className="about-section-row reverse">
          <div className="about-col-text">
            <h3 className="section-heading">GIÁ TRỊ CỐT LÕI</h3>
            <p style={{ fontSize: '14px', marginBottom: '15px' }}>Giá trị cốt lõi - <span style={{ color: '#0060C4' }}>Blue Bus</span></p>
            <ul className="about-bullet-list red-bullets">
              <li><strong style={{ color: '#0060C4' }}>Blue:</strong> chữ "Blue" tượng trưng cho sự tin cậy, bình yên và tính bền vững. Thể hiện sự vững chắc, độ tin cậy được khách hàng gửi gắm.</li>
              <li><strong style={{ color: '#0060C4' }}>Bus:</strong> Hành trình di chuyển, hướng tới sự đồng hành xuyên suốt, mang lại giá trị cho cộng đồng thông qua từng chuyến đi.</li>
              <li><strong style={{ color: '#0060C4' }}>Blue Bus</strong> với hàm nghĩa cùng phát triển "BỀN VỮNG". Luôn là biểu tượng của sự tận tâm từ những giá trị cốt lõi đẹp nhất.</li>
            </ul>
          </div>
          <div className="about-col-img">
            <div className="about-card-illustration theme-blue">
              <FaHeart className="about-card-icon" />
              <h4>TẬN TÂM PHỤC VỤ</h4>
            </div>
          </div>
        </div>

        {/* Section 3: Triết lý */}
        <div className="about-section-row">
          <div className="about-col-img">
            <div className="about-card-illustration theme-gradient">
              <FaLightbulb className="about-card-icon" />
              <h4>ĐỔI MỚI SÁNG TẠO</h4>
            </div>
          </div>
          <div className="about-col-text">
            <h3 className="section-heading">TRIẾT LÝ</h3>
            <p style={{ textAlign: 'justify', lineHeight: '1.8' }}>Sự hài lòng của khách hàng là minh chứng lớn nhất cho chất lượng dịch vụ của Blue Bus. Chú trọng tạo ra môi trường làm việc hiện đại, năng động cho đội ngũ. Không ngừng phát triển năng lực, Blue Bus thấu hiểu nhu cầu hành khách, mang đến trải nghiệm hành trình mượt mà, đáp ứng tối đa mọi dịch vụ với giá cả phải chăng nhất.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GioiThieu;
