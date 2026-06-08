import React, { useState } from 'react';
import '../AdminShared.css';
import './QuanLyTuyen.css';
import { FaPlus, FaEdit, FaTrashAlt, FaMapMarkerAlt, FaCheckCircle, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import adminApi from '../../../api/adminApi';

const emptyStop = () => ({ tenDiem: '', tinhThanh: '', diaChi: '', thuTu: 1 });

// Quản lý tuyến xe - Đã kết nối API thật

// ⚠️ Phải định nghĩa StopSection NGOÀI component QuanLyTuyen
// để tránh bị re-mount mỗi lần parent re-render (gây mất focus khi gõ)
const stopColStyle = { flex: 1, background: '#f8f9fa', padding: '14px', borderRadius: '8px', minWidth: 0 };
const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '6px', boxSizing: 'border-box' };

const StopSection = ({ type, list, label, color, onAdd, onRemove, onChange }) => (
  <div style={stopColStyle}>
    <h4 style={{ color, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
      {label}
      <button type="button" onClick={() => onAdd(type)}
        style={{ background: color, color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
        + Thêm
      </button>
    </h4>
    {list.length === 0 && <p style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>Chưa có điểm nào.</p>}
    {list.map((stop, index) => (
      <div key={index} style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <strong style={{ fontSize: '13px' }}>#{index + 1}</strong>
          <button type="button" onClick={() => onRemove(type, index)} style={{ background: 'none', border: 'none', color: '#d33', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
        <input style={inputStyle} placeholder="Tên điểm" value={stop.tenDiem} onChange={e => onChange(type, index, 'tenDiem', e.target.value)} />
        <input style={inputStyle} placeholder="Tỉnh / Thành phố" value={stop.tinhThanh} onChange={e => onChange(type, index, 'tinhThanh', e.target.value)} />
        <input style={{ ...inputStyle, marginBottom: 0 }} placeholder="Địa chỉ chi tiết" value={stop.diaChi} onChange={e => onChange(type, index, 'diaChi', e.target.value)} />
      </div>
    ))}
  </div>
);

const QuanLyTuyen = () => {
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoutes = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getRoutes();
      console.log('Routes API Response:', data); // Giúp debug dữ liệu thật
      
      // Đảm bảo data là mảng
      const routesArray = Array.isArray(data) ? data : (data.doc || data.routes || []);
      
      const mapped = routesArray.map(r => ({
        ...r,
        tenTuyen: r.tenTuyen || `${r.diemDi} - ${r.diemDen}`,
        quangDuong: r.khoangCach || r.quangDuong || '---',
        thoiGianDi: r.thoiGianDi || '---',
        // Xử lý giá vé nếu là string "250.000đ"
        giaVe: typeof r.giaVe === 'string' ? Number(r.giaVe.replace(/[^0-9]/g, '')) : (r.giaVe || 0)
      }));
      setRoutes(mapped);
    } catch (err) {
      console.error('Error fetching data:', err);
      Swal.fire('Lỗi kết nối!', `Không thể tải dữ liệu. Chi tiết: ${err.message || err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRoutes();
  }, []);

  // Main modal (add/edit route info + stops)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    _id: '', tenTuyen: '', diemDi: '', diemDen: '', quangDuong: '', thoiGianDi: '', giaVe: '', trangThai: 'active'
  });
  // Stops in-form
  const [diemDonList, setDiemDonList] = useState([]);
  const [diemTraList, setDiemTraList] = useState([]);

  const getStatusDisplay = (t) => t === 'active' ? 'Đang hoạt động' : 'Tạm ngừng';
  const getStatusClass = (t) => t === 'active' ? 'status-active' : 'status-suspended';

  const openAddModal = () => {
    setFormData({ _id: '', tenTuyen: '', diemDi: '', diemDen: '', quangDuong: '', thoiGianDi: '', giaVe: '', trangThai: 'active' });
    setDiemDonList([]);
    setDiemTraList([]);
    setModalType('add');
    setIsModalOpen(true);
  };

  const openEditModal = async (route) => {
    setFormData({
      _id: route._id,
      tenTuyen: route.tenTuyen,
      diemDi: route.diemDi,
      diemDen: route.diemDen,
      quangDuong: route.quangDuong,
      thoiGianDi: route.thoiGianDi,
      giaVe: route.giaVe,
      trangThai: route.trangThai
    });
    
    // Fetch stops from dedicated API
    try {
      const stopsData = await adminApi.getRouteStops(route._id);
      setDiemDonList(stopsData.diemDon || []);
      setDiemTraList(stopsData.diemTra || []);
    } catch (err) {
      console.error('Error fetching stops:', err);
      setDiemDonList([]);
      setDiemTraList([]);
    }
    
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        diemDi: formData.diemDi,
        diemDen: formData.diemDen,
        khoangCach: formData.quangDuong,
        thoiGianDi: formData.thoiGianDi,
        giaVe: formData.giaVe.toString().includes('đ') ? formData.giaVe : `${Number(formData.giaVe).toLocaleString('vi-VN')}đ`,
        trangThai: formData.trangThai
      };

      if (modalType === 'add') {
        const res = await adminApi.createRoute(payload);
        const newId = res.doc?._id || res._id;
        // Nếu có điểm đón/trả thì gọi API stops
        if (newId && (diemDonList.length > 0 || diemTraList.length > 0)) {
          await adminApi.updateRouteStops(newId, { diemDon: diemDonList, diemTra: diemTraList });
        }
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã thêm tuyến đường mới!', timer: 1500, showConfirmButton: false });
      } else {
        await adminApi.updateRoute(formData._id, payload);
        await adminApi.updateRouteStops(formData._id, { diemDon: diemDonList, diemTra: diemTraList });
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin tuyến!', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Có lỗi xảy ra.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (route) => {
    const newStatus = route.trangThai === 'active' ? 'inactive' : 'active';
    const result = await Swal.fire({
      title: 'Xác nhận?',
      text: `Bạn muốn ${newStatus === 'inactive' ? 'tạm ngừng' : 'kích hoạt lại'} tuyến "${route.tenTuyen}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1565C0',
      confirmButtonText: 'Đồng ý'
    });

    if (result.isConfirmed) {
      try {
        await adminApi.updateRoute(route._id, { ...route, trangThai: newStatus });
        Swal.fire('Thành công', 'Đã cập nhật trạng thái tuyến.', 'success');
        fetchRoutes();
      } catch (err) {
        // Handle specific delete/suspend error from backend
        Swal.fire('Lỗi', err.message || 'Không thể cập nhật trạng thái tuyến này.', 'error');
      }
    }
  };

  const handleDeleteRoute = async (route) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: `Bạn có chắc chắn muốn xóa tuyến "${route.tenTuyen}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Xóa ngay'
    });

    if (result.isConfirmed) {
      try {
        await adminApi.deleteRoute(route._id);
        Swal.fire('Thành công', 'Đã xóa tuyến đường.', 'success');
        fetchRoutes();
      } catch (err) {
        Swal.fire('Lỗi', err.message || 'Không thể xóa tuyến này vì vẫn còn các chuyến xe đang hoạt động.', 'error');
      }
    }
  };

  // --- Stops modal ---
  const openStopsModal = (route) => {
    setSelectedRoute(route);
    setDiemDonList(route.diemDon ? JSON.parse(JSON.stringify(route.diemDon)) : []);
    setDiemTraList(route.diemTra ? JSON.parse(JSON.stringify(route.diemTra)) : []);
    setIsStopsModalOpen(true);
  };

  const addStop = (type) => {
    const lists = { don: diemDonList, tra: diemTraList };
    const setters = { don: setDiemDonList, tra: setDiemTraList };
    const list = lists[type];
    setters[type]([...list, { ...emptyStop(), thuTu: list.length + 1 }]);
  };

  const removeStop = (type, index) => {
    const setters = { don: setDiemDonList, tra: setDiemTraList };
    const getList = { don: () => diemDonList, tra: () => diemTraList };
    const newList = getList[type]().filter((_, i) => i !== index).map((item, i) => ({ ...item, thuTu: i + 1 }));
    setters[type](newList);
  };

  const handleStopChange = (type, index, field, value) => {
    const getList = { don: () => [...diemDonList], tra: () => [...diemTraList] };
    const setters = { don: setDiemDonList, tra: setDiemTraList };
    const list = getList[type]();
    list[index][field] = value;
    setters[type](list);
  };

  const saveStops = async () => {
    try {
      await adminApi.updateRouteStops(formData._id, { diemDon: diemDonList, diemTra: diemTraList });
      Swal.fire('Thành công', 'Đã cập nhật điểm đón/trả.', 'success');
      fetchRoutes();
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể lưu điểm dừng.', 'error');
    }
  };

  // --- Filter & Pagination ---
  let filteredRoutes = routes.filter(r => {
    const matchSearch = (r.tenTuyen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.diemDi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.diemDen || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' ||
      (statusFilter === 'Đang hoạt động' && r.trangThai === 'active') ||
      (statusFilter === 'Tạm ngừng' && r.trangThai === 'inactive');
    return matchSearch && matchStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentRoutes = filteredRoutes.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);



  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Quản lý Tuyến Xe</h2>
      </div>

      <div className="quan-ly-tuyen-container">
        <div className="qlt-header-actions">
          <div className="qlt-filters">
            <input
              type="text"
              className="qlt-filter-input"
              placeholder="Tìm theo tên tuyến, điểm đi, điểm đến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="qlt-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Tạm ngừng">Tạm ngừng</option>
            </select>
          </div>
          <button className="btn-primary" onClick={openAddModal}>
            <FaPlus /> Thêm Tuyến Mới
          </button>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Tuyến</th>
                <th>Tên Tuyến</th>
                <th>Hành Trình</th>
                <th>Quãng Đường</th>
                <th>Thời Gian</th>
                <th>Giá Vé</th>
                <th>Điểm Đón/Trả</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
              ) : currentRoutes.length > 0 ? currentRoutes.map((route) => (
                  <tr key={route._id}>
                    <td data-label="Mã Tuyến"><strong>{route._id ? route._id.slice(-4).toUpperCase() : ''}</strong></td>
                    <td data-label="Tên Tuyến" style={{ color: '#1565C0', fontWeight: 'bold', maxWidth: '160px' }}>{route.tenTuyen}</td>
                    <td data-label="Hành Trình" style={{ fontSize: '13px' }}>
                      <span style={{ color: '#2e7d32' }}>▲ {route.diemDi}</span>
                      <br />
                      <span style={{ color: '#c62828' }}>▼ {route.diemDen}</span>
                    </td>
                    <td data-label="Quãng Đường">{route.quangDuong}</td>
                    <td data-label="Thời Gian">{route.thoiGianDi}</td>
                    <td data-label="Giá Vé" style={{ color: '#E53935', fontWeight: 'bold' }}>
                      {route.giaVe ? Number(route.giaVe).toLocaleString('vi-VN') + 'đ' : 'Chưa có'}
                    </td>
                    <td data-label="Điểm Đón/Trả" style={{ fontSize: '12px', color: '#555' }}>
                      <div>🟢 Đón: {(route.diemDon || []).length} điểm</div>
                      <div>🔴 Trả: {(route.diemTra || []).length} điểm</div>
                    </td>
                    <td data-label="Trạng Thái">
                      <span className={`status-badge ${getStatusClass(route.trangThai)}`}>
                        {getStatusDisplay(route.trangThai)}
                      </span>
                    </td>
                    <td data-label="Thao Tác">
                      <div className="action-btns">
                        <button className="btn-action btn-edit" onClick={() => openEditModal(route)} title="Chỉnh sửa">
                          <FaEdit />
                        </button>
                        {route.trangThai === 'active' ? (
                          <button className="btn-action btn-delete-route" onClick={() => handleToggleStatus(route)} title="Tạm ngừng">
                            <FaTrashAlt />
                          </button>
                        ) : (
                          <>
                            <button className="btn-action btn-edit" style={{ backgroundColor: '#28a745' }} onClick={() => handleToggleStatus(route)} title="Kích hoạt lại">
                              <FaCheckCircle />
                            </button>
                            <button className="btn-action btn-delete" onClick={() => handleDeleteRoute(route)} title="Xóa tuyến">
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy tuyến nào phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

      {/* Add/Edit Route Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{modalType === 'add' ? 'Thêm Tuyến Mới' : 'Chỉnh Sửa Tuyến'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="route-form" onSubmit={handleSubmit}>
                {/* ---- Thông tin cơ bản ---- */}
                <div className="form-group">
                  <label>Tên Tuyến</label>
                  <input type="text" required value={formData.tenTuyen} onChange={e => setFormData({ ...formData, tenTuyen: e.target.value })} placeholder="VD: An Giang - TP. Hồ Chí Minh" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Điểm Đi</label>
                    <input type="text" required value={formData.diemDi} onChange={e => setFormData({ ...formData, diemDi: e.target.value })} placeholder="VD: An Giang" />
                  </div>
                  <div className="form-group">
                    <label>Điểm Đến</label>
                    <input type="text" required value={formData.diemDen} onChange={e => setFormData({ ...formData, diemDen: e.target.value })} placeholder="VD: TP. Hồ Chí Minh" />
                  </div>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group">
                    <label>Quãng Đường</label>
                    <input type="text" required value={formData.quangDuong} onChange={e => setFormData({ ...formData, quangDuong: e.target.value })} placeholder="VD: 190km" />
                  </div>
                  <div className="form-group">
                    <label>Thời Gian Dự Kiến</label>
                    <input type="text" required value={formData.thoiGianDi} onChange={e => setFormData({ ...formData, thoiGianDi: e.target.value })} placeholder="VD: 5 tiếng" />
                  </div>
                  <div className="form-group">
                    <label>Giá Vé Cơ Bản (VNĐ)</label>
                    <input type="number" required value={formData.giaVe} onChange={e => setFormData({ ...formData, giaVe: e.target.value })} placeholder="VD: 250000" />
                  </div>
                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select value={formData.trangThai} onChange={e => setFormData({ ...formData, trangThai: e.target.value })}>
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Tạm ngừng</option>
                    </select>
                  </div>
                </div>

                {/* ---- Điểm Đón / Trả ---- */}
                <div style={{ borderTop: '2px dashed #e2e8f0', marginTop: '24px', paddingTop: '20px' }}>
                  <p style={{ fontWeight: '800', color: '#1e293b', marginBottom: '16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMapMarkerAlt style={{ color: '#ef4444' }} /> Điểm Đón / Trả Khách
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <StopSection type="don" list={diemDonList} label="🟢 Điểm Đón" color="#059669" onAdd={addStop} onRemove={removeStop} onChange={handleStopChange} />
                    <StopSection type="tra" list={diemTraList} label="🔴 Điểm Trả" color="#dc2626" onAdd={addStop} onRemove={removeStop} onChange={handleStopChange} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button type="submit" form="route-form" className="btn-submit" style={{ backgroundColor: '#1565C0' }} disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu Tuyến'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyTuyen;
