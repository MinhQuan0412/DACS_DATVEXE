import React, { useState, useEffect } from 'react';
import adminApi from '../../../api/adminApi';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaEdit, FaTrash, FaTicketAlt, FaSearch, FaGift, 
  FaInfoCircle, FaCog, FaHistory, FaCalendarAlt, FaCheckCircle, FaLayerGroup 
} from 'react-icons/fa';
import '../AdminShared.css';
import './QuanLyVoucher.css';

const QuanLyVoucher = () => {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    tenVoucher: '',
    maVoucher: '',
    moTa: '',
    loaiGiamGia: 'percentage', 
    giaTriGiam: '',
    giamToiDa: 0,
    giaTriToiThieu: 0,
    ngayBatDau: new Date().toISOString().split('T')[0],
    ngayHetHan: '',
    soLuong: 100,
    choKhachHangMoi: false,
    luotDungToiDaMoiNguoi: 1,
    apDungTuyen: 'all',
    tuyenXeDuocApDung: [],
    trangThai: 'active'
  });
  
  const [routes, setRoutes] = useState([]);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getVouchers();
      setVouchers(res.data || res);
    } catch (err) {
      console.error('Lỗi lấy vouchers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await adminApi.getRoutes();
      setRoutes(res.data || res);
    } catch (err) {
      console.error('Lỗi lấy danh sách tuyến:', err);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchRoutes();
  }, []);

  const handleOpenModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        tenVoucher: voucher.tenVoucher || '',
        maVoucher: voucher.maVoucher,
        moTa: voucher.moTa,
        loaiGiamGia: voucher.loaiGiamGia || 'percentage',
        giaTriGiam: voucher.giaTriGiam,
        giamToiDa: voucher.giamToiDa || 0,
        giaTriToiThieu: voucher.giaTriToiThieu || 0,
        ngayBatDau: voucher.ngayBatDau ? new Date(voucher.ngayBatDau).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        ngayHetHan: voucher.ngayHetHan ? new Date(voucher.ngayHetHan).toISOString().split('T')[0] : '',
        soLuong: voucher.soLuong || 0,
        choKhachHangMoi: voucher.choKhachHangMoi || false,
        luotDungToiDaMoiNguoi: voucher.luotDungToiDaMoiNguoi || 1,
        apDungTuyen: voucher.apDungTuyen || 'all',
        tuyenXeDuocApDung: voucher.tuyenXeDuocApDung || [],
        trangThai: voucher.trangThai || 'active'
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        tenVoucher: '',
        maVoucher: '',
        moTa: '',
        loaiGiamGia: 'percentage',
        giaTriGiam: '',
        giamToiDa: 0,
        giaTriToiThieu: 0,
        ngayBatDau: new Date().toISOString().split('T')[0],
        ngayHetHan: '',
        soLuong: 100,
        choKhachHangMoi: false,
        luotDungToiDaMoiNguoi: 1,
        apDungTuyen: 'all',
        tuyenXeDuocApDung: [],
        trangThai: 'active'
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData,
        giaTriGiam: Number(formData.giaTriGiam),
        giamToiDa: Number(formData.giamToiDa || 0),
        giaTriToiThieu: Number(formData.giaTriToiThieu || 0),
        soLuong: Number(formData.soLuong || 0),
        luotDungToiDaMoiNguoi: Number(formData.luotDungToiDaMoiNguoi || 1)
      };
      
      if (payload.choKhachHangMoi) {
        payload.soLuong = 999999; 
        payload.ngayHetHan = null; 
      }
      
      // Chuyển đổi ngày sang định dạng ISO 8601
      if (payload.ngayBatDau) {
        payload.ngayBatDau = new Date(payload.ngayBatDau).toISOString();
      }
      if (payload.ngayHetHan) {
        payload.ngayHetHan = new Date(payload.ngayHetHan).toISOString();
      }
      
      // Xóa các trường rỗng/null (trừ những trường cần thiết)
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === "") {
          delete payload[key];
        }
      });

      if (editingVoucher) {
        await adminApi.updateVoucher(editingVoucher._id, payload);
        Swal.fire('Thành công', 'Đã cập nhật mã giảm giá', 'success');
      } else {
        await adminApi.createVoucher(payload);
        Swal.fire('Thành công', 'Đã tạo mã giảm giá mới', 'success');
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      console.error("Lỗi lưu voucher:", err);
      const msg = err.message || err.error || (typeof err === 'string' ? err : 'Không thể lưu voucher');
      Swal.fire('Lỗi', msg, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Xóa mã giảm giá?',
      text: 'Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Xác nhận xóa'
    });

    if (result.isConfirmed) {
      try {
        await adminApi.deleteVoucher(id);
        Swal.fire('Đã xóa', 'Voucher đã được gỡ bỏ.', 'success');
        fetchVouchers();
      } catch (err) {
        Swal.fire('Lỗi', 'Không thể xóa voucher', 'error');
      }
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.maVoucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.moTa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.trangThai === 'active' && (!v.ngayHetHan || new Date(v.ngayHetHan) > new Date())).length,
    expired: vouchers.filter(v => (v.ngayHetHan && new Date(v.ngayHetHan) < new Date()) || v.trangThai === 'inactive').length
  };

  return (
    <div className="w-voucher-page fade-in">
      <div className="w-page-header">
        <div className="header-title">
          <div className="title-icon-box">
             <FaGift />
          </div>
          <div>
            <h1>Quản Lý Voucher</h1>
            <p>Thiết lập các chương trình ưu đãi cho hành khách</p>
          </div>
        </div>
        <button className="w-btn-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Thêm Mã Mới
        </button>
      </div>

      <div className="w-voucher-stats-modern">
         <div className="v-stat-card-new">
            <div className="v-stat-icon bg-soft-blue"><FaTicketAlt /></div>
            <div className="v-stat-details">
               <span className="v-stat-label">Tổng số mã</span>
               <span className="v-stat-count">{stats.total}</span>
            </div>
         </div>
         <div className="v-stat-card-new">
            <div className="v-stat-icon bg-soft-green"><FaCheckCircle /></div>
            <div className="v-stat-details">
               <span className="v-stat-label">Đang hoạt động</span>
               <span className="v-stat-count">{stats.active}</span>
            </div>
         </div>
         <div className="v-stat-card-new">
            <div className="v-stat-icon bg-soft-orange"><FaHistory /></div>
            <div className="v-stat-details">
               <span className="v-stat-label">Đã hết hạn</span>
               <span className="v-stat-count">{stats.expired}</span>
            </div>
         </div>
      </div>

      <div className="w-card voucher-container-card">
         <div className="container-header">
            <div className="modern-search-minimal">
               <FaSearch className="search-icon" />
               <input 
                  type="text" 
                  placeholder="Tìm theo tên hoặc mã voucher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <div className="w-table-wrapper">
            <table className="w-table-modern-minimal">
               <thead>
                  <tr>
                     <th>Mã Voucher</th>
                     <th>Chương Trình</th>
                     <th>Loại Giảm</th>
                     <th>Mức Giảm</th>
                     <th>Đơn Tối Thiểu</th>
                     <th>Số Lượng</th>
                     <th>Trạng Thái</th>
                     <th>Hành Động</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr><td colSpan="8" className="text-center">Đang tải...</td></tr>
                  ) : filteredVouchers.length === 0 ? (
                     <tr><td colSpan="8" className="text-center">Chưa có mã giảm giá</td></tr>
                  ) : filteredVouchers.map(v => {
                     const isExpired = v.ngayHetHan && new Date(v.ngayHetHan) < new Date();
                     return (
                        <tr key={v._id}>
                           <td><span className="v-code-badge">{v.maVoucher}</span></td>
                           <td>
                               <div className="v-name"><strong>{v.tenVoucher}</strong></div>
                               <div className="v-description" style={{fontSize: '12px', color: '#64748b'}}>{v.moTa}</div>
                            </td>
                           <td>{v.loaiGiamGia === 'percentage' ? 'Phần trăm' : 'Tiền mặt'}</td>
                           <td><strong className="v-value-text">{(v.giaTriGiam || 0).toLocaleString()}{v.loaiGiamGia === 'percentage' ? '%' : 'đ'}</strong></td>
                           <td>{(v.giaTriToiThieu || 0).toLocaleString()}đ</td>
                           <td>{v.soLuong || 0}</td>
                           <td>
                              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                 {v.choKhachHangMoi && <span className="v-status-badge" style={{background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5'}}>Khách mới</span>}
                                 <span className={`v-status-badge ${isExpired ? 'expired' : 'active'}`}>
                                                                         {isExpired ? 'Hết hạn' : 'Đang hoạt động'}
                                 </span>
                              </div>
                           </td>
                           <td className="w-actions">
                              <button className="v-btn-action edit" onClick={() => handleOpenModal(v)}><FaEdit/></button>
                              <button className="v-btn-action delete" onClick={() => handleDelete(v._id)}><FaTrash/></button>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modern Segmented Modal (Shopee-like Structure) */}
      {showModal && (
        <div className="w-modal-overlay">
          <div className="w-modal-content premium-modal fade-in">
            <div className="premium-modal-header">
               <div className="header-left">
                  <FaGift className="header-icon" />
                  <h3>{editingVoucher ? 'Cập Nhật Voucher' : 'Thiết Lập Mã Giảm Giá'}</h3>
               </div>
               <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="premium-form">
               <div className="form-sections-container">
                  
                  <div className="p-form-section">
                     <div className="p-section-title">
                        <FaInfoCircle /> <span>Thông tin cơ bản</span>
                     </div>
                     <div className="p-section-content">
                        <div className="p-input-group">
                           <label>Tên chương trình (Hiển thị cho khách)</label>
                           <input 
                              type="text" 
                              placeholder="Vd: Giảm giá hè 2026"
                              value={formData.tenVoucher}
                              onChange={(e) => setFormData({...formData, tenVoucher: e.target.value})}
                              required
                           />
                        </div>
                        <div className="p-input-group">
                           <label>Mô tả ngắn gọn</label>
                           <input 
                              type="text" 
                              placeholder="Vd: Giảm 10% cho tất cả các tuyến"
                              value={formData.moTa}
                              onChange={(e) => setFormData({...formData, moTa: e.target.value})}
                              required
                           />
                        </div>
                        <div className="p-grid-2">
                           <div className="p-input-group">
                              <label>Mã Voucher (In hoa, 3-10 ký tự)</label>
                              <input 
                                 type="text" 
                                 placeholder="Vd: HE2026"
                                 value={formData.maVoucher}
                                 onChange={(e) => setFormData({...formData, maVoucher: e.target.value.toUpperCase()})}
                                 maxLength={10}
                                 required
                                 disabled={!!editingVoucher}
                              />
                           </div>
                           <div className="p-input-group">
                              <label>Trạng thái</label>
                              <select 
                                 value={formData.trangThai}
                                 onChange={(e) => setFormData({...formData, trangThai: e.target.value})}
                                 className="w-select-modern"
                              >
                                 <option value="active">Đang hoạt động</option>
                                 <option value="inactive">Tạm ngưng</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Thiết lập (Cấu trúc Radio như Shopee) */}
                  <div className="p-form-section">
                     <div className="p-section-title">
                        <FaCog /> <span>Thiết lập mã giảm giá</span>
                     </div>
                     <div className="p-section-content">
                        <div className="p-input-group">
                           <label>Loại giảm giá</label>
                           <div className="p-radio-options">
                              <label className={`p-radio-item ${formData.loaiGiamGia === 'percentage' ? 'active' : ''}`}>
                                 <input 
                                    type="radio" 
                                    name="loaiGiamGia" 
                                    checked={formData.loaiGiamGia === 'percentage'} 
                                    onChange={() => setFormData({...formData, loaiGiamGia: 'percentage'})}
                                 />
                                 <span>Theo Phần Trăm (%)</span>
                              </label>
                              <label className={`p-radio-item ${formData.loaiGiamGia === 'fixed' ? 'active' : ''}`}>
                                 <input 
                                    type="radio" 
                                    name="loaiGiamGia" 
                                    checked={formData.loaiGiamGia === 'fixed'} 
                                    onChange={() => setFormData({...formData, loaiGiamGia: 'fixed'})}
                                 />
                                 <span>Số Tiền Cố Định (đ)</span>
                              </label>
                           </div>
                        </div>

                        <div className="p-grid-2">
                           <div className="p-input-group">
                              <label>Mức giảm ({formData.loaiGiamGia === 'percentage' ? '%' : 'đ'})</label>
                              <input 
                                 type="number" 
                                 placeholder="0"
                                 value={formData.giaTriGiam}
                                 onChange={(e) => setFormData({...formData, giaTriGiam: e.target.value})}
                                 required
                              />
                           </div>
                           <div className={`p-input-group ${formData.loaiGiamGia !== 'percentage' ? 'p-disabled-logic' : ''}`}>
                              <label>Giảm tối đa (đ) {formData.loaiGiamGia !== 'percentage' && <span className="p-na-badge">N/A</span>}</label>
                              <input 
                                 type="number" 
                                 placeholder={formData.loaiGiamGia === 'percentage' ? "Vd: 50,000" : "Không áp dụng"}
                                 value={formData.loaiGiamGia === 'percentage' ? formData.giamToiDa : ''}
                                 onChange={(e) => setFormData({...formData, giamToiDa: e.target.value})}
                                 disabled={formData.loaiGiamGia !== 'percentage'}
                              />
                           </div>
                        </div>
                        <div className="p-input-group">
                           <label>Đơn hàng tối thiểu (đ)</label>
                           <input 
                              type="number" 
                              placeholder="0"
                              value={formData.giaTriToiThieu}
                              onChange={(e) => setFormData({...formData, giaTriToiThieu: e.target.value})}
                              required
                           />
                        </div>
                     </div>
                  </div>

                  {/* Section 3: Giới hạn */}
                  <div className="p-form-section">
                     <div className="p-section-title">
                        <FaLayerGroup /> <span>Giới hạn & Hiển thị</span>
                     </div>
                     <div className="p-section-content">
                        <div className="p-input-group">
                           <label className="p-checkbox-item">
                              <input 
                                 type="checkbox" 
                                 checked={formData.choKhachHangMoi}
                                 onChange={(e) => setFormData({...formData, choKhachHangMoi: e.target.checked})}
                              />
                              <span>Chỉ dành cho khách hàng mới (Chưa từng mua vé)</span>
                           </label>
                        </div>
                        <div className={`p-grid-2 ${formData.choKhachHangMoi ? 'p-disabled' : ''}`}>
                           <div className="p-input-group">
                              <label>Số lượng phát hành {formData.choKhachHangMoi && '(Vô hạn)'}</label>
                              <input 
                                 type="number" 
                                 value={formData.choKhachHangMoi ? 0 : formData.soLuong}
                                 onChange={(e) => setFormData({...formData, soLuong: e.target.value})}
                                 required={!formData.choKhachHangMoi}
                                 disabled={formData.choKhachHangMoi}
                              />
                           </div>
                           <div className="p-input-group">
                              <label>Lượt dùng/Khách hàng</label>
                              <input 
                                 type="number" 
                                 value={formData.luotDungToiDaMoiNguoi}
                                 onChange={(e) => setFormData({...formData, luotDungToiDaMoiNguoi: e.target.value})}
                                 required
                                 min="1"
                              />
                           </div>
                        </div>
                        <div className="p-grid-2">
                           <div className="p-input-group">
                              <label>Ngày bắt đầu</label>
                              <input 
                                 type="date" 
                                 value={formData.ngayBatDau}
                                 onChange={(e) => setFormData({...formData, ngayBatDau: e.target.value})}
                                 required
                              />
                           </div>
                           <div className="p-input-group">
                              <label>Ngày hết hạn {formData.choKhachHangMoi && '(Vĩnh viễn)'}</label>
                              <input 
                                 type="date" 
                                 value={formData.choKhachHangMoi ? '' : formData.ngayHetHan}
                                 onChange={(e) => setFormData({...formData, ngayHetHan: e.target.value})}
                                 disabled={formData.choKhachHangMoi}
                              />
                           </div>
                        </div>

                        {/* Áp dụng tuyến xe */}
                        <div className="p-input-group">
                           <label>Phạm vi áp dụng</label>
                           <div className="p-radio-options">
                              <label className={`p-radio-item ${formData.apDungTuyen === 'all' ? 'active' : ''}`}>
                                 <input 
                                    type="radio" 
                                    name="apDungTuyen" 
                                    checked={formData.apDungTuyen === 'all'} 
                                    onChange={() => setFormData({...formData, apDungTuyen: 'all', tuyenXeDuocApDung: []})}
                                 />
                                 <span>Tất cả các tuyến</span>
                              </label>
                              <label className={`p-radio-item ${formData.apDungTuyen === 'selected' ? 'active' : ''}`}>
                                 <input 
                                    type="radio" 
                                    name="apDungTuyen" 
                                    checked={formData.apDungTuyen === 'selected'} 
                                    onChange={() => setFormData({...formData, apDungTuyen: 'selected'})}
                                 />
                                 <span>Tuyến xe chỉ định</span>
                              </label>
                           </div>
                        </div>

                        {formData.apDungTuyen === 'selected' && (
                           <div className="p-input-group">
                              <label>Chọn các tuyến xe được áp dụng</label>
                              <div className="p-route-filter-search" style={{marginBottom: '10px'}}>
                                 <input 
                                    type="text" 
                                    placeholder="Tìm tên tuyến để lọc..." 
                                    className="w-input-modern-small"
                                    value={routeSearchTerm}
                                    onChange={(e) => setRouteSearchTerm(e.target.value)}
                                    style={{width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                                 />
                              </div>
                              <div className="p-route-selector-grid">
                                 {Array.isArray(routes) && routes
                                    .filter(r => `${r.diemDi} ${r.diemDen}`.toLowerCase().includes(routeSearchTerm.toLowerCase()))
                                    .map(route => (
                                    <label key={route._id} className="p-route-checkbox">
                                       <input 
                                          type="checkbox"
                                          checked={formData.tuyenXeDuocApDung.includes(route._id)}
                                          onChange={(e) => {
                                             const newSelected = e.target.checked 
                                                ? [...formData.tuyenXeDuocApDung, route._id]
                                                : formData.tuyenXeDuocApDung.filter(id => id !== route._id);
                                             setFormData({...formData, tuyenXeDuocApDung: newSelected});
                                          }}
                                       />
                                       <span>{route.diemDi} - {route.diemDen}</span>
                                    </label>
                                 ))}
                                 {(!Array.isArray(routes) || routes.length === 0) && <p style={{fontSize: '12px', color: '#94a3b8', padding: '10px'}}>Không có dữ liệu tuyến xe</p>}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

               </div>

               <div className="premium-modal-footer">
                  <button type="button" className="btn-p-secondary" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                  <button type="submit" className="btn-p-primary">Lưu Voucher</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyVoucher;
