import axiosClient from './axiosClient';

const adminApi = {
  // 1. Authentication & Profile
  login: (soDienThoai, matKhau) => axiosClient.post('/api/admin/login', { soDienThoai, matKhau }),
  logout: () => axiosClient.post('/api/auth/logout'),
  getMe: () => axiosClient.get('/api/auth/me'),

  // 2. Quản Lý Khách Hàng
  getCustomers: () => axiosClient.get('/api/admin/customers'),
  updateCustomer: (id, data) => axiosClient.put(`/api/admin/customers/${id}`, data),
  deleteCustomer: (id) => axiosClient.delete(`/api/admin/customers/${id}`),

  // 3. Quản Lý Nhân Viên
  getStaff: () => axiosClient.get('/api/admin/staff'),
  createStaff: (data) => axiosClient.post('/api/admin/staff', data),
  updateStaff: (id, data) => axiosClient.put(`/api/admin/staff/${id}`, data),
  deleteStaff: (id) => axiosClient.delete(`/api/admin/staff/${id}`),

  // 4. Quản Lý Xe (Vehicles)
  getVehicles: (params) => axiosClient.get('/api/admin/vehicles', { params }),
  getVehicleById: (id) => axiosClient.get(`/api/admin/vehicles/${id}`),
  createVehicle: (data) => axiosClient.post('/api/admin/vehicles', data),
  updateVehicle: (id, data) => axiosClient.put(`/api/admin/vehicles/${id}`, data),
  deleteVehicle: (id) => axiosClient.delete(`/api/admin/vehicles/${id}`),
  
  // 4a. Sơ đồ ghế (Seat Maps)
  getSeatSchemas: () => axiosClient.get('/api/admin/seat-maps'),

  // 5. Quản Lý Tuyến Xe (Routes)
  getRoutes: () => axiosClient.get('/api/admin/routes'),
  getRouteById: (id) => axiosClient.get(`/api/admin/routes/${id}`),
  createRoute: (data) => axiosClient.post('/api/admin/routes', data),
  updateRoute: (id, data) => axiosClient.put(`/api/admin/routes/${id}`, data),
  deleteRoute: (id) => axiosClient.delete(`/api/admin/routes/${id}`),
  getRouteStops: (id) => axiosClient.get(`/api/admin/routes/${id}/stops`),
  updateRouteStops: (id, data) => axiosClient.post(`/api/admin/routes/${id}/stops`, data),

  // 6. Quản Lý Chuyến Xe (Trips)
  getTrips: () => axiosClient.get('/api/admin/trips'),
  createTrip: (data) => axiosClient.post('/api/admin/trips', data),
  updateTrip: (id, data) => axiosClient.put(`/api/admin/trips/${id}`, data),
  deleteTrip: (id) => axiosClient.delete(`/api/admin/trips/${id}`),
  cancelTrip: (id, data) => axiosClient.post(`/api/admin/trips/${id}/cancel`, data),

  // 7. Quản Lý Vé (Bookings)
  getBookings: (params) => axiosClient.get('/api/admin/bookings', { params }),
  getBookingById: (id) => axiosClient.get(`/api/admin/bookings/${id}`),
  updateBookingStatus: (id, data) => axiosClient.put(`/api/admin/bookings/${id}`, data),
  deleteBooking: (id) => axiosClient.delete(`/api/admin/bookings/${id}`),

  // 8. Thống Kê (Stats)
  getDashboardStats: () => axiosClient.get('/api/admin/stats/dashboard'),
  getRevenueStats: () => axiosClient.get('/api/admin/stats/revenue'),
  getDailyStats: () => axiosClient.get('/api/admin/stats/daily'),

  // 9. Yêu Cầu Hỗ Trợ (Support)
  getSupportRequests: () => axiosClient.get('/api/admin/support-tickets'),
  getSupportRequestsLegacy: () => axiosClient.get('/api/admin/support-requests'),
  updateSupportRequest: (id, data) => axiosClient.put(`/api/admin/support-tickets/${id}`, data),
  deleteSupportRequest: (id) => axiosClient.delete(`/api/admin/support-tickets/${id}`),

  // 10. Quản Lý Voucher
  getVouchers: () => axiosClient.get('/api/admin/vouchers'),
  createVoucher: (data) => axiosClient.post('/api/admin/vouchers', data),
  updateVoucher: (id, data) => axiosClient.put(`/api/admin/vouchers/${id}`, data),
  deleteVoucher: (id) => axiosClient.delete(`/api/admin/vouchers/${id}`),

  // 11. Thông Báo (Notifications)
  getNotifications: () => axiosClient.get('/api/admin/notifications'),
  markAsRead: (id) => axiosClient.patch(`/api/admin/notifications/${id}/read`)
};

export default adminApi;
