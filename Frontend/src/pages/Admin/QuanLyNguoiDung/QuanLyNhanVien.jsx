import React, { useState } from 'react';
import '../AdminShared.css';
import './QuanLyNhanVien.css';
import { FaPlus, FaEdit, FaUserTimes, FaEye } from 'react-icons/fa';
import Swal from 'sweetalert2';
import adminApi from '../../../api/adminApi';

// Quản lý nhân viên - Đã kết nối API thật

const QuanLyNhanVien = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'view'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', phone: '', email: '', startDate: '' });

  const fetchEmployees = async () => {
    try {
      const data = await adminApi.getStaff();
      console.log('Staff API Response:', data);
      
      const staffArray = Array.isArray(data) ? data : (data.doc || data.staff || []);
      
      const mapped = staffArray.map(s => ({
        id: s._id || s.id,
        name: s.hoTen || s.name,
        phone: s.soDienThoai || s.phone,
        email: s.email,
        startDate: s.createdAt ? s.createdAt.split('T')[0] : (s.startDate || ''),
        status: s.trangThai === 'active' || s.status === 'Đang làm việc' ? 'Đang làm việc' : 'Đã nghỉ việc'
      }));
      setEmployees(mapped);
    } catch (err) {
      console.error('Error fetching staff:', err);
      Swal.fire('Lỗi kết nối!', `Không thể tải danh sách nhân viên. Chi tiết: ${err.message || err}`, 'error');
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const getStatusClass = (status) => {
    return status === 'Đang làm việc' ? 'status-working' : 'status-left';
  };

  const handleAction = (employee, action) => {
    if (action === 'edit') {
      setFormData({ id: employee.id, name: employee.name, phone: employee.phone, email: employee.email || '', startDate: employee.startDate });
      setModalType('edit');
      setIsModalOpen(true);
    } else if (action === 'fire') {
      Swal.fire({
        title: `Cho ${employee.name} nghỉ việc?`,
        text: 'Hành động này sẽ khóa quyền truy cập hệ thống của nhân viên.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await adminApi.updateStaff(employee.id, { trangThai: 'inactive' });
            Swal.fire({ icon: 'success', title: 'Hoàn tất', text: `Đã cập nhật trạng thái cho ${employee.name}.`, timer: 1800, showConfirmButton: false });
            fetchEmployees();
          } catch (err) {
            Swal.fire('Lỗi', 'Không thể cập nhật trạng thái nhân viên.', 'error');
          }
        }
      });
    } else if (action === 'view') {
      setSelectedEmployee(employee);
      setModalType('view');
      setIsModalOpen(true);
    }
  };

  const openAddModal = () => {
    setFormData({ id: '', name: '', phone: '', email: '', startDate: '' });
    setModalType('add');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (modalType === 'add') {
        const payload = {
          hoTen: formData.name,
          email: formData.email,
          soDienThoai: formData.phone
        };
        await adminApi.createStaff(payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã thêm nhân viên mới!', timer: 1500, showConfirmButton: false });
        fetchEmployees(); // Refresh list
      } else {
        const payload = {
          hoTen: formData.name,
          email: formData.email,
          soDienThoai: formData.phone
        };
        await adminApi.updateStaff(formData.id, payload);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin!', timer: 1500, showConfirmButton: false });
        fetchEmployees();
      }
      setIsModalOpen(false);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Có lỗi xảy ra khi thực hiện.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Quản lý Nhân Viên</h2>
      </div>

      <div className="quan-ly-nhan-vien-container">
        <div className="qlnv-header-actions">
          <div className="qlnv-filters">
            <input 
              type="text" 
              className="qlnv-filter-input" 
              placeholder="Tìm kiếm theo mã nhân viên hoặc họ tên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="qlnv-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang làm việc">Đang làm việc</option>
              <option value="Đã nghỉ việc">Đã nghỉ việc</option>
            </select>
          </div>
          <div>
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Thêm Nhân Viên Mới
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Nhân Viên</th>
                <th>Họ Tên</th>
                <th>Số Điện Thoại</th>
                <th>Ngày Vào Làm</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.length > 0 ? currentEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td><strong>{employee.id}</strong></td>
                  <td style={{ color: '#1565C0', fontWeight: 'bold' }}>{employee.name}</td>
                  <td>{employee.phone}</td>
                  <td>{employee.startDate}</td>
                  <td><span className={`status-badge ${getStatusClass(employee.status)}`}>{employee.status}</span></td>
                  <td>
                    {employee.status === 'Đang làm việc' ? (
                      <>
                        <button className="btn-action btn-edit" onClick={() => handleAction(employee, 'edit')} title="Chỉnh sửa"><FaEdit /> Sửa</button>
                        <button className="btn-action btn-fire" onClick={() => handleAction(employee, 'fire')} title="Cho nghỉ việc"><FaUserTimes /> Cho nghỉ</button>
                      </>
                    ) : (
                      <button className="btn-action btn-view" onClick={() => handleAction(employee, 'view')} title="Xem chi tiết"><FaEye /> Chi tiết</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy nhân viên nào phù hợp.</td>
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
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>
                {modalType === 'add' ? 'Thêm Nhân Viên' : 
                 modalType === 'edit' ? 'Chỉnh Sửa Thông Tin' : 'Chi Tiết Nhân Viên'}
              </h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'view' && selectedEmployee ? (
                <div>
                  <p><strong>Mã Nhân Viên:</strong> {selectedEmployee.id}</p>
                  <p><strong>Họ Tên:</strong> {selectedEmployee.name}</p>
                  <p><strong>Số Điện Thoại:</strong> {selectedEmployee.phone}</p>
                  <p><strong>Ngày Vào Làm:</strong> {selectedEmployee.startDate}</p>
                  <p><strong>Trạng Thái:</strong> <span className={`status-badge ${getStatusClass(selectedEmployee.status)}`}>{selectedEmployee.status}</span></p>
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffebee', borderLeft: '4px solid #f44336', color: '#c62828' }}>
                    Tài khoản của nhân viên này đã bị thu hồi quyền truy cập.
                  </div>
                </div>
              ) : (
                <form id="employee-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Họ Tên</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nhập họ và tên" />
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Số Điện Thoại</label>
                      <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Nhập số điện thoại" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Email</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Nhập email" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Ngày Vào Làm</label>
                    <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>

                </form>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Đóng</button>
              {modalType !== 'view' && (
                <button type="submit" form="employee-form" className="btn-submit" style={{ backgroundColor: '#1565C0' }} disabled={isLoading}>
                  {isLoading ? 'Đang lưu...' : 'Lưu Thông Tin'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyNhanVien;
