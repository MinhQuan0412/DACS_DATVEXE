import React, { useState, useEffect } from 'react';
import '../AdminShared.css';
import './QuanLyXe.css';
import { FaPlus, FaEdit, FaTrashAlt, FaWrench } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import Swal from 'sweetalert2';

const QuanLyXe = () => {
  const [buses, setBuses] = useState([]);
  const [seatSchemas, setSeatSchemas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [routes, setRoutes] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit'
  
  const [formData, setFormData] = useState({
    id: '', plate: '', type: 'Limousine Giường Nằm', schemaId: '', status: 'active', tuyenXeId: ''
  });

  const fetchBuses = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getVehicles();
      console.log('Vehicles API Response:', data);
      
      const vehiclesArray = Array.isArray(data) ? data : (data.doc || data.vehicles || []);
      
      const mapped = vehiclesArray.map(v => ({
        id: v._id,
        plate: v.bienSo,
        type: v.loaiXe,
        seats: v.tongSoGhe,
        status: v.trangThai, // 'active', 'maintenance', 'inactive'
        schema: v.soDoGheId, // This is an object in GET response
        tuyenXeId: v.tuyenXeId
      }));
      setBuses(mapped);
    } catch (err) {
      console.error('Error fetching buses:', err);
      Swal.fire('Lỗi kết nối!', `Không thể tải danh sách xe. Chi tiết: ${err.message || err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeatSchemas = async () => {
    try {
      const data = await adminApi.getSeatSchemas();
      setSeatSchemas(data || []);
    } catch (err) {
      console.error('Error fetching schemas:', err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await adminApi.getRoutes();
      const routesArray = Array.isArray(data) ? data : (data.doc || data.routes || []);
      setRoutes(routesArray);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  useEffect(() => {
    fetchBuses();
    fetchSeatSchemas();
    fetchRoutes();
  }, []);

  const getStatusText = (status) => {
    if (status === 'active') return 'Đang hoạt động';
    if (status === 'maintenance') return 'Đang bảo trì';
    if (status === 'inactive') return 'Ngừng hoạt động';
    return status;
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'status-active';
    if (status === 'maintenance') return 'status-maintenance';
    if (status === 'inactive') return 'status-inactive';
    return '';
  };

  const handleAction = async (bus, action) => {
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc chắn muốn xóa xe ${bus.plate} không?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        try {
          await adminApi.deleteVehicle(bus.id);
          Swal.fire('Đã xóa!', 'Xe đã được xóa thành công.', 'success');
          fetchBuses();
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Không thể xóa xe này vì nó đang có lịch chạy.';
          Swal.fire('Lỗi!', msg, 'error');
        }
      }
    } else if (action === 'edit') {
      setFormData({
        id: bus.id,
        plate: bus.plate,
        type: bus.type,
        schemaId: bus.schema?._id || bus.schema || '',
        status: bus.status,
        tuyenXeId: bus.tuyenXeId?._id || bus.tuyenXeId || ''
      });
      setModalType('edit');
      setIsModalOpen(true);
    } else if (action === 'update_status') {
      const result = await Swal.fire({
        title: 'Cập nhật trạng thái',
        text: 'Xác nhận xe đã bảo trì xong và chuyển sang "Đang hoạt động"?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1565C0',
        confirmButtonText: 'Xác nhận'
      });

      if (result.isConfirmed) {
        try {
          await adminApi.updateVehicle(bus.id, { ...bus, trangThai: 'active' });
          Swal.fire('Thành công', 'Trạng thái xe đã được cập nhật.', 'success');
          fetchBuses();
        } catch (err) {
          Swal.fire('Lỗi', 'Không thể cập nhật trạng thái.', 'error');
        }
      }
    }
  };

  const openAddModal = () => {
    setFormData({ id: '', plate: '', type: 'Limousine Giường Nằm', schemaId: seatSchemas[0]?._id || '', status: 'active', tuyenXeId: '' });
    setModalType('add');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        bienSo: formData.plate,
        loaiXe: formData.type,
        soDoGheId: formData.schemaId,
        trangThai: formData.status,
        tuyenXeId: formData.tuyenXeId
      };

      if (modalType === 'add') {
        await adminApi.createVehicle(payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã thêm xe mới!', timer: 1500, showConfirmButton: false });
      } else {
        await adminApi.updateVehicle(formData.id, payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin xe!', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchBuses();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra.';
      Swal.fire({ icon: 'error', title: 'Lỗi', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBuses = buses.filter(b => {
    const matchSearch = b.plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchRoute = routeFilter === 'All' || (b.tuyenXeId?._id || b.tuyenXeId) === routeFilter;
    return matchSearch && matchStatus && matchRoute;
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBuses.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBuses = filteredBuses.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Quản lý Xe</h2>
      </div>

      <div className="quan-ly-xe-container">
        {/* Filters and Actions */}
        <div className="qlx-header-actions">
          <div className="qlx-filters">
            <input 
              type="text" 
              className="qlx-filter-input" 
              placeholder="Tìm kiếm theo biển số..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="qlx-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="maintenance">Đang bảo trì</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
            <select 
               className="qlx-filter-select"
               value={routeFilter}
               onChange={(e) => setRouteFilter(e.target.value)}
             >
               <option value="All">Tất cả tuyến</option>
               {routes.map(r => (
                 <option key={r._id} value={r._id}>{r.diemDi} → {r.diemDen}</option>
               ))}
             </select>
          </div>
          <div>
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Thêm Xe Mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Biển Số</th>
                <th>Loại Xe</th>
                <th>Số Ghế</th>
                <th>Tuyến Xe</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
              ) : currentBuses.length > 0 ? currentBuses.map((bus) => (
                <tr key={bus.id}>
                  <td style={{ color: '#1565C0', fontWeight: 'bold' }}>{bus.plate}</td>
                  <td>{bus.type}</td>
                  <td>{bus.seats}</td>
                  <td style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                     {(() => {
                       const route = routes.find(r => r._id === (bus.tuyenXeId?._id || bus.tuyenXeId));
                       return route ? `${route.diemDi} → ${route.diemDen}` : 'Chưa gán tuyến';
                     })()}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(bus.status)}`}>
                      {getStatusText(bus.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action btn-edit" onClick={() => handleAction(bus, 'edit')} title="Chỉnh sửa">
                        <FaEdit />
                      </button>
                      {bus.status === 'maintenance' && (
                        <button className="btn-action btn-update" onClick={() => handleAction(bus, 'update_status')} title="Cập nhật tình trạng">
                          <FaWrench />
                        </button>
                      )}
                      <button className="btn-action btn-delete" onClick={() => handleAction(bus, 'delete')} title="Xóa">
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy xe nào phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(safeCurrentPage - 1)} 
              disabled={safeCurrentPage === 1}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button 
                key={index + 1} 
                className={`page-btn ${safeCurrentPage === index + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(safeCurrentPage + 1)} 
              disabled={safeCurrentPage === totalPages}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{modalType === 'add' ? 'Thêm Xe Mới' : 'Chỉnh Sửa Thông Tin Xe'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <form id="bus-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Biển Số Xe</label>
                  <input type="text" required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} placeholder="VD: 63B-123.45" />
                </div>

                <div className="form-group">
                  <label>Loại Xe</label>
                  <input type="text" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="VD: Limousine Giường Nằm" />
                </div>

                <div className="form-group">
                  <label>Sơ Đồ Ghế (Template)</label>
                  <select required value={formData.schemaId} onChange={e => setFormData({...formData, schemaId: e.target.value})}>
                    <option value="" disabled>Chọn sơ đồ ghế</option>
                    {seatSchemas.map(schema => (
                      <option key={schema._id} value={schema._id}>{schema.tenSoDo} ({schema.tongSoGhe} ghế)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tuyến Xe Cố Định (Bắt buộc)</label>
                  <select required value={formData.tuyenXeId} onChange={e => setFormData({...formData, tuyenXeId: e.target.value})}>
                    <option value="" disabled>Chọn tuyến xe gán cho xe này</option>
                    {routes.map(r => (
                      <option key={r._id} value={r._id}>{r.diemDi} → {r.diemDen}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng Thái</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="active">Đang hoạt động</option>
                    <option value="maintenance">Đang bảo trì</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
              <button type="submit" form="bus-form" className="btn-submit" style={{ backgroundColor: '#1565C0' }} disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu Thông Tin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyXe;
