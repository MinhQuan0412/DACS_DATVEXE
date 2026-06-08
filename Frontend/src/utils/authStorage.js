/**
 * Tiện ích quản lý lưu trữ thông tin đăng nhập (Token, User)
 * Tự động đồng bộ giữa localStorage (Ghi nhớ) và sessionStorage (Tạm thời)
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 phút tự động đăng xuất nếu không hoạt động

export const authStorage = {
  // Xác định xem hiện tại đang dùng loại lưu trữ nào (dựa trên vị trí của token)
  isPersistent: () => !!localStorage.getItem('token') || !!localStorage.getItem('adminToken'),

  setToken: (token, remember = null) => {
    // Nếu không truyền remember, tự động theo phiên hiện tại
    const isPersistent = remember !== null ? remember : authStorage.isPersistent();
    const storage = isPersistent ? localStorage : sessionStorage;
    
    // Clear sạch trước khi set mới để tránh bị rác giữa 2 bộ nhớ
    authStorage.clear();
    
    storage.setItem('token', token);
    storage.setItem('adminToken', token);
    storage.setItem('lastActivity', Date.now().toString());
  },
  
  setUser: (user, remember = null) => {
    const isPersistent = remember !== null ? remember : authStorage.isPersistent();
    const storage = isPersistent ? localStorage : sessionStorage;
    const userStr = JSON.stringify(user);
    storage.setItem('user', userStr);
    storage.setItem('adminUser', userStr);
    storage.setItem('lastActivity', Date.now().toString());
  },
  
  getToken: () => {
    authStorage.checkInactivity();
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },
  
  getAdminToken: () => {
    authStorage.checkInactivity();
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  },
  
  getUser: () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  
  getAdminUser: () => {
    const userStr = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  checkInactivity: () => {
    const lastActivity = localStorage.getItem('lastActivity') || sessionStorage.getItem('lastActivity');
    if (lastActivity) {
      const diff = Date.now() - parseInt(lastActivity);
      if (diff > SESSION_TIMEOUT) {
        // Quá thời gian chờ -> Out
        authStorage.clear();
        window.location.href = '/dang-nhap?reason=timeout';
        return false;
      }
    }
    // Cập nhật lại thời gian hoạt động
    const storage = authStorage.isPersistent() ? localStorage : sessionStorage;
    storage.setItem('lastActivity', Date.now().toString());
    return true;
  },
  
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('lastActivity');
    
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('lastActivity');
  }
};
