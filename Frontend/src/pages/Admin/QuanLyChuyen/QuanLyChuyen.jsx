import React, { useState, useEffect } from 'react';
import '../AdminShared.css';
import './QuanLyChuyen.css';
import { FaPlus, FaCheck, FaTimes, FaEye, FaPlay, FaTrashAlt } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import Swal from 'sweetalert2';
import Select from 'react-select';

const QuanLyChuyen = () => {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [routeFilter, setRouteFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'view'
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [formData, setFormData] = useState({
    id: '', routeId: '', vehicleId: '', startTime: '', vehicleType: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tripsData, routesData, vehiclesData] = await Promise.all([
        adminApi.getTrips(),
        adminApi.getRoutes(),
        adminApi.getVehicles()
      ]);
      
      console.log('Trips Response:', tripsData);
      
      setTrips(Array.isArray(tripsData) ? tripsData : (tripsData.doc || tripsData.trips || []));
      setRoutes(Array.isArray(routesData) ? routesData : (routesData.doc || routesData.routes || []));
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData.doc || vehiclesData.vehicles || []));
    } catch (err) {
      console.error('Error fetching data:', err);
      Swal.fire('Lỗi kết nối!', `Không thể tải dữ liệu chuyến xe. Chi tiết: ${err.message || err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lọc xe thông minh theo tuyến và khả năng vận hành
  useEffect(() => {
    const fetchAvailable = async () => {
      if (formData.routeId && (modalType === 'add' || modalType === 'edit')) {
        try {
          const res = await adminApi.getVehicles({ 
            availableForTrip: true, 
            tuyenXeId: formData.routeId,
            excludeTripId: formData.id // Đề phòng BE cần loại trừ chuyến hiện tại khi edit
          });
          const list = Array.isArray(res) ? res : (res?.doc || res?.vehicles || []);
          setAvailableVehicles(list);
          
          // Nếu xe hiện tại không nằm trong danh sách rảnh, vẫn nên hiển thị nó nếu đang ở chế độ Edit
          if (modalType === 'edit' && formData.vehicleId) {
            const currentVehicle = vehicles.find(v => v._id === formData.vehicleId);
            if (currentVehicle && !list.find(v => v._id === formData.vehicleId)) {
              setAvailableVehicles(prev => [currentVehicle, ...prev]);
            }
          }
        } catch (err) {
          console.error('Lỗi lấy danh sách xe trống:', err);
        }
      } else {
        setAvailableVehicles([]);
      }
    };
    fetchAvailable();
  }, [formData.routeId, modalType]);

  const getStatusClass = (status) => {
    if (status === 'active' || status === 'Chờ khởi hành') return 'status-pending';
    if (status === 'running' || status === 'Đang chạy') return 'status-running';
    if (status === 'completed' || status === 'Đã hoàn thành') return 'status-completed';
    if (status === 'cancelled' || status === 'Đã hủy') return 'status-cancelled';
    return '';
  };

  const getStatusText = (status) => {
    if (status === 'active') return 'Chờ khởi hành';
    if (status === 'running') return 'Đang chạy';
    if (status === 'completed') return 'Đã hoàn thành';
    if (status === 'cancelled') return 'Đã hủy';
    return status;
  };

  const handleAction = async (trip, action) => {
    if (action === 'cancel') {
      const { value: lyDo, isConfirmed } = await Swal.fire({
        title: 'Hủy chuyến xe?',
        html: `
          <p style="margin-bottom:10px;color:#555">Mã chuyến: <strong>${trip._id.slice(-6).toUpperCase()}</strong></p>
          <p style="margin-bottom:12px;color:#555;color:#e53935;font-weight:600">⚠️ Tất cả vé của chuyến này sẽ bị hủy và khách hàng sẽ nhận email thông báo!</p>
          <textarea id="lydo-chuyen" class="swal2-textarea" placeholder="Nhập lý do hủy chuyến (tối thiểu 5 ký tự)..." style="min-height:90px;resize:vertical"></textarea>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Xác nhận hủy chuyến',
        cancelButtonText: 'Đóng',
        preConfirm: () => {
          const val = document.getElementById('lydo-chuyen').value.trim();
          if (!val || val.length < 5) {
            Swal.showValidationMessage('Vui lòng nhập lý do hủy (tối thiểu 5 ký tự)');
            return false;
          }
          return val;
        }
      });

      if (!isConfirmed || !lyDo) return;

      try {
        await adminApi.cancelTrip(trip._id, { lyDo });
        Swal.fire({ icon: 'success', title: 'Đã hủy chuyến!', text: 'Email thông báo đã được gửi đến khách hàng.', timer: 2500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire('Lỗi!', err?.message || 'Không thể hủy chuyến này.', 'error');
      }
    } else if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Hành động này không thể hoàn tác.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Xóa ngay'
      });

      if (result.isConfirmed) {
        try {
          await adminApi.deleteTrip(trip._id);
          Swal.fire('Đã xóa!', 'Chuyến xe đã được xóa.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Lỗi!', err.message || 'Không thể xóa chuyến xe này.', 'error');
        }
      }
    } else if (action === 'edit') {
      setFormData({ 
        id: trip._id, 
        routeId: trip.tuyenXeId?._id || trip.tuyenXeId, 
        vehicleId: trip.xeId?._id || trip.xeId, 
        startTime: trip.thoiGianKhoiHanh ? new Date(trip.thoiGianKhoiHanh).toISOString().slice(0, 16) : ''
      });
      setModalType('edit');
      setIsModalOpen(true);
    } else if (action === 'view') {
      setSelectedTrip(trip);
      setModalType('view');
      setIsModalOpen(true);
    }
  };

  const openAddModal = () => {
    setFormData({ id: '', routeId: routes[0]?._id || '', vehicleId: '', startTime: '' });
    setModalType('add');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        xeId: formData.vehicleId,
        tuyenXeId: formData.routeId,
        thoiGianKhoiHanh: formData.startTime
      };

      if (modalType === 'add') {
        await adminApi.createTrip(payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã tạo chuyến xe mới!', timer: 1500, showConfirmButton: false });
      } else {
        await adminApi.updateTrip(formData.id, payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật chuyến xe!', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra.';
      Swal.fire({ icon: 'error', title: 'Lỗi', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to find route details by ID
  const getRouteDetails = (routeId) => {
    if (!routeId) return null;
    const id = typeof routeId === 'object' ? routeId._id : routeId;
    return routes.find(r => r._id === id) || (typeof routeId === 'object' ? routeId : null);
  };

  // Helper function to find vehicle details by ID
  const getVehicleDetails = (vehicleId) => {
    if (!vehicleId) return null;
    const id = typeof vehicleId === 'object' ? vehicleId._id : vehicleId;
    return vehicles.find(v => v._id === id) || (typeof vehicleId === 'object' ? vehicleId : null);
  };

  // Get unique vehicle types for filtering
  const vehicleTypes = [...new Set(vehicles.map(v => v.loaiXe))];

  const filteredTrips = trips.filter(t => {
    const route = getRouteDetails(t.tuyenXeId);
    const routeName = route ? `${route.diemDi} - ${route.diemDen}` : '';
    const matchSearch = (t._id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        routeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || t.trangThai === statusFilter;
    const matchRoute = routeFilter === '' || (t.tuyenXeId?._id || t.tuyenXeId) === routeFilter;
    const matchDate = dateFilter === '' || (t.thoiGianKhoiHanh && t.thoiGianKhoiHanh.includes(dateFilter));
    return matchSearch && matchStatus && matchRoute && matchDate;
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrips = filteredTrips.slice(indexOfFirstItem, indexOfLastItem);

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Quản lý Chuyến Xe</h2>
      </div>

      <div className="quan-ly-chuyen-container">
        {/* Filters and Actions */}
        <div className="qlc-header-actions">
          <div className="qlc-filters">
            <input 
              type="text" 
              className="qlc-filter-input" 
              placeholder="Tìm mã chuyến, tên tuyến..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="qlc-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="active">Chờ khởi hành</option>
              <option value="running">Đang chạy</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select 
              className="qlc-filter-select"
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
            >
              <option value="">Tất cả tuyến đường</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.diemDi} → {r.diemDen}</option>
              ))}
            </select>
            <input 
              type="date" 
              className="qlc-filter-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div>
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Thêm Chuyến Mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Chuyến</th>
                <th>Tuyến</th>
                <th>Biển Số Xe</th>
                <th>Loại Xe</th>
                <th>Khởi Hành</th>
                <th>Dự Kiến Đến</th>
                                 <th>Vé Đã Đặt</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
              ) : currentTrips.length > 0 ? currentTrips.map((trip) => {
                const route = getRouteDetails(trip.tuyenXeId);
                const vehicle = getVehicleDetails(trip.xeId);
                
                return (
                  <tr key={trip._id}>
                    <td data-label="Mã Chuyến"><strong>{trip._id.slice(-6).toUpperCase()}</strong></td>
                    <td data-label="Tuyến" style={{ color: '#1565C0', fontWeight: 'bold' }}>
                      {route ? `${route.diemDi} → ${route.diemDen}` : 'Lỗi dữ liệu tuyến'}
                    </td>
                    <td data-label="Biển Số">{vehicle?.bienSo || 'N/A'}</td>
                    <td data-label="Loại Xe" style={{ fontSize: '13px' }}>{vehicle?.loaiXe || 'N/A'}</td>
                    <td data-label="Khởi Hành" style={{ fontSize: '13px' }}>{formatDateTime(trip.thoiGianKhoiHanh)}</td>
                    <td data-label="Dự Kiến Đến" style={{ fontSize: '13px' }}>{formatDateTime(trip.thoiGianDen)}</td>
                     <td data-label="Vé Đã Đặt">
                       {(() => {
                         const vInfo = getVehicleDetails(trip.xeId);
                         const total = trip.tongSoGhe || vInfo?.tongSoGhe || '—';
                         const booked = trip.tongSoGhe ? (trip.tongSoGhe - (trip.tongSoGheTrong ?? (trip.tongSoGhe - (trip.gheDaDat?.length || 0)))) : (trip.gheDaDat?.length || 0);
                         return <span><strong>{booked}</strong>/{total}</span>;
                       })()}
                     </td>
                    <td data-label="Trạng Thái">
                      <span className={`status-badge ${getStatusClass(trip.trangThai)}`}>
                        {getStatusText(trip.trangThai)}
                      </span>
                    </td>
                    <td data-label="Thao Tác">
                      <div className="action-btns">
                        {trip.trangThai === 'active' && (
                          <>
                            <button className="btn-action btn-edit" onClick={() => handleAction(trip, 'edit')} title="Chỉnh sửa">Sửa</button>
                            <button className="btn-action btn-delete" onClick={() => handleAction(trip, 'cancel')} title="Hủy chuyến" style={{background:'#ef4444',color:'#fff'}}>Hủy</button>
                            <button className="btn-action btn-delete" onClick={() => handleAction(trip, 'delete')} title="Xóa chuyến"><FaTrashAlt /></button>
                          </>
                        )}
                        {trip.trangThai === 'running' && (
                          <>
                            <button className="btn-action btn-view" onClick={() => handleAction(trip, 'view')} title="Xem chi tiết"><FaEye /></button>
                            <button className="btn-action btn-delete" onClick={() => handleAction(trip, 'cancel')} title="Hủy chuyến" style={{background:'#ef4444',color:'#fff'}}>Hủy</button>
                          </>
                        )}
                        {(trip.trangThai === 'completed' || trip.trangThai === 'cancelled') && (
                          <button className="btn-action btn-view" onClick={() => handleAction(trip, 'view')} title="Xem chi tiết"><FaEye /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy chuyến nào phù hợp.</td>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: modalType === 'view' ? '600px' : '500px' }}>
            <div className="modal-header">
              <h3>
                {modalType === 'add' ? 'Thêm Chuyến Mới' : 
                 modalType === 'edit' ? 'Chỉnh Sửa Chuyến' : 'Chi Tiết Chuyến'}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'view' && selectedTrip ? (
                <div className="trip-view-details">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <p><strong>Mã Chuyến:</strong> {selectedTrip._id}</p>
                    <p><strong>Tuyến:</strong> {selectedTrip.tuyenXeId?.diemDi} → {selectedTrip.tuyenXeId?.diemDen}</p>
                    <p><strong>Xe:</strong> {selectedTrip.xeId?.bienSo} ({selectedTrip.xeId?.loaiXe})</p>
                    <p><strong>Khởi Hành:</strong> {formatDateTime(selectedTrip.thoiGianKhoiHanh)}</p>
                    <p><strong>Dự Kiến Đến:</strong> {formatDateTime(selectedTrip.thoiGianDen)}</p>
                    <p><strong>Số Ghế Tổng:</strong> {selectedTrip.tongSoGhe}</p>
                    <p><strong>Số Ghế Đã Đặt:</strong> {selectedTrip.tongSoGheDaDat || selectedTrip.gheDaDat?.length || 0}</p>
                    <p><strong>Trạng Thái:</strong> <span className={`status-badge ${getStatusClass(selectedTrip.trangThai)}`}>{getStatusText(selectedTrip.trangThai)}</span></p>
                  </div>
                </div>
              ) : (
                <form id="trip-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Chọn Tuyến Xe</label>
                    <Select
                      options={routes.map(r => ({
                        value: r._id,
                        label: `${r.diemDi} → ${r.diemDen} (${r.giaVe.toLocaleString()}đ)`
                      }))}
                      value={routes.find(r => r._id === formData.routeId) ? {
                        value: formData.routeId,
                        label: `${getRouteDetails(formData.routeId)?.diemDi} → ${getRouteDetails(formData.routeId)?.diemDen} (${getRouteDetails(formData.routeId)?.giaVe?.toLocaleString()}đ)`
                      } : null}
                      onChange={(opt) => setFormData({...formData, routeId: opt.value})}
                      placeholder="Tìm kiếm tuyến đường..."
                      isSearchable={true}
                      classNamePrefix="react-select"
                      noOptionsMessage={() => "Không tìm thấy tuyến nào"}
                    />
                  </div>
                   <div className="form-group">
                     <label>Chọn Xe Vận Hành (Đúng tuyến & Đang rảnh)</label>
                     <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                       <option value="" disabled>
                         {!formData.routeId ? 'Vui lòng chọn tuyến trước' : 'Chọn xe phù hợp'}
                       </option>
                       {availableVehicles.map(v => (
                           <option key={v._id} value={v._id}>{v.bienSo} ({v.loaiXe}) - {v.tongSoGhe} ghế</option>
                         ))}
                     </select>
                     {formData.routeId && availableVehicles.length === 0 && (
                       <p style={{fontSize: '12px', color: '#ef4444', marginTop: '5px'}}>
                         Không có xe nào đang rảnh cho tuyến này!
                       </p>
                     )}
                   </div>
                  <div className="form-group">
                    <label>Giờ Khởi Hành</label>
                    <input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>Đóng</button>
              {modalType !== 'view' && (
                <button type="submit" form="trip-form" className="btn-submit" style={{ backgroundColor: '#1565C0' }} disabled={isLoading}>
                  {isLoading ? 'Đang lưu...' : 'Lưu Chuyến'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyChuyen;
