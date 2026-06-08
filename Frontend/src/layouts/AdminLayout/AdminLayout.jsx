import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './AdminLayout.css';
import Swal from 'sweetalert2';
import { FaChartPie, FaTicketAlt, FaCalendarAlt, FaRoute, FaBus, FaUsers, FaUserTie, FaChartBar, FaSignOutAlt, FaSearch, FaBell, FaUserCircle, FaBars, FaHeadset, FaGift } from 'react-icons/fa';
import { authStorage } from '../../utils/authStorage';
import adminApi from '../../api/adminApi';
import NotificationBell from './NotificationBell';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Đọc thông tin user thật từ storage
  const [adminUser, setAdminUser] = useState(() => authStorage.getAdminUser());

  const currentUserRole = (adminUser?.vaiTro || adminUser?.role || 'staff').toString().trim().toLowerCase();
  
  // Logic kiểm tra quyền admin: Whitelist những role có quyền quản trị tối cao
  const isSystemAdmin = currentUserRole.includes('admin') || 
                        currentUserRole.includes('quản trị') || 
                        currentUserRole.includes('root') ||
                        (adminUser?.hoTen || '').toLowerCase().includes('admin');
  
  console.log('--- ADMIN ACCESS DEBUG ---');
  console.log('Current User:', adminUser?.hoTen);
  console.log('Current Role:', currentUserRole);
  console.log('Is System Admin (Full Access):', isSystemAdmin);

  // Bảo vệ route: nếu chưa login thì redirect về /dang-nhap
  useEffect(() => {
    // Kiểm tra thời gian hoạt động (Inactivity timeout)
    authStorage.checkInactivity();

    const token = authStorage.getAdminToken();
    if (!token) {
      navigate('/dang-nhap', { replace: true });
    }
  }, [navigate, window.location.pathname]);

  const handleLogout = (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1565C0',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        // Xóa sạch toàn bộ token và thông tin user khi đăng xuất
        authStorage.clear();
        window.dispatchEvent(new Event('storage'));
        navigate('/dang-nhap');
      }
    });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-layout windster-theme fade-in">
      <nav className="w-navbar">
        <div className="w-nav-left">
          <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaBars />
          </button>
          <div className="w-logo">
             <div className="w-logo-icon">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0ea5e9" width="32" height="32"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
             </div>
             <h2>BlueBus</h2>
          </div>
          <div className="w-search-bar">
             <FaSearch className="w-search-icon" />
             <input type="text" placeholder="Tìm kiếm giao dịch, người dùng..." />
          </div>
        </div>
        <div className="w-nav-right">
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '14px', fontWeight: 600 }}>
             <FaUserCircle style={{ color: '#1565C0', fontSize: '22px' }} />
             <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
               <span style={{ fontSize: '13px', fontWeight: 700, color: '#1565C0' }}>
                 {adminUser?.hoTen || 'Admin'}
               </span>
               <span style={{ fontSize: '11px', color: '#999', fontWeight: 400 }}>
                 {adminUser?.soDienThoai || ''}
               </span>
             </div>
           </div>
                       <NotificationBell />
        </div>
      </nav>

      <div className="w-main-container">
        {/* Mobile Overlay */}
        <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>

        {/* Sidebar */}
        <aside className={`w-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <ul className="w-sidebar-menu">
             <li className="menu-group-title">QUẢN LÝ CHUNG</li>
             <li><NavLink to="/admin" end onClick={closeSidebar}><FaChartPie/> Tổng quan (Dashboard)</NavLink></li>
             <li><NavLink to="/admin/ve" onClick={closeSidebar}><FaTicketAlt/> Quản lý Vé đặt</NavLink></li>
             
              <li className="menu-group-title">VẬN HÀNH</li>
              <li><NavLink to="/admin/chuyen" onClick={closeSidebar}><FaCalendarAlt/> Quản lý Chuyến</NavLink></li>
              <li><NavLink to="/admin/tuyen" onClick={closeSidebar}><FaRoute/> Quản lý Tuyến</NavLink></li>
              <li><NavLink to="/admin/xe" onClick={closeSidebar}><FaBus/> Quản lý Xe</NavLink></li>
              
              {isSystemAdmin && (
                <li><NavLink to="/admin/voucher" onClick={closeSidebar}><FaGift/> Quản lý Voucher</NavLink></li>
              )}
              
              {isSystemAdmin && (
                <>
                  <li className="menu-group-title">TÀI KHOẢN</li>
                  <li><NavLink to="/admin/khach-hang" onClick={closeSidebar}><FaUsers/> Khách Hàng</NavLink></li>
                  <li><NavLink to="/admin/nhan-vien" onClick={closeSidebar}><FaUserTie/> Nhân Viên</NavLink></li>
                </>
              )}
              
              <li className="menu-group-title">MỞ RỘNG</li>
              <li><NavLink to="/admin/ho-tro" onClick={closeSidebar}><FaHeadset/> Chăm sóc KH</NavLink></li>
              
              {/* Chỉ Admin mới thấy Báo Cáo */}
              {isSystemAdmin && (
                <li><NavLink to="/admin/bao-cao" onClick={closeSidebar}><FaChartBar/> Báo cáo Thống kê</NavLink></li>
              )}

             <li className="logout-wrapper"><a href="#" onClick={handleLogout} className="w-logout-btn"><FaSignOutAlt/> Đăng xuất</a></li>
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className="w-content-area">
           <Outlet context={{ userRole: currentUserRole }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
