import React, { useState, useEffect, useRef } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import Swal from 'sweetalert2';
import authApi from '../../api/authApi';
import './TaiKhoan.css';
import { authStorage } from '../../utils/authStorage';

const TaiKhoan = () => {
  const [formData, setFormData] = useState({
    hoTen: '',
    soDienThoai: '',
    email: '',
    gioiTinh: '',
    ngaySinh: '',
    diaChi: '',
    ngheNghiep: ''
  });
  
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState('https://via.placeholder.com/150');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // Ưu tiên lấy từ LocalStorage trước để hiện nhanh cho người dùng
    const userData = authStorage.getUser();
    if (userData) {
      setFormData(prev => ({
        ...prev,
        hoTen: userData.hoTen || userData.name || userData.displayName || '',
        soDienThoai: userData.soDienThoai || userData.phone || '',
        email: userData.email || '',
        gioiTinh: userData.gioiTinh || '',
        ngaySinh: userData.ngaySinh ? userData.ngaySinh.slice(0, 10) : '',
        diaChi: userData.diaChi || '',
        ngheNghiep: userData.ngheNghiep || ''
      }));
      if (userData.avatar) setAvatarPreview(userData.avatar);
    }

    try {
      const res = await authApi.getMe();
      const user = res?.data || res?.user || res;
      if (user && (user.hoTen || user.name || user.soDienThoai || user.phone)) {
        setFormData({
          hoTen: user.hoTen || user.name || user.displayName || '',
          soDienThoai: user.soDienThoai || user.phone || '',
          email: user.email || '',
          gioiTinh: user.gioiTinh || '',
          ngaySinh: user.ngaySinh ? user.ngaySinh.slice(0, 10) : '',
          diaChi: user.diaChi || '',
          ngheNghiep: user.ngheNghiep || ''
        });
        if (user.avatar) setAvatarPreview(user.avatar);
        // Cập nhật lại Storage để đồng bộ Header
        authStorage.setUser(user);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin từ API:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        return Swal.fire('Lỗi', 'Dung lượng file tối đa là 1MB', 'error');
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Chỉ gửi các trường khách hàng nhập, KHÔNG gửi _id hay role
      const updateData = {
        hoTen: formData.hoTen,
        email: formData.email,
        diaChi: formData.diaChi,
        gioiTinh: formData.gioiTinh,
        ngaySinh: formData.ngaySinh,
        ngheNghiep: formData.ngheNghiep
      };

      let payload = updateData;
      // Nếu có ảnh, sử dụng FormData
      if (avatarFile) {
        payload = new FormData();
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
            payload.append(key, updateData[key]);
          }
        });
        payload.append('avatar', avatarFile);
      }

      const res = await authApi.updateProfile(payload);
      const user = res.data || res;
      authStorage.setUser(user);
      if (user.avatar) setAvatarPreview(user.avatar);
      window.dispatchEvent(new Event('storage'));
      
      Swal.fire('Thành công', 'Cập nhật thông tin thành công!', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || (typeof error === 'string' ? error : 'Không thể cập nhật thông tin.');
      Swal.fire('Lỗi', msg, 'error');
    }
  };

  return (
    <div className="account-page-wrapper">
      <div className="account-page-container">
        <AccountSidebar activeTab="tai-khoan" />
        
        <div className="account-content">
          <h2 className="content-title">Thông tin tài khoản</h2>
          <p className="content-subtitle">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          
          <div className="profile-container">
            <div className="profile-avatar-section">
              <div className="avatar-preview">
                <img src={avatarPreview} alt="Avatar" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/png, image/jpeg, image/jpg" 
                style={{ display: 'none' }} 
              />
              <button type="button" className="btn-choose-avatar" onClick={handleAvatarClick}>Chọn ảnh</button>
              <p className="avatar-hint">
                Dung lượng file tối đa 1 MB Định dạng: .JPEG, .PNG
              </p>
            </div>
            
            <div className="profile-form-section">
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group-row">
                  <label>Họ và tên</label>
                  <span className="colon-separator">:</span>
                  <input type="text" name="hoTen" value={formData.hoTen} onChange={handleChange} required />
                </div>
                
                <div className="form-group-row">
                  <label>Số điện thoại</label>
                  <span className="colon-separator">:</span>
                  <input type="tel" name="soDienThoai" value={formData.soDienThoai} readOnly className="readonly-input" />
                </div>
                
                <div className="form-group-row">
                  <label>Giới tính</label>
                  <span className="colon-separator">:</span>
                  <select name="gioiTinh" value={formData.gioiTinh} onChange={handleChange}>
                    <option value="" disabled>Chọn giới tính</option>
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                </div>
                
                <div className="form-group-row">
                  <label>Email</label>
                  <span className="colon-separator">:</span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                
                <div className="form-group-row">
                  <label>Ngày sinh</label>
                  <span className="colon-separator">:</span>
                  <input type="date" name="ngaySinh" value={formData.ngaySinh} onChange={handleChange} />
                </div>
                
                <div className="form-group-row">
                  <label>Địa chỉ</label>
                  <span className="colon-separator">:</span>
                  <input type="text" name="diaChi" value={formData.diaChi} onChange={handleChange} />
                </div>
                
                <div className="form-group-row">
                  <label>Nghề nghiệp</label>
                  <span className="colon-separator">:</span>
                  <input type="text" name="ngheNghiep" value={formData.ngheNghiep} onChange={handleChange} />
                </div>
                
                <div className="form-submit-container">
                  <button type="submit" className="btn-save-profile">Cập nhật</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaiKhoan;
