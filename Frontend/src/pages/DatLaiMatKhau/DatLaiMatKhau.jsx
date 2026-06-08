import React, { useState } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import Swal from 'sweetalert2';
import authApi from '../../api/authApi';
import './DatLaiMatKhau.css';

const DatLaiMatKhau = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        matKhauCu: formData.oldPassword,
        matKhauMoi: formData.newPassword,
        xacNhanMatKhauMoi: formData.confirmPassword
      });
      Swal.fire('Thành công', 'Đổi mật khẩu thành công!', 'success');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const msg = error.message || (typeof error === 'string' ? error : 'Không thể đổi mật khẩu.');
      Swal.fire('Lỗi', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="account-page-wrapper">
      <div className="account-page-container">
        <AccountSidebar activeTab="mat-khau" />
        
        <div className="account-content">
          <h2 className="content-title">Đặt lại mật khẩu</h2>
          <p className="content-subtitle">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
          
          <div className="reset-password-container">
            <form className="reset-password-form" onSubmit={handleSubmit}>
              <div className="form-group-pwd">
                <label><span>*</span> Mật khẩu cũ</label>
                <div className="pwd-input-wrap">
                  <input 
                    type="password" 
                    name="oldPassword"
                    placeholder="Nhập mật khẩu cũ" 
                    value={formData.oldPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group-pwd">
                <label><span>*</span> Mật khẩu mới</label>
                <div className="pwd-input-wrap">
                  <input 
                    type="password" 
                    name="newPassword"
                    placeholder="Nhập mật khẩu mới" 
                    value={formData.newPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group-pwd">
                <label><span>*</span> Xác nhận mật khẩu</label>
                <div className="pwd-input-wrap">
                  <input 
                    type="password" 
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="pwd-actions">
                <button type="button" className="btn-cancel-pwd" onClick={() => setFormData({oldPassword:'', newPassword:'', confirmPassword:''})}>Hủy</button>
                <button type="submit" className="btn-confirm-pwd" disabled={isLoading}>
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatLaiMatKhau;
