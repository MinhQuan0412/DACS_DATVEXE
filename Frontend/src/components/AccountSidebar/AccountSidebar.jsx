import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaHistory, FaLock, FaSignOutAlt } from 'react-icons/fa';
import authApi from '../../api/authApi';
import './AccountSidebar.css';

const AccountSidebar = ({ activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Lỗi khi logout:', err);
    }
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/dang-nhap');
  };

  return (
    <div className="account-sidebar">
      <nav className="account-nav">
        <Link 
          to="/tai-khoan" 
          className={`nav-item ${activeTab === 'tai-khoan' ? 'active' : ''}`}
        >
          <div className="nav-icon"><FaUserCircle /></div>
          <span>Thông tin tài khoản</span>
        </Link>
        <Link 
          to="/lich-su-dat-ve" 
          className={`nav-item ${activeTab === 'lich-su' ? 'active' : ''}`}
        >
          <div className="nav-icon"><FaHistory /></div>
          <span>Lịch sử mua vé</span>
        </Link>
        <Link 
          to="/dat-lai-mat-khau" 
          className={`nav-item ${activeTab === 'mat-khau' ? 'active' : ''}`}
        >
          <div className="nav-icon"><FaLock /></div>
          <span>Đặt lại mật khẩu</span>
        </Link>
        <a href="#" className="nav-item logout-item" onClick={handleLogout}>
          <div className="nav-icon"><FaSignOutAlt /></div>
          <span>Đăng xuất</span>
        </a>
      </nav>
    </div>
  );
};

export default AccountSidebar;
