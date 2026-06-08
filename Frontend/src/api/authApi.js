import axiosClient from './axiosClient';

const authApi = {
  // Admin Authentication
  adminLogin: (soDienThoai, matKhau) => {
    return axiosClient.post('/api/admin/login', { soDienThoai, matKhau });
  },

  // Authentication & Registration
  sendOtp: (data) => {
    return axiosClient.post('/api/auth/send-otp', data);
  },
  register: (data) => {
    return axiosClient.post('/api/auth/register', data);
  },
  login: (data) => {
    return axiosClient.post('/api/auth/login', data);
  },
  forgotPassword: (data) => {
    return axiosClient.post('/api/auth/forgot-password', data);
  },
  resetPassword: (data) => {
    return axiosClient.post('/api/auth/reset-password', data);
  },
  logout: () => {
    return axiosClient.post('/api/auth/logout');
  },
  
  // User Profile
  getMe: () => {
    return axiosClient.get('/api/auth/me');
  },
  updateProfile: (data) => {
    return axiosClient.patch('/api/auth/profile', data);
  },
  changePassword: (data) => {
    return axiosClient.patch('/api/auth/change-password', data);
  },
  sendSupportRequest: (data) => {
    return axiosClient.post('/api/support-requests', data);
  }
};

export default authApi;
