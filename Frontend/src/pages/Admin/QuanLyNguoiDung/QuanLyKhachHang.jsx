import React, { useState, useEffect } from 'react';
import '../AdminShared.css';
import './QuanLyKhachHang.css';
import { FaHistory, FaEdit, FaLock, FaUnlock, FaTrashAlt } from 'react-icons/fa';
import adminApi from '../../../api/adminApi';
import Swal from 'sweetalert2';

const QuanLyKhachHang = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'edit', 'history'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [formData, setFormData] = useState({ id: '', name: '', phone: '', email: '', status: 'active' });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getCustomers();
      console.log('Customers Response:', data);
      
      const customersArray = Array.isArray(data) ? data : (data.doc || data.customers || []);
      
      const mapped = customersArray.map(c => ({
        id: c._id,
        name: c.hoTen || 'Chưa đặt tên',
        phone: c.soDienThoai,
        email: c.email || 'Chưa có email',
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '---',
        booked: c.totalTickets || 0,
        status: c.trangThai === 'active' ? 'Đang hoạt động' : 'Đã khóa'
      }));
      setCustomers(mapped);
    } catch (err) {
      console.error('Error fetching customers:', err);
      Swal.fire('Lỗi kết nối!', `Không thể tải danh sách khách hàng. Chi tiết: ${err.message || err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getStatusClass = (status) => {
    return status === 'Đang hoạt động' ? 'status-active' : 'status-locked';
  };

  const handleAction = async (customer, action) => {
    if (action === 'history') {
      setSelectedCustomer(customer);
      setModalType('history');
      setIsModalOpen(true);
    } else if (action === 'edit') {
      setFormData({ 
        id: customer.id, 
        name: customer.name, 
        phone: customer.phone,
        email: customer.email,
        status: customer.status === 'Đang hoạt động' ? 'active' : 'inactive'
      });
      setModalType('edit');
      setIsModalOpen(true);
    } else if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc muốn xóa khách hàng ${customer.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Xóa ngay'
      });

      if (result.isConfirmed) {
        try {
          await adminApi.deleteCustomer(customer.id);
          Swal.fire('Đã xóa!', 'Khách hàng đã được xóa thành công.', 'success');
          fetchCustomers();
        } catch (err) {
          Swal.fire('Lỗi!', err.message || 'Không thể xóa khách hàng này.', 'error');
        }
      }
    } else if (action === 'lock' || action === 'unlock') {
      const newStatus = action === 'lock' ? 'inactive' : 'active';
      try {
        await adminApi.updateCustomer(customer.id, { trangThai: newStatus });
        Swal.fire('Thành công', 'Đã cập nhật trạng thái khách hàng.', 'success');
        fetchCustomers();
      } catch (err) {
        Swal.fire('Lỗi', 'Không thể cập nhật trạng thái.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        hoTen: formData.name,
        soDienThoai: formData.phone,
        email: formData.email,
        trangThai: formData.status
      };

      await adminApi.updateCustomer(formData.id, payload);
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin khách hàng!', timer: 1500, showConfirmButton: false });
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.message || 'Có lỗi xảy ra.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone || '').includes(searchTerm);
    const matchStatus = statusFilter === 'Tất cả' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safeCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Quản lý Khách Hàng</h2>
      </div>

      <div className="quan-ly-khach-hang-container">
        <div className="qlkh-header-actions">
          <div className="qlkh-filters">
            <input 
              type="text" 
              className="qlkh-filter-input" 
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="qlkh-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Đã khóa">Đã khóa</option>
            </select>
          </div>
          {/* Nút thêm đã bị xóa theo yêu cầu */}
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Họ Tên</th>
                <th>Số Điện Thoại</th>
                <th>Email</th>
                <th>Ngày Tạo</th>
                <th>Vé Đã Đặt</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
              ) : currentCustomers.length > 0 ? currentCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.id.slice(-6).toUpperCase()}</strong></td>
                  <td style={{ color: '#1565C0', fontWeight: 'bold' }}>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td style={{ fontSize: '13px' }}>{customer.email}</td>
                  <td style={{ fontSize: '13px' }}>{customer.createdAt}</td>
                  <td>
                    <span style={{ backgroundColor: '#e3f2fd', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', color: '#1565C0' }}>
                      {customer.booked} vé
                    </span>
                  </td>
                  <td><span className={`status-badge ${getStatusClass(customer.status)}`}>{customer.status}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action btn-history" onClick={() => handleAction(customer, 'history')} title="Lịch sử đặt vé"><FaHistory /></button>
                      <button className="btn-action btn-edit" onClick={() => handleAction(customer, 'edit')} title="Chỉnh sửa"><FaEdit /></button>
                      {customer.status === 'Đang hoạt động' ? (
                        <button className="btn-action btn-lock" onClick={() => handleAction(customer, 'lock')} title="Khóa tài khoản"><FaLock /></button>
                      ) : (
                        <button className="btn-action btn-unlock" onClick={() => handleAction(customer, 'unlock')} title="Mở khóa tài khoản"><FaUnlock /></button>
                      )}
                      <button className="btn-action btn-delete" onClick={() => handleAction(customer, 'delete')} title="Xóa vĩnh viễn"><FaTrashAlt /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy khách hàng nào.</td>
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
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: modalType === 'history' ? '600px' : '450px' }}>
            <div className="modal-header">
              <h3>
                {modalType === 'edit' ? 'Chỉnh Sửa Thông Tin' : 'Lịch Sử Đặt Vé'}
              </h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'history' && selectedCustomer ? (
                <div>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                    <p><strong>Khách hàng:</strong> {selectedCustomer.name}</p>
                    <p><strong>Số điện thoại:</strong> {selectedCustomer.phone}</p>
                    <p><strong>Tổng số vé:</strong> {selectedCustomer.booked}</p>
                  </div>
                  
                  <div className="ticket-history-list">
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                      (Tính năng xem chi tiết vé đang được cập nhật...)
                    </p>
                  </div>
                </div>
              ) : (
                <form id="customer-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Họ Tên</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nhập họ và tên" />
                  </div>
                  <div className="form-group">
                    <label>Số Điện Thoại</label>
                    <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Nhập số điện thoại" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Nhập email" />
                  </div>
                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Khóa tài khoản</option>
                    </select>
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Đóng</button>
              {modalType !== 'history' && (
                <button type="submit" form="customer-form" className="btn-submit" style={{ backgroundColor: '#1565C0' }} disabled={isLoading}>
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

export default QuanLyKhachHang;
