/**
 * Middleware kiểm tra quyền truy cập dựa trên vai trò
 * @param {Array} allowedRoles - Danh sách các vai trò được phép (ví dụ: ['admin', 'staff'])
 */
const checkPermission = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
      }
  
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }
  
      return res.status(403).json({ 
        message: `Bạn không có quyền thực hiện hành động này. Quyền yêu cầu: ${allowedRoles.join(', ')}` 
      });
    };
  };
  
  module.exports = checkPermission;
