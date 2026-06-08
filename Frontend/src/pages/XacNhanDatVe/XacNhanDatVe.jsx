import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  FaCheckCircle, FaTicketAlt, FaMapMarkerAlt, FaClock,
  FaUser, FaPhone, FaEnvelope, FaChair, FaPrint,
  FaHome, FaListAlt
} from 'react-icons/fa';
import bookingApi from '../../api/bookingApi';
import './XacNhanDatVe.css';

const XacNhanDatVe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const confettiRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get bookingId from ThanhToan page
  const bookingId = location.state?.bookingId;

  useEffect(() => {
    if (!bookingId) {
      navigate('/');
      return;
    }

    const fetchInvoice = async () => {
      try {
        const res = await bookingApi.getInvoice(bookingId);
        setInvoice(res.data || res);
      } catch (error) {
        console.error('Lỗi tải hóa đơn:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();

    // Confetti burst effect
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 120 + 60,
      color: ['#0060C4', '#00a651', '#FFB800', '#E63946', '#4cc9f0'][Math.floor(Math.random() * 5)],
      tilt: Math.random() * 10 - 10,
      tiltAnim: Math.random() * 0.1 + 0.05,
      angle: 0,
    }));

    let animId;
    let frameCount = 0;
    const MAX_FRAMES = 200;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });
      update();
      frameCount++;
      if (frameCount < MAX_FRAMES) animId = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const update = () => {
      pieces.forEach((p) => {
        p.y += Math.cos(p.angle + p.d) + 1 + p.r / 10;
        p.x += Math.sin(p.angle);
        p.angle += 0.01;
        p.tilt = Math.sin(p.angle - p.tiltAnim) * 12;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [bookingId, navigate]);

  const handlePrint = () => window.print();

  if (isLoading) return <div style={{ padding: '100px', textAlign: 'center' }}>Đang tải hóa đơn...</div>;
  if (!invoice) return <div style={{ padding: '100px', textAlign: 'center' }}>Không tìm thấy hóa đơn.</div>;

  const chiTiet = invoice.chiTiet || {};
  const khachHang = invoice.khachHang || {};

  return (
    <div className="xn-page fade-in">
      <canvas ref={confettiRef} className="xn-confetti-canvas" />

      <div className="xn-wrapper">
        <div className="xn-success-banner">
          <div className="xn-success-icon-ring">
            <FaCheckCircle className="xn-check-icon" />
          </div>
          <h1 className="xn-success-title">Đặt vé thành công!</h1>
          <p className="xn-success-sub">
            Cảm ơn bạn đã sử dụng dịch vụ. Vé điện tử đã được gửi về email của bạn.
          </p>
          <div className="xn-booking-code-badge">
            <FaTicketAlt />
            <span>Mã hóa đơn:</span>
            <strong>{invoice.maHoaDon}</strong>
          </div>
        </div>

        <div className="xn-ticket-card" id="printable-ticket">
          <div className="xn-ticket-top">
            <div className="xn-ticket-logo">
              <img src="/bluebus_logo.png" alt="BlueBus" />
            </div>
            <div className="xn-ticket-code-top">
              <span className="xn-code-label">Mã vé</span>
              <span className="xn-code-value">{invoice.maVe}</span>
            </div>
            <div className={`xn-status-badge paid`}>✓ Đã thanh toán</div>
          </div>

          <div className="xn-perforation">
            <div className="xn-perf-circle left" />
            <div className="xn-perf-dashed" />
            <div className="xn-perf-circle right" />
          </div>

          <div className="xn-ticket-body">
            <div className="xn-journey-header">
              <div className="xn-journey-route">
                <FaMapMarkerAlt className="xn-route-icon" />
                <span className="xn-route-text">{chiTiet.tênTuyến || chiTiet.tenTuyen}</span>
              </div>
              <div className="xn-journey-time">
                <FaClock className="xn-clock-icon" />
                <span>{new Date(invoice.ngayLap).toLocaleDateString('vi-VN')} {new Date(invoice.ngayLap).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
            </div>

            <div className="xn-info-grid">
              <div className="xn-info-section">
                <h4 className="xn-section-label">Thông tin hành khách</h4>
                <div className="xn-info-item">
                  <FaUser className="xn-icon" />
                  <span>{khachHang.hoTen}</span>
                </div>
                <div className="xn-info-item">
                  <FaPhone className="xn-icon" />
                  <span>{khachHang.soDienThoai}</span>
                </div>
                <div className="xn-info-item">
                  <FaChair className="xn-icon" />
                  <span>Ghế: <strong className="xn-seat-highlight">{Array.isArray(chiTiet.sốGhế || chiTiet.soGhe) ? (chiTiet.sốGhế || chiTiet.soGhe).join(', ') : (chiTiet.sốGhế || chiTiet.soGhe)}</strong></span>
                </div>
              </div>

              <div className="xn-info-section qr-section">
                <div className="ticket-qr-wrapper">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/hoa-don?code=${invoice.maVe}`)}`} alt="Ticket QR" />
                  <span className="qr-hint">Quét để xem vé: {invoice.maVe}</span>
                </div>
              </div>
            </div>

            <div className="xn-info-section full-width">
                <h4 className="xn-section-label">Hành trình</h4>
                <div className="xn-journey-path">
                    <div className="xn-stop-row">
                      <div className="xn-stop-dot depart" />
                      <div>
                        <p className="xn-stop-name">Đón: {chiTiet.điểmĐón || chiTiet.diemDon}</p>
                      </div>
                    </div>
                    <div className="xn-stop-line" />
                    <div className="xn-stop-row">
                      <div className="xn-stop-dot arrive" />
                      <div>
                        <p className="xn-stop-name">Trả: {chiTiet.điểmTrả || chiTiet.diemTra}</p>
                      </div>
                    </div>
                </div>
            </div>

            <div className="xn-payment-summary">
              <div className="xn-pay-row">
                <span>Phương thức thanh toán</span>
                <strong style={{textTransform: 'uppercase'}}>{chiTiet.phươngThức || chiTiet.phuongThuc}</strong>
              </div>
              <div className="xn-pay-row xn-pay-total">
                <span>Tổng tiền đã thanh toán</span>
                <strong className="xn-total-amount">{(chiTiet.tổngTiền || chiTiet.tongTien).toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="xn-actions">
          <button className="xn-btn xn-btn-print" onClick={handlePrint}>
            <FaPrint /> In vé / Tải PDF
          </button>
          <Link to="/lich-su-dat-ve" className="xn-btn xn-btn-history">
            <FaListAlt /> Xem lịch sử đặt vé
          </Link>
          <Link to="/" className="xn-btn xn-btn-home">
            <FaHome /> Về trang chủ
          </Link>
        </div>

        <div className="xn-note-box">
          <p>📌 <strong>Lưu ý:</strong> Vui lòng <strong>có mặt tại điểm lên xe trước 15 phút</strong>. Chúc quý khách có một chuyến hành trình an toàn!</p>
        </div>
      </div>
    </div>
  );
};

export default XacNhanDatVe;
