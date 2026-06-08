import React, { useEffect } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Outlet, useNavigate } from 'react-router-dom';
import { authStorage } from '../../utils/authStorage';

const UserLayout = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra thời gian hoạt động (Inactivity timeout)
    authStorage.checkInactivity();

    try {
      const user = authStorage.getUser() || {};
      const role = (user.vaiTro || user.role || '').toLowerCase();
      
      const isAdmin = role.includes('admin') || role.includes('nhanvien') || role.includes('staff') || role.includes('quản trị');
      
      // Nếu là Admin/Nhân viên, tuyệt đối không cho vào giao diện User
      if (isAdmin) {
        // Nếu không phải đang ở trang admin, buộc chuyển hướng về /admin
        if (!window.location.pathname.startsWith('/admin')) {
          navigate('/admin', { replace: true });
        }
      }
    } catch (e) {
      console.error("Lỗi phân quyền Layout:", e);
    }
  }, [navigate, window.location.pathname]);

  return (
    <div className="app-container">
      <Header />
      <main>
        {/* Nơi chứa các trang con như Trang chủ, Lịch trình, Tìm chuyến */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
