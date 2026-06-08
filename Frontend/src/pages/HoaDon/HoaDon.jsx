import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TraCuuHoaDon from './TraCuuHoaDon';
import DanhSachHoaDon from './DanhSachHoaDon';
import { QRCodeSVG } from 'qrcode.react';
import { FaSearch, FaFileInvoice, FaCheckCircle, FaQrcode, FaPrint, FaDownload, FaBus, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaTimesCircle, FaHome } from 'react-icons/fa';
import bookingApi from '../../api/bookingApi';
import Swal from 'sweetalert2';
import './HoaDon.css';

const HoaDon = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('lookup');
  const [ticketCode, setTicketCode] = useState(null);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setTicketCode(code);
      fetchBookingDetail(code);
    }
  }, [location.search]);

  const fetchBookingDetail = async (code) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Đang tra cứu vé với mã:", code);
      const res = await bookingApi.getBookingByCode(code);
      console.log("Kết quả từ Backend:", JSON.stringify(res));
      
      const data = res?.data || res?.booking || res?.chiTiet || res;
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        throw new Error("Không tìm thấy dữ liệu cho mã vé này.");
      }
      setBookingDetail(data);
    } catch (err) {
      console.error('Lỗi chi tiết:', err);
      const errorMsg = typeof err === 'string' ? err : (err?.message || err?.error || 'Lỗi kết nối Server');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!bookingDetail?.maVe) return;
    try {
      const res = await bookingApi.getTicketPDF(bookingDetail._id || bookingDetail.id);
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ve_BlueBus_${bookingDetail.maVe}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Lỗi tải PDF:', err);
      Swal.fire('Lỗi', 'Không thể tải file PDF lúc này.', 'error');
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: 'Xác nhận hủy vé?',
      text: "Bạn sẽ được hoàn tiền theo chính sách của BlueBus.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Quay lại'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await bookingApi.cancelBooking(bookingDetail._id || bookingDetail.id);
          Swal.fire('Thành công', 'Vé của bạn đã được hủy.', 'success');
          fetchBookingDetail(ticketCode);
        } catch (err) {
          Swal.fire('Lỗi', 'Không thể hủy vé lúc này.', 'error');
        }
      }
    });
  };

  useEffect(() => {
    if (bookingDetail) {
      console.log("Dữ liệu hóa đơn từ Backend:", bookingDetail);
    }
  }, [bookingDetail]);

  // Nếu có mã vé từ URL, hiển thị trang chi tiết vé thành công
  if (ticketCode) {
    if (isLoading) return (
      <div style={{textAlign:'center', padding:'80px 20px'}}>
        <div style={{fontSize:'40px', marginBottom:'16px'}}>⏳</div>
        <p style={{fontSize:'16px', color:'#555'}}>Đang tải chi tiết vé...</p>
      </div>
    );
    if (error) return (
      <div style={{textAlign:'center', padding:'60px 20px', maxWidth:'500px', margin:'0 auto'}}>
        <div style={{fontSize:'48px', marginBottom:'16px'}}>❌</div>
        <h3 style={{color:'#e53935', marginBottom:'12px'}}>Không tải được vé</h3>
        <p style={{color:'#666', marginBottom:'8px'}}>Mã vé: <strong>{ticketCode}</strong></p>
        <p style={{color:'#888', fontSize:'14px', marginBottom:'24px'}}>
          Có thể do mất kết nối server hoặc mã vé không tồn tại.<br/>
          Vui lòng thử lại hoặc liên hệ hotline <strong>1900 1234</strong>.
        </p>
        <button 
          onClick={() => fetchBookingDetail(ticketCode)}
          style={{padding:'10px 24px', background:'#1565C0', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px', marginRight:'12px'}}
        >
          🔄 Thử lại
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          style={{padding:'10px 24px', background:'#eee', color:'#333', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'15px'}}
        >
          Về trang chủ
        </button>
      </div>
    );
    if (!bookingDetail) return (
      <div style={{textAlign:'center', padding:'80px 20px'}}>
        <p style={{color:'#888'}}>Không tìm thấy dữ liệu vé.</p>
        <button onClick={() => fetchBookingDetail(ticketCode)} style={{marginTop:'12px', padding:'8px 20px', background:'#1565C0', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer'}}>Thử lại</button>
      </div>
    );

    // Map đúng schema BE trả về (flat object, không bọc trong chiTiet/khachHang)
    const booking = bookingDetail;
    const chuyen = booking?.chuyenXeId || {};
    const tuyen = chuyen?.tuyenXeId || {};
    const khach = booking?.khachHangId || booking;

    const status = (booking?.trangThai || '').toLowerCase();
    const canCancel = status === 'paid' || status === 'confirmed' || status === 'hold' || status === 'pending';

    // Danh sách ghế
    const seatsList = Array.isArray(booking?.danhSachGhe) ? booking.danhSachGhe : [];
    const seatsCount = seatsList.length || 1;

    const getPriceNum = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val.replace(/[^\d]/g, '')) || 0;
      return 0;
    };

    const tongTien = getPriceNum(booking?.tongTien || 0);
    const unitPrice = seatsCount > 0 ? tongTien / seatsCount : tongTien;

    // Điểm đón/trả — BE trả về object { tenDiem, diaChi, thoiGian }
    const diemDonFull = booking?.diemDon?.tenDiem
      ? `${booking.diemDon.tenDiem}${booking.diemDon.diaChi ? ' - ' + booking.diemDon.diaChi : ''}`
      : (typeof booking?.diemDon === 'string' ? booking.diemDon : 'Tại văn phòng');

    const diemTraFull = booking?.diemTra?.tenDiem
      ? `${booking.diemTra.tenDiem}${booking.diemTra.diaChi ? ' - ' + booking.diemTra.diaChi : ''}`
      : (typeof booking?.diemTra === 'string' ? booking.diemTra : 'Tại bến xe');

    const formatDate = (dateStr) => {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
    };

    const formatTime = (dateStr) => {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getReadableStatus = (statusStr) => {
      const s = (statusStr || '').toLowerCase();
      if (s === 'paid') return 'Đã thanh toán (Thành công)';
      if (s === 'confirmed') return 'Đã xác nhận';
      if (s === 'hold') return 'Đang tạm giữ ghế';
      if (s === 'pending') return 'Chờ thanh toán';
      if (s === 'cancelled') return 'Đã hủy';
      return statusStr || 'Thanh toán thành công';
    };

    const qrText = `${window.location.origin}/hoa-don?code=${booking?.maVe}`;

    return (
      <div className="invoice-futa-pdf-style">
        <div className="futa-pdf-container">
          <div className="futa-pdf-card">
            <div className="pdf-greeting">
               <p><strong>Gửi: {booking?.hoTen || khach?.hoTen || 'Quý khách'},</strong></p>
               <p>Chúc mừng quý khách đã đặt vé thành công trên hệ thống <strong>BlueBus</strong>.</p>
               <p>Mã vé <span className="highlight-red">{booking?.maVe || '—'}</span> của quý khách đặt ngày {formatDate(booking?.createdAt)} {formatTime(booking?.createdAt)} với hình thức thanh toán trực tuyến.</p>
             </div>

            <div className="pdf-section-title-box">
               <h2>THÔNG TIN MUA VÉ</h2>
            </div>

            <div className="pdf-summary-table">
               <div className="table-col">
                  <div className="table-row"><span>Họ tên:</span> <strong>{booking?.hoTen || khach?.hoTen || '—'}</strong></div>
                  <div className="table-row"><span>Số điện thoại:</span> <strong>{booking?.soDienThoai || khach?.soDienThoai || '—'}</strong></div>
                  <div className="table-row"><span>Email:</span> <strong className="small-text">{booking?.email || khach?.email || '—'}</strong></div>
               </div>
               <div className="table-col">
                  <div className="table-row"><span>Tổng giá vé:</span> <strong>{tongTien.toLocaleString('vi-VN')}đ</strong></div>
                  <div className="table-row"><span>PTTT:</span> <strong style={{textTransform:'uppercase'}}>{booking?.phuongThuc || 'Thanh toán trực tuyến'}</strong></div>
                  <div className="table-row"><span>Trạng thái:</span> <strong className="status-success">Thanh toán thành công</strong></div>
               </div>
            </div>

            <div className="pdf-qr-section">
               <div className="pdf-qr-card">
                  <div className="qr-header">Mã ghế: {seatsList.join(', ')}</div>
                  <div className="qr-body" style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: '#fff' }}>
                     {booking?.maVe && (
                       <QRCodeSVG
                         value={qrText}
                         size={150}
                         level="M"
                         includeMargin={true}
                       />
                     )}
                  </div>
                  <div className="qr-details">
                     <div className="qr-row"><span>Mã vé:</span> <strong>{booking?.maVe || '—'}</strong></div>
                     <div className="qr-row"><span>Tuyến xe:</span> <strong>{tuyen?.diemDi || '—'} ⇒ {tuyen?.diemDen || '—'}</strong></div>
                     <div className="qr-row"><span>Thời gian:</span> <strong>{formatTime(chuyen?.thoiGianKhoiHanh)} {formatDate(chuyen?.thoiGianKhoiHanh)}</strong></div>
                     <div className="qr-row"><span>Số lượng ghế:</span> <strong>{seatsList.length}</strong></div>
                     <div className="qr-row"><span>Điểm lên xe:</span> <strong className="address-text">{diemDonFull}</strong></div>
                     <div className="qr-row"><span>Điểm trả khách:</span> <strong className="address-text">{diemTraFull}</strong></div>
                     <div className="qr-row"><span>Giá vé:</span> <strong>{unitPrice.toLocaleString('vi-VN')}đ</strong></div>
                     <div className="qr-row"><span>Tổng giá vé:</span> <strong style={{ color: '#e53935', fontSize: '1.05em' }}>{tongTien.toLocaleString('vi-VN')}đ</strong></div>
                     <div className="qr-row divider"></div>
                     <p className="qr-note">Vui lòng mang mã vé đến văn phòng để đổi vé lên xe trước giờ xuất bến ít nhất 60 phút.</p>
                  </div>
               </div>
            </div>

            <div className="pdf-footer-note">
               <p>Quý khách cần hỗ trợ thêm? Liên hệ hotline: <span className="highlight-red">1900 1234</span></p>
               <p>Hoặc để lại tin nhắn tại mục Liên hệ trên website bluebus.vn</p>
            </div>

            <div className="pdf-actions no-print">
               <button className="btn-pdf btn-print" onClick={() => window.print()}><FaPrint /> In vé</button>
               <button className="btn-pdf btn-download" onClick={handleDownloadPDF}><FaDownload /> Tải vé PDF</button>
               {canCancel && <button className="btn-pdf btn-cancel" onClick={handleCancel}><FaTimesCircle /> Hủy vé</button>}
               <button className="btn-pdf btn-home" onClick={() => window.location.href = '/'}><FaHome /> Về trang chủ</button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-action-page">
      <div className="invoice-tabs-header-bar">
        <div className="invoice-bar-content-wrapper">
          <div className="invoice-bar-logo">
            <img src="/bluebus_logo.png" alt="BlueBus" />
          </div>
          <div className="invoice-bar-tabs">
            <div 
              className={`invoice-bar-tab ${activeTab === 'lookup' ? 'active' : ''}`}
              onClick={() => setActiveTab('lookup')}
            >
              <FaSearch className="tab-icon"/> Tra cứu hóa đơn
            </div>
            <div 
              className={`invoice-bar-tab ${activeTab === 'mine' ? 'active' : ''}`}
              onClick={() => setActiveTab('mine')}
            >
              <FaCheckCircle className="tab-icon"/> Xác thực hóa đơn
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-wrapper-outer">
        <div className="invoice-tab-content">
           {activeTab === 'lookup' ? <TraCuuHoaDon /> : <DanhSachHoaDon />}
        </div>
      </div>
    </div>
  );
};

export default HoaDon;
