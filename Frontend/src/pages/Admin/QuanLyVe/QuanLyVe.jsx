import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../AdminShared.css';
import './QuanLyVe.css';
import { FaTicketAlt, FaEdit, FaTimes, FaEye, FaCheckCircle, FaSearch } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import Swal from 'sweetalert2';

const QuanLyVe = () => {
  const location = useLocation();
  const [highlightId, setHighlightId] = useState(null);
  
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả'); // Show all but filtered locally
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD
  const [routeId, setRouteId] = useState('');
  const [tripId, setTripId] = useState('');
  
  // Data for filters
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'edit'
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Edit states
  const [availableTrips, setAvailableTrips] = useState([]);
  const [selectedNewTripId, setSelectedNewTripId] = useState('');
  const [tripSeatInfo, setTripSeatInfo] = useState(null);
  const [newSelectedSeats, setNewSelectedSeats] = useState([]);
  const [editFormData, setEditFormData] = useState({
    hoTen: '', soDienThoai: '', diemDon: '', diemTra: ''
  });

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      
      // Handle Date Filters (Year, Month, Day)
      if (dateFilter) {
        const d = new Date(dateFilter);
        params.year = d.getFullYear();
        params.month = d.getMonth() + 1;
        params.day = d.getDate();
      }
      
      // Handle Phone Filter
      if (searchTerm && /^\d+$/.test(searchTerm)) {
        params.phone = searchTerm;
      }
      
      // Chỉ gửi status đơn lẻ lên BE
      if (statusFilter !== 'Tất cả') {
        params.status = statusFilter;
      }

      if (routeId) params.routeId = routeId;
      if (tripId) params.tripId = tripId;

      const res = await adminApi.getBookings(params);
      
      const data = res.data || res;
      // BE có thể trả về nhiều cấu trúc khác nhau
      const list = data.bookings || data.docs || data.doc || (Array.isArray(data) ? data : []);
      console.log(`📋 Bookings fetched: ${list.length} items, statuses:`, [...new Set(list.map(b => b.trangThai))]);
      setBookings(list);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      // Swal.fire('Lỗi!', 'Không thể tải danh sách vé.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, statusFilter, searchTerm]);

  const fetchRoutes = async () => {
    try {
      const res = await adminApi.getRoutes();
      setRoutes(Array.isArray(res) ? res : (res.doc || res.routes || []));
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchTripsByRoute = async (rId) => {
    if (!rId) {
      setTrips([]);
      return;
    }
    try {
      const res = await adminApi.getTrips({ routeId: rId });
      setTrips(Array.isArray(res) ? res : (res.doc || res.trips || []));
    } catch (err) {
      console.error('Error fetching trips:', err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    setTripId(''); // Reset trip when route changes
    fetchTripsByRoute(routeId);
  }, [routeId]);

  useEffect(() => {
    // Debounce search if needed, but for now simple trigger
    fetchBookings();
  }, [fetchBookings]);

  // Lắng nghe sự kiện từ URL, State Router, hoặc Custom Event từ AdminLayout
  useEffect(() => {
    const checkHighlight = () => {
      let activeId = location.state?.highlightId;
      if (!activeId) {
        const searchParams = new URLSearchParams(location.search);
        activeId = searchParams.get('searchActive');
      }
      if (activeId) {
        console.log('Detected active booking to highlight:', activeId);
        setHighlightId(activeId);
      }
    };

    checkHighlight();

    const handleNotiClicked = (e) => {
      const id = e.detail?.highlightId;
      if (id) {
        console.log('Notification clicked custom event received. Highlighting:', id);
        setHighlightId(id);
      }
    };

    window.addEventListener('notification-clicked', handleNotiClicked);
    return () => {
      window.removeEventListener('notification-clicked', handleNotiClicked);
    };
  }, [location]);

  // Tự động điền thông tin và lọc khi phát hiện highlightId
  useEffect(() => {
    if (highlightId && bookings.length > 0) {
      const found = bookings.find(b => b._id === highlightId || b.maVe === highlightId);
      if (found) {
        console.log('Found matching booking to highlight:', found.maVe);
        setSearchTerm(found.maVe);
        
        // Cập nhật bộ lọc trạng thái phù hợp để hiển thị vé
        const status = found.trangThai;
        if (['cancelled', 'refunded', 'expired'].includes(status)) {
          setStatusFilter(status);
        } else if (['paid', 'confirmed', 'completed'].includes(status)) {
          setStatusFilter('paid_confirmed');
        } else {
          setStatusFilter(status);
        }
        
        // Cuộn tới dòng được highlight
        setTimeout(() => {
          const rowElement = document.getElementById(`row-${found._id}`);
          if (rowElement) {
            console.log('Scrolling to row:', `row-${found._id}`);
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [highlightId, bookings]);

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setModalType('view');
    setIsModalOpen(true);
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setSelectedNewTripId(booking.chuyenXeId?._id || booking.chuyenXeId);
    setNewSelectedSeats(Array.isArray(booking.danhSachGhe) ? [...booking.danhSachGhe] : [booking.danhSachGhe]);
    setEditFormData({
      hoTen: booking.hoTen || '',
      soDienThoai: booking.soDienThoai || '',
      diemDon: booking.diemDon || '',
      diemTra: booking.diemTra || ''
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Fetch available trips for the same route when editing
  useEffect(() => {
    if (modalType === 'edit' && selectedBooking) {
      const routeId = selectedBooking.chuyenXeId?.tuyenXeId?._id || selectedBooking.chuyenXeId?.tuyenXeId;
      if (routeId) {
        adminApi.getTrips({ routeId }).then(res => {
          const list = Array.isArray(res) ? res : (res.doc || res.trips || []);
          // Filter for upcoming trips
          const upcoming = list.filter(t => new Date(t.thoiGianKhoiHanh) > new Date());
          setAvailableTrips(upcoming);
        });
      }
    }
  }, [modalType, selectedBooking]);

  // Fetch seat info when trip changes in edit modal
  useEffect(() => {
    if (modalType === 'edit' && selectedNewTripId) {
      bookingApi.getTripDetail(selectedNewTripId).then(res => {
        setTripSeatInfo(res.data || res);
      });
    }
  }, [modalType, selectedNewTripId]);

  const handleConfirmPayment = async (booking) => {
    const result = await Swal.fire({
      title: 'Xác nhận vé?',
      html: `Xác nhận vé <strong>${booking.maVe}</strong> của <strong>${booking.hoTen}</strong> đã sẵn sàng?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2e7d32',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Quay lại',
    });

    if (result.isConfirmed) {
      try {
        await adminApi.updateBookingStatus(booking._id, { trangThai: 'confirmed' });
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Vé đã được xác nhận.', timer: 1500, showConfirmButton: false });
        fetchBookings();
      } catch (err) {
        Swal.fire('Lỗi', err.message || 'Không thể xác nhận vé.', 'error');
      }
    }
  };

  const handleCancel = async (booking) => {
    const { value: text, isConfirmed } = await Swal.fire({
      title: 'Hủy vé',
      input: 'textarea',
      inputLabel: `Lý do hủy vé ${booking.maVe}:`,
      inputPlaceholder: 'Nhập lý do hủy...',
      inputAttributes: { 'aria-label': 'Lý do hủy vé' },
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Xác nhận hủy',
      cancelButtonText: 'Quay lại',
      inputValidator: (value) => {
        if (!value) return 'Bạn cần nhập lý do hủy!';
      }
    });

    if (isConfirmed) {
      try {
        await adminApi.updateBookingStatus(booking._id, { 
          trangThai: 'refunded', 
          lyDoHuy: text 
        });
        Swal.fire({ icon: 'success', title: 'Đã hủy', text: 'Vé đã được hủy và chuyển trạng thái.', timer: 1500, showConfirmButton: false });
        fetchBookings();
      } catch (err) {
        Swal.fire('Lỗi', err.message || 'Không thể hủy vé.', 'error');
      }
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedNewTripId || newSelectedSeats.length === 0) {
      Swal.fire('Chú ý', 'Vui lòng chọn đầy đủ chuyến và ghế.', 'warning');
      return;
    }

    try {
      await adminApi.updateBookingStatus(selectedBooking._id, {
        chuyenXeId: selectedNewTripId,
        danhSachGhe: newSelectedSeats,
        hoTen: editFormData.hoTen,
        soDienThoai: editFormData.soDienThoai,
        diemDon: editFormData.diemDon,
        diemTra: editFormData.diemTra
      });
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin vé.', timer: 1500, showConfirmButton: false });
      setIsModalOpen(false);
      fetchBookings();
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || err.message || 'Không thể cập nhật vé.', 'error');
    }
  };

  const getStatusText = (status) => {
    const map = {
      'pending': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'confirmed': 'Đã xác nhận',
      'cancelled': 'Đã hủy',
      'refunded': 'Đã hoàn tiền',
      'completed': 'Đã hoàn thành',
      'expired': 'Đã hết hạn',
      'hold': 'Đang giữ chỗ'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    if (status === 'paid' || status === 'confirmed' || status === 'completed') return 'status-paid';
    if (status === 'pending' || status === 'hold') return 'status-unpaid';
    if (status === 'cancelled' || status === 'refunded' || status === 'expired') return 'status-cancelled';
    return '';
  };

  const formatCurrency = (val) => Number(val).toLocaleString('vi-VN') + 'đ';

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '---';
    const d = new Date(isoStr);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter locally to handle search and status selection
  const filteredBookings = bookings.filter(b => {
    // Bỏ qua lọc nếu đây là vé đang được highlight để đảm bảo Admin luôn thấy nó
    const isHighlighted = b._id === highlightId || b.maVe === highlightId;
    if (isHighlighted) return true;

    // 1. Lọc theo trạng thái
    if (statusFilter !== 'Tất cả') {
      if (b.trangThai !== statusFilter) return false;
    }

    // 3. Lọc theo tìm kiếm (Tên, Mã vé, SĐT)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = (b.hoTen || '').toLowerCase().includes(search);
      const matchCode = (b.maVe || '').toLowerCase().includes(search);
      const matchPhone = (b.soDienThoai || '').toLowerCase().includes(search);
      if (!matchName && !matchCode && !matchPhone) return false;
    }
    
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentBookings = filteredBookings.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Quản lý Vé Đặt</h2>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>Hệ thống quản lý vé và trạng thái thanh toán</p>
      </div>

      <div className="quan-ly-ve-container">
        {/* Stats summary */}
        <div className="qlv-stats">
          <div className="qlv-stat-item">
            <span className="qlv-stat-num" style={{ color: '#1565C0' }}>{stats.total || bookings.length}</span>
            <span className="qlv-stat-label">Tổng vé</span>
          </div>
          <div className="qlv-stat-item">
            <span className="qlv-stat-num" style={{ color: '#2e7d32' }}>{stats.paid || bookings.filter(b => b.trangThai === 'paid' || b.trangThai === 'confirmed' || b.trangThai === 'completed').length}</span>
            <span className="qlv-stat-label">Đã thanh toán</span>
          </div>
          <div className="qlv-stat-item">
            <span className="qlv-stat-num" style={{ color: '#ed6c02' }}>{stats.refunded || bookings.filter(b => b.trangThai === 'refunded' || b.trangThai === 'cancelled' || b.trangThai === 'expired').length}</span>
            <span className="qlv-stat-label">Đã hủy/hoàn</span>
          </div>
        </div>

        {/* Filters */}
        <div className="qlv-header-actions">
          <div className="qlv-filters">
            <div className="search-box-wrapper">
              <input
                type="text"
                className="qlv-filter-input"
                placeholder="Mã vé, tên KH, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="search-icon" />
            </div>
            
            <select
              className="qlv-filter-select"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
            >
              <option value="">Chọn Tuyến Xe</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.diemDi} → {r.diemDen}</option>
              ))}
            </select>

            <select
              className="qlv-filter-select"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              disabled={!routeId}
            >
              <option value="">Chọn Chuyến Xe</option>
              {trips.map(t => (
                <option key={t._id} value={t._id}>
                  {new Date(t.thoiGianKhoiHanh).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})} 
                  ({t.xeId?.bienSo})
                </option>
              ))}
            </select>

            <select
              className="qlv-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả vé</option>
              <option value="paid">Đã thanh toán</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="hold">Đang giữ chỗ</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="cancelled">Đã hủy</option>
              <option value="refunded">Đã hoàn tiền</option>
              <option value="expired">Đã hết hạn</option>
            </select>
            <input
              type="date"
              className="qlv-filter-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Vé</th>
                <th>Khách Hàng</th>
                <th>Tuyến / Chuyến</th>
                <th>Ghế</th>
                <th>Khởi hành</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu vé...</td></tr>
              ) : currentBookings.length > 0 ? currentBookings.map((b) => (
                <tr 
                  key={b._id} 
                  id={`row-${b._id}`}
                  className={`
                    ${b.trangThai === 'cancelled' || b.trangThai === 'refunded' ? 'row-cancelled' : ''} 
                    ${(highlightId === b._id || highlightId === b.maVe) ? 'row-highlighted' : ''}
                  `}
                >
                  <td><strong style={{ color: '#1565C0' }}>{b.maVe}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.hoTen}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{b.soDienThoai}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      {b.chuyenXeId?.tuyenXeId?.diemDi} → {b.chuyenXeId?.tuyenXeId?.diemDen}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>ID: {b.chuyenXeId?._id?.slice(-6).toUpperCase()}</div>
                  </td>
                  <td><strong>{Array.isArray(b.danhSachGhe) ? b.danhSachGhe.join(', ') : b.danhSachGhe}</strong></td>
                  <td style={{ fontSize: '13px' }}>{formatDateTime(b.chuyenXeId?.thoiGianKhoiHanh)}</td>
                  <td style={{ color: '#E53935', fontWeight: 'bold' }}>{formatCurrency(b.tongTien)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(b.trangThai)}`}>
                      {getStatusText(b.trangThai)}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      {b.trangThai === 'paid' && (
                        <button className="btn-action btn-confirm" onClick={() => handleConfirmPayment(b)} title="Xác nhận vé">
                          <FaCheckCircle />
                        </button>
                      )}
                      {(b.trangThai !== 'cancelled' && b.trangThai !== 'refunded' && b.trangThai !== 'confirmed' && b.trangThai !== 'completed') && (
                        <>
                          <button className="btn-action btn-cancel-ticket" onClick={() => handleCancel(b)} title="Hủy vé">
                            <FaTimes />
                          </button>
                          <button className="btn-action btn-edit-ticket" onClick={() => handleEdit(b)} title="Đổi ghế/chuyến">
                            <FaEdit />
                          </button>
                        </>
                      )}
                      <button className="btn-action btn-view" onClick={() => handleView(b)} title="Xem chi tiết">
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy vé nào phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="page-btn" onClick={() => setCurrentPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>Trước</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i + 1} className={`page-btn ${safeCurrentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" onClick={() => setCurrentPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>Sau</button>
          </div>
        )}
      </div>

      {/* Modal: View */}
      {/* Modal: View */}
      {isModalOpen && modalType === 'view' && selectedBooking && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>📋 Chi tiết vé đặt</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="ticket-detail-view">
                <div className="ticket-detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Mã vé</span>
                    <span className="detail-value" style={{ color: '#1565C0', fontWeight: 700 }}>{selectedBooking.maVe}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Khách hàng</span>
                    <span className="detail-value">{selectedBooking.hoTen}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Số điện thoại</span>
                    <span className="detail-value">{selectedBooking.soDienThoai}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tuyến</span>
                    <span className="detail-value">{selectedBooking.chuyenXeId?.tuyenXeId?.diemDi} - {selectedBooking.chuyenXeId?.tuyenXeId?.diemDen}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Danh sách ghế</span>
                    <span className="detail-value">{Array.isArray(selectedBooking.danhSachGhe) ? selectedBooking.danhSachGhe.join(', ') : selectedBooking.danhSachGhe}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Khởi hành</span>
                    <span className="detail-value">{formatDateTime(selectedBooking.chuyenXeId?.thoiGianKhoiHanh)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tổng tiền</span>
                    <span className="detail-value" style={{ color: '#E53935', fontWeight: 700 }}>{formatCurrency(selectedBooking.tongTien)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Trạng thái</span>
                    <span className={`status-badge ${getStatusClass(selectedBooking.trangThai)}`}>{getStatusText(selectedBooking.trangThai)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">P.Thức T.Toán</span>
                    <span className="detail-value">{selectedBooking.phuongThucThanhToan?.toUpperCase()}</span>
                  </div>
                   <div className="detail-item">
                    <span className="detail-label">Ngày đặt</span>
                    <span className="detail-value">{formatDateTime(selectedBooking.ngayDat)}</span>
                  </div>
                </div>
                
                {(selectedBooking.ghiChu || selectedBooking.lyDoHuy) && (
                  <div className="cancel-reason-box" style={{ marginTop: '15px' }}>
                    <strong>📌 Ghi chú / Lý do hủy:</strong>
                    <p>
                      {(() => {
                        const rawText = selectedBooking.lyDoHuy || selectedBooking.ghiChu || '';
                        // Nếu có chứa chuỗi mẫu của hệ thống, ta cắt lấy phần lý do thực sự
                        if (rawText.includes('Lý do:')) {
                           return rawText.split('Lý do:')[1].replace(']', '').trim();
                        }
                        return rawText;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit */}
      {isModalOpen && modalType === 'edit' && selectedBooking && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>🔄 Đổi chuyến / Đổi ghế</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="edit-ticket-form">
                <div className="edit-form-row">
                  <div className="p-input-group">
                    <label>Họ tên khách hàng</label>
                    <input 
                      type="text" 
                      className="qlv-filter-input"
                      value={editFormData.hoTen}
                      onChange={e => setEditFormData({...editFormData, hoTen: e.target.value})}
                    />
                  </div>
                  <div className="p-input-group">
                    <label>Số điện thoại</label>
                    <input 
                      type="text" 
                      className="qlv-filter-input"
                      value={editFormData.soDienThoai}
                      onChange={e => setEditFormData({...editFormData, soDienThoai: e.target.value})}
                    />
                  </div>
                </div>

                <div className="edit-form-row" style={{ marginTop: '15px' }}>
                  <div className="p-input-group">
                    <label>Điểm đón</label>
                    <input 
                      type="text" 
                      className="qlv-filter-input"
                      value={editFormData.diemDon}
                      onChange={e => setEditFormData({...editFormData, diemDon: e.target.value})}
                    />
                  </div>
                  <div className="p-input-group">
                    <label>Điểm trả</label>
                    <input 
                      type="text" 
                      className="qlv-filter-input"
                      value={editFormData.diemTra}
                      onChange={e => setEditFormData({...editFormData, diemTra: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-input-group" style={{ marginTop: '15px' }}>
                  <label>Chọn Chuyến Mới (Cùng tuyến)</label>
                  <select 
                    className="w-select-modern"
                    value={selectedNewTripId}
                    onChange={(e) => {
                      setSelectedNewTripId(e.target.value);
                      setNewSelectedSeats([]); // Reset seats when trip changes
                    }}
                  >
                    {availableTrips.map(t => (
                      <option key={t._id} value={t._id}>
                        {new Date(t.thoiGianKhoiHanh).toLocaleString('vi-VN')} - {t.xeId?.bienSo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-input-group" style={{ marginTop: '20px' }}>
                  <label>Chọn Ghế Trống (Chọn {selectedBooking.danhSachGhe?.length} ghế)</label>
                  <div className="edit-seat-selector">
                    {tripSeatInfo ? (
                      <div className="seat-grid-mini">
                        {tripSeatInfo.soDoGheId?.danhSachGhe?.map(seat => {
                          const isBooked = tripSeatInfo.gheDaDat?.includes(seat.maGhe);
                          const isCurrent = selectedBooking.chuyenXeId?._id === selectedNewTripId && selectedBooking.danhSachGhe?.includes(seat.maGhe);
                          const isSelected = newSelectedSeats.includes(seat.maGhe);
                          
                          return (
                            <button
                              key={seat.maGhe}
                              type="button"
                              className={`mini-seat ${isBooked && !isCurrent ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                              disabled={isBooked && !isCurrent}
                              onClick={() => {
                                if (isSelected) {
                                  setNewSelectedSeats(prev => prev.filter(s => s !== seat.maGhe));
                                } else {
                                  if (newSelectedSeats.length < selectedBooking.danhSachGhe?.length) {
                                    setNewSelectedSeats(prev => [...prev, seat.maGhe]);
                                  } else {
                                    setNewSelectedSeats(prev => [seat.maGhe]);
                                  }
                                }
                              }}
                            >
                              {seat.maGhe}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p>Đang tải sơ đồ ghế...</p>
                    )}
                  </div>
                  <div className="seat-legend-mini">
                    <span className="legend-item"><span className="box available"></span> Trống</span>
                    <span className="legend-item"><span className="box booked"></span> Đã bán</span>
                    <span className="legend-item"><span className="box selected"></span> Đang chọn</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn-submit-primary" onClick={handleUpdateBooking} style={{ background: '#1565C0', color: '#fff' }}>
                Xác nhận thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyVe;
