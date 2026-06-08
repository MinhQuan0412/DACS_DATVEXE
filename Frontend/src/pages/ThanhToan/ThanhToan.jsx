import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import bookingApi from '../../api/bookingApi';
import Swal from 'sweetalert2';
import socket from '../../utils/socket';
import './ThanhToan.css';

const ThanhToan = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const trip = state.trip || {};
  const seats = state.selectedSeats || []; 
  const initialTotal = state.total || 0;
  const bookingId = state.bookingId;
  const holdExpires = state.holdExpires;
  const initialMaVe = state.maVe;
  const customer = state.customer || {};
  const diemDon = state.diemDon || {};
  const diemTra = state.diemTra || {};

  const [timeLeft, setTimeLeft] = useState(0);
  const [qrData, setQrData] = useState(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);

  const getPriceNum = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/[^\d]/g, '')) || 0;
    return 0;
  };

  const safeInitialTotal = getPriceNum(initialTotal);
  const finalTotal = safeInitialTotal - discount;

  // 1. Socket payment_confirmed + Polling fallback
  useEffect(() => {
    if (!bookingId) return;

    socket.emit('joinBookingRoom', bookingId);

    // Lắng nghe event payment_confirmed từ BE (đúng tên BE dùng)
    const onPaymentConfirmed = (data) => {
      const maVe = data.maVe || data.ma_ve || initialMaVe;
      Swal.fire({
        title: 'Thanh toán thành công!',
        text: 'Hệ thống đã xác nhận thanh toán tự động!',
        icon: 'success',
        confirmButtonText: 'Xem vé ngay',
        timer: 4000,
        timerProgressBar: true
      }).then(() => {
        navigate(`/hoa-don?code=${maVe}`, { replace: true });
      });
    };

    socket.on('payment_confirmed', onPaymentConfirmed);
    // Giữ lại tên cũ phòng BE dùng cả 2
    socket.on('paymentConfirmed', onPaymentConfirmed);

    // Polling mỗi 3 giây — fallback khi socket/webhook không hit được
    const checkStatus = async () => {
      try {
        const res = await bookingApi.getBookingDetail(bookingId);
        const data = res.data || res;
        setBookingDetail(data);
        const totalDiscount = data.discount || data.soTienGiam || data.soTienGiamGia || 0;
        setDiscount(totalDiscount);
        if (data.trangThai === 'paid' || data.trangThai === 'confirmed' || data.daDuocThanhToan === true) {
          clearInterval(pollingInterval);
          await Swal.fire({
            title: 'Thanh toán thành công!',
            text: 'Vé điện tử đã được gửi về email của bạn.',
            icon: 'success',
            confirmButtonText: 'Xem vé ngay',
            timer: 4000,
            timerProgressBar: true
          });
          navigate(`/hoa-don?code=${data.maVe}`, { replace: true });
        }
      } catch (err) {}
    };

    checkStatus();
    const pollingInterval = setInterval(checkStatus, 3000);

    return () => {
      clearInterval(pollingInterval);
      socket.emit('leaveBookingRoom', bookingId);
      socket.off('payment_confirmed', onPaymentConfirmed);
      socket.off('paymentConfirmed', onPaymentConfirmed);
    };
  }, [bookingId, navigate, initialMaVe]);

  // Join trip room để các client khác cũng nhận được trạng thái ghế đang giữ
  const chuyenXeId = trip?._id || trip?.maChuyen;
  useEffect(() => {
    if (!chuyenXeId) return;
    socket.emit('joinTripRoom', chuyenXeId);
    // Emit lại seat_locked để những user mới vào room cũng nhận được
    if (seats.length > 0) {
      socket.emit('seat_locked', { chuyenXeId, danhSachGhe: seats });
    }
    return () => {
      socket.emit('leaveTripRoom', chuyenXeId);
    };
  }, [chuyenXeId, seats]);

  // 2. Timer
  useEffect(() => {
    if (!holdExpires) { setTimeLeft(300); return; }
    const expiry = new Date(holdExpires).getTime();
    const update = () => {
      const diff = Math.floor((expiry - Date.now()) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
      if (diff <= 0) navigate('/');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [holdExpires, navigate]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleBackWithCancel = async () => {
    const res = await Swal.fire({
      title: 'Xác nhận hủy?',
      text: 'Thao tác này sẽ nhả ghế ngay lập tức.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý hủy'
    });
    if (res.isConfirmed) {
      try { 
        if (bookingId) await bookingApi.cancelHold(bookingId); 
        // Phóng sự kiện nhả ghế lên Server để realtime cập nhật cho người khác
        const chuyenXeId = trip?._id || trip?.maChuyen;
        if (chuyenXeId && seats.length > 0) {
          socket.emit('seat_released', { chuyenXeId, danhSachGhe: seats });
        }
      } catch (e) {}
      navigate('/');
    }
  };

  const fetchQR = useCallback(async (targetMaVe) => {
    if (!targetMaVe) return;
    setIsLoadingQR(true);
    try {
      const res = await bookingApi.getSePayQR(targetMaVe);
      setQrData(res.data || res);
    } catch (err) {
      console.error('Lỗi tải QR:', err);
    } finally {
      setIsLoadingQR(false);
    }
  }, []);

  useEffect(() => { 
    const currentMaVe = bookingDetail?.maVe || initialMaVe;
    if (currentMaVe && !qrData && !isLoadingQR) {
      fetchQR(currentMaVe);
    }
  }, [bookingDetail, initialMaVe, qrData, isLoadingQR, fetchQR]);

  const handleApplyVoucher = async (code) => {
    const c = code || voucherCode;
    if (!c) return Swal.fire('Thông báo', 'Vui lòng nhập mã', 'warning');
    try {
      const check = await bookingApi.checkVoucher({ maVoucher: c, tongTien: safeInitialTotal });
      const soTienGiam = check.voucher?.soTienGiam || 0;
      await Swal.fire('Thành công', `Giảm giá: ${soTienGiam.toLocaleString('vi-VN')}đ`, 'success');
      await bookingApi.applyVoucher(bookingId, c);
      
      setDiscount(soTienGiam);
      setVoucherCode(c);
      setShowVoucherList(false);
      
      // Force refresh QR code với số tiền mới
      setQrData(null); 
    } catch (err) {
      Swal.fire('Thất bại', err.response?.data?.message || err.message, 'error');
    }
  };

  const toggleVoucherList = async () => {
    if (!showVoucherList) {
      try {
        const res = await bookingApi.getVouchers({ tongTien: safeInitialTotal });
        let list = res.data?.docs || res.data || res.vouchers || res.docs || (Array.isArray(res) ? res : []);
        // LỌC CHỈ HIỆN VOUCHER CÓ THỂ DÙNG (isAvailable !== false)
        list = list.filter(v => v.isAvailable !== false);
        setAvailableVouchers(list);
      } catch (e) { setAvailableVouchers([]); }
    }
    setShowVoucherList(!showVoucherList);
  };

  const formatDateViet = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${weekdays[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div className="futa-payment-wrapper">
      <div className="futa-payment-header">
        <div className="container d-flex align-items-center justify-content-center">
          <button className="back-btn" onClick={handleBackWithCancel}>Quay lại</button>
          <div className="text-center ms-4">
            <h2 className="mb-0 text-white">Thanh toán vé xe</h2>
            <p className="mb-0 text-white opacity-75">{trip.tuyenXeId?.diemDi} - {trip.tuyenXeId?.diemDen}</p>
            <p className="mb-0 text-white small" style={{marginTop: '4px'}}>{formatDateViet(trip.thoiGianKhoiHanh)}</p>
          </div>
        </div>
      </div>

      <div className="futa-payment-body container py-4">
        <div className="payment-grid">
          <div className="payment-methods-col">
            <h3 className="section-title">Phương thức thanh toán</h3>
            <div className="methods-list">
              <div className="method-item selected">
                <img src="https://cdn-icons-png.flaticon.com/512/2830/2830284.png" alt="QR" className="method-icon" />
                <div className="method-text"><strong>Thanh toán VietQR</strong><p>Xác nhận tự động</p></div>
                <div className="check-mark">✓</div>
              </div>
            </div>
          </div>

          <div className="payment-central-col">
            <div className="total-box">
              <span className="label">Tổng thanh toán</span>
              <span className="value">{finalTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="timer-box-dv">Thời gian giữ chỗ còn lại: <strong>{formatTime(timeLeft)}</strong></div>
            <div className="qr-container-dv">
              {isLoadingQR ? <div className="py-5">Đang cập nhật...</div> : qrData ? (
                <div className="qr-image-wrapper large-qr">
                  <img src={qrData.qrUrl || qrData} alt="VietQR" className="real-qr-img" />
                </div>
              ) : <div className="text-danger py-5">Đang tải mã QR...</div>}
            </div>
          </div>

          <div className="payment-summary-col">
            <div className="summary-card mb-3">
              <h3 className="card-title-dv">Thông tin hành khách</h3>
              <div className="info-list-dv">
                <div className="info-row-dv"><span>Họ tên</span><strong>{customer.hoTen}</strong></div>
                <div className="info-row-dv"><span>SĐT</span><strong>{customer.soDienThoai}</strong></div>
              </div>
            </div>

            <div className="summary-card mb-3">
              <h3 className="card-title-dv">Thông tin chuyến đi</h3>
              <div className="info-list-dv">
                <div className="info-row-dv"><span>Số lượng ghế</span><strong>{seats.length} Ghế</strong></div>
                <div className="info-row-dv"><span>Số ghế</span><strong className="text-primary">{seats.join(', ')}</strong></div>
                <div className="border-top pt-2 mt-2">
                   <div className="loc-label-dv">ĐIỂM ĐÓN</div>
                   <div className="loc-name-dv">{diemDon.tenDiem}</div>
                </div>
                <div className="border-top pt-2 mt-2">
                   <div className="loc-label-dv">ĐIỂM TRẢ</div>
                   <div className="loc-name-dv">{diemTra.tenDiem}</div>
                </div>
              </div>
            </div>

            <div className="summary-card mb-3 voucher-box-dv">
              <h3 className="card-title-dv">Mã giảm giá</h3>
              <div className="voucher-input-group-dv">
                <input type="text" placeholder="Mã ưu đãi" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} />
                <button onClick={() => handleApplyVoucher()}>Dùng</button>
              </div>
              <button className="btn-toggle-voucher-dv" onClick={toggleVoucherList}>
                {showVoucherList ? 'Đóng' : '📋 Danh sách Voucher'}
              </button>
              {showVoucherList && (
                <div className="voucher-dropdown-list-dv">
                  {availableVouchers.length === 0 ? <p className="text-center py-2 m-0 small">Không có mã khả dụng</p> : 
                    availableVouchers.map(v => (
                      <div key={v.maVoucher} className="v-item-dv">
                        <div className="v-content-dv"><strong>{v.maVoucher}</strong><p className="m-0 small">{v.moTa}</p></div>
                        <button onClick={() => handleApplyVoucher(v.maVoucher)}>Dùng</button>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <div className="summary-card">
              <h3 className="card-title-dv">Chi tiết giá</h3>
              <div className="info-list-dv">
                <div className="info-row-dv"><span>Giá vé</span><span>{safeInitialTotal.toLocaleString('vi-VN')}đ</span></div>
                {discount > 0 && <div className="info-row-dv text-success"><span>Giảm giá</span><span>-{discount.toLocaleString('vi-VN')}đ</span></div>}
                <div className="info-row-dv border-top pt-2 mt-2 total-line-dv">
                  <span>Tổng tiền</span><strong className="text-primary fs-5">{finalTotal.toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThanhToan;
