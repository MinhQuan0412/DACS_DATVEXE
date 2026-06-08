import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DangNhap.css';
import { FaLock, FaPhoneAlt, FaEye, FaEyeSlash, FaCheckSquare, FaSquare } from 'react-icons/fa';
import authApi from '../../api/authApi';
import { authStorage } from '../../utils/authStorage';

const DangNhap = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let res;
      let isAdmin = false;

      // Thử đăng nhập bằng endpoint Admin trước
      try {
        res = await authApi.adminLogin(phoneNumber, password);
        isAdmin = true;
      } catch (adminErr) {
        // Nếu không phải admin hoặc lỗi khác, thử đăng nhập bằng endpoint User thường
        console.log('Thử đăng nhập User thường do Admin login thất bại');
        res = await authApi.login({ soDienThoai: phoneNumber, matKhau: password });
        isAdmin = false;
      }

      // Lưu token và thông tin user vào storage
      const token = res.token;
      const user = res.user;

      // Xóa dữ liệu cũ trước khi lưu mới
      authStorage.clear();

      authStorage.setToken(token, rememberMe);
      authStorage.setUser(user, rememberMe);

      // Dispatch event to update Header
      window.dispatchEvent(new Event('storage'));

      // Điều hướng dựa trên vai trò
      const role = (user.vaiTro || user.role || '').toLowerCase();
      if (isAdmin || role === 'admin' || role === 'nhanvien' || role === 'staff') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err);
      const msg = err?.message || err?.error || 'Số điện thoại hoặc mật khẩu không đúng.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-tabs">
            <div className="auth-tab active">
              Đăng nhập
            </div>
            <div className="auth-tab inactive" onClick={() => navigate('/dang-ky')}>
              Đăng ký
            </div>
          </div>
          
          <div className="auth-body">
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              {/* Error message */}
              {error && (
                <div style={{
                  background: '#ffebee',
                  border: '1px solid #ef9a9a',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#c62828',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="futa-input-group">
                <label>Số điện thoại</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                    <FaPhoneAlt size={14} />
                  </span>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="futa-input-group">
                <label>Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                    <FaLock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="remember-me" onClick={() => setRememberMe(!rememberMe)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#666' }}>
                  {rememberMe ? <FaCheckSquare className="text-blue" /> : <FaSquare style={{ color: '#ddd' }} />}
                  <span>Ghi nhớ đăng nhập</span>
                </div>
                <Link to="/quen-mat-khau" className="forgot-password">Quên mật khẩu?</Link>
              </div>

              <button
                type="submit"
                className="futa-action-btn"
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DangNhap;
