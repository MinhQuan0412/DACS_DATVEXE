import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBars, FaTimes, FaHistory, FaUserCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import './Header.css';
import { authStorage } from '../../utils/authStorage';

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const userData = authStorage.getUser();
      const token = authStorage.getToken();
      
      if (userData && token) {
        setUser(userData);
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    setShowUserDropdown(false);
    navigate('/');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Mobile Menu Toggle (Left) */}
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes size={24} color="white"/> : <FaBars size={24} color="white"/>}
        </button>

        {/* Logo */}
        <div className="logo">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2>BlueBus</h2>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul>
            <li><Link to="/" className="active" onClick={() => setIsMobileMenuOpen(false)}>TRANG CHỦ</Link></li>
            <li><Link to="/lich-trinh" onClick={() => setIsMobileMenuOpen(false)}>LỊCH TRÌNH</Link></li>
            <li><Link to="/tra-cuu-ve" onClick={() => setIsMobileMenuOpen(false)}>TRA CỨU VÉ</Link></li>
            <li><Link to="/lien-he" onClick={() => setIsMobileMenuOpen(false)}>LIÊN HỆ</Link></li>
          </ul>
        </nav>

        {/* Auth Buttons / User Profile */}
        <div className="auth-buttons">
          {user ? (
            <div className="user-profile-dropdown" onMouseEnter={() => setShowUserDropdown(true)} onMouseLeave={() => setShowUserDropdown(false)}>
              <div className="user-trigger">
                <FaUserCircle size={24} className="user-icon-main" />
                <span className="user-name-header">{user.hoTen || user.name || user.displayName}</span>
                <FaChevronDown size={10} className={`chevron-icon ${showUserDropdown ? 'rotate' : ''}`} />
              </div>
              
              {showUserDropdown && (
                <div className="u-dropdown-menu fade-in">
                  {(user.role === 'admin' || user.role === 'employee' || user.role === 'nhanvien') && (
                    <Link to="/admin" className="u-dropdown-item admin-link-item">
                      <div className="u-item-icon admin-bg"><FaUserCog /></div>
                      <span className="text-bold">QUẢN TRỊ VIÊN</span>
                    </Link>
                  )}
                  <Link to="/tai-khoan" className="u-dropdown-item">
                    <div className="u-item-icon profile-bg"><FaUserCog /></div>
                    <span>Thông tin cá nhân</span>
                  </Link>
                  <Link to="/lich-su-dat-ve" className="u-dropdown-item">
                    <div className="u-item-icon history-bg"><FaHistory /></div>
                    <span>Lịch sử đặt vé</span>
                  </Link>
                  <div className="u-dropdown-divider"></div>
                  <button className="u-dropdown-item logout-item" onClick={handleLogout}>
                    <div className="u-item-icon logout-bg"><FaSignOutAlt /></div>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-auth-combined" onClick={() => { setIsMobileMenuOpen(false); navigate('/dang-nhap'); }}>
              <FaUserCircle size={20} /> 
              <span className="auth-text">Đăng nhập / Đăng ký</span>
            </button>
          )}
        </div>
      </div>
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </header>
  );
};

export default Header;
