import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* Layouts */
import UserLayout from './layouts/UserLayout/UserLayout';
import AdminLayout from './layouts/AdminLayout/AdminLayout';

/* User Pages */
import Home from './pages/Home/Home';
import LichTrinh from './pages/LichTrinh/LichTrinh';
import KetQuaTimKiem from './pages/KetQuaTimKiem/KetQuaTimKiem';
import DangNhap from './pages/DangNhap/DangNhap';
import LienHe from './pages/LienHe/LienHe';
import DangKy from './pages/DangKy/DangKy';
import QuenMatKhau from './pages/QuenMatKhau/QuenMatKhau';
import TraCuuVe from './pages/TraCuuVe/TraCuuVe';

import DatVe from './pages/DatVe/DatVe';
import ThanhToan from './pages/ThanhToan/ThanhToan';
import XacNhanDatVe from './pages/XacNhanDatVe/XacNhanDatVe';
import TaiKhoan from './pages/TaiKhoan/TaiKhoan';
import DatLaiMatKhau from './pages/DatLaiMatKhau/DatLaiMatKhau';
import LichSuDatVe from './pages/LichSuDatVe/LichSuDatVe';
import GioiThieu from './pages/GioiThieu/GioiThieu';
import ChinhSach from './pages/ChinhSach/ChinhSach';
import HoaDon from './pages/HoaDon/HoaDon';

/* Admin Pages */
import Dashboard from './pages/Admin/Dashboard/Dashboard';
import QuanLyXe from './pages/Admin/QuanLyXe/QuanLyXe';
import QuanLyTuyen from './pages/Admin/QuanLyTuyen/QuanLyTuyen';
import QuanLyChuyen from './pages/Admin/QuanLyChuyen/QuanLyChuyen';
import QuanLyKhachHang from './pages/Admin/QuanLyNguoiDung/QuanLyKhachHang';
import QuanLyNhanVien from './pages/Admin/QuanLyNguoiDung/QuanLyNhanVien';
import QuanLyVe from './pages/Admin/QuanLyVe/QuanLyVe';
import BaoCaoThongKe from './pages/Admin/BaoCaoThongKe/BaoCaoThongKe';
import QuanLyHoTro from './pages/Admin/QuanLyHoTro/QuanLyHoTro';
import QuanLyVoucher from './pages/Admin/QuanLyVoucher/QuanLyVoucher';

function App() {
  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/lich-trinh" element={<LichTrinh />} />
          <Route path="/tim-chuyen" element={<KetQuaTimKiem />} />
          <Route path="/dang-nhap" element={<DangNhap />} />
          <Route path="/lien-he" element={<LienHe />} />
          <Route path="/dang-ky" element={<DangKy />} />
          <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
          <Route path="/tra-cuu-ve" element={<TraCuuVe />} />
          <Route path="/dat-ve" element={<DatVe />} />
          <Route path="/thanh-toan" element={<ThanhToan />} />
          <Route path="/dat-ve-thanh-cong" element={<XacNhanDatVe />} />
          <Route path="/tai-khoan" element={<TaiKhoan />} />
          <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhau />} />
          <Route path="/lich-su-dat-ve" element={<LichSuDatVe />} />
          <Route path="/gioi-thieu" element={<GioiThieu />} />
          <Route path="/chinh-sach" element={<ChinhSach />} />
          <Route path="/hoa-don" element={<HoaDon />} />
        </Route>
        
        {/* Isolated Routes */}


        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="xe" element={<QuanLyXe />} />
          <Route path="tuyen" element={<QuanLyTuyen />} />
          <Route path="chuyen" element={<QuanLyChuyen />} />
          <Route path="khach-hang" element={<QuanLyKhachHang />} />
          <Route path="nhan-vien" element={<QuanLyNhanVien />} />
          <Route path="ve" element={<QuanLyVe />} />
          <Route path="bao-cao" element={<BaoCaoThongKe />} />
          <Route path="ho-tro" element={<QuanLyHoTro />} />
          <Route path="voucher" element={<QuanLyVoucher />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
