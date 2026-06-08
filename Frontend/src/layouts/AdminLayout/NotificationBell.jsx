import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaBell, FaTicketAlt, FaHeadset } from 'react-icons/fa';
import adminApi from '../../api/adminApi';
import socket from '../../utils/socket';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  const handleMarkAsReadRef = useRef(null);
  const autoCloseTimerRef = useRef(null);
  const triggerAutoOpenRef = useRef(null);

  // Trigger ringing animation when unreadCount increases
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setIsRinging(true);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  // Turn off ringing animation after 1 second
  useEffect(() => {
    if (isRinging) {
      const timer = setTimeout(() => setIsRinging(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRinging]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const triggerAutoOpen = () => {
    // Clear any existing auto-close timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    
    // Open the notification dropdown
    setShowNotifications(true);
    
    // Set a timer to close it after 5 seconds
    autoCloseTimerRef.current = setTimeout(() => {
      setShowNotifications(false);
    }, 5000);
  };

  triggerAutoOpenRef.current = triggerAutoOpen;

  useEffect(() => {
    fetchNotifications();
    // Polling 5 giây để sync với DB — socket xử lý real-time, polling đảm bảo không mất thông báo
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Event 1: Khách hủy vé
    const onBookingCancelled = (data) => {
      const reason = data.lyDoHuy || data.lyDo || data.reason || data.cancelReason || 'Không rõ';
      const newNoti = {
        _id: `local-${Date.now()}`,
        loai: 'cancel',
        tieuDe: `Vé bị hủy: ${data.maVe || ''}`,
        noiDung: `Khách vừa hủy vé ${data.maVe || ''}. Lý do: ${reason}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: { link: '/admin/ve', bookingId: data.bookingId || data.maVe }
      };

      // Chỉ thêm vào state trực tiếp, KHÔNG GỌI fetchNotifications 
      // để tránh việc API chưa kịp lưu dẫn đến load đè mất thông báo mới
      setNotifications(prev => [newNoti, ...prev]);
      setUnreadCount(prev => prev + 1);
      if (triggerAutoOpenRef.current) {
        triggerAutoOpenRef.current();
      }
    };

    // Event 2: Thanh toán thành công
    const onPaymentConfirmed = (data) => {
      const newNoti = {
        _id: `local-${Date.now()}`,
        loai: 'booking',
        tieuDe: `Thanh toán thành công: ${data.maVe || ''}`,
        noiDung: `Vé ${data.maVe || ''} vừa được thanh toán thành công.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: { link: '/admin/ve', bookingId: data.bookingId || data.maVe }
      };

      setNotifications(prev => [newNoti, ...prev]);
      setUnreadCount(prev => prev + 1);
      if (triggerAutoOpenRef.current) {
        triggerAutoOpenRef.current();
      }
    };

    // Event 3: Thông báo hệ thống
    const onAdminNotification = (data) => {
      const newNoti = {
        _id: `local-${Date.now()}`,
        loai: data.type || 'system',
        tieuDe: data.title || 'Thông báo hệ thống',
        noiDung: data.message || '',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {}
      };

      setNotifications(prev => [newNoti, ...prev]);
      setUnreadCount(prev => prev + 1);
      if (triggerAutoOpenRef.current) {
        triggerAutoOpenRef.current();
      }
    };

    socket.on('booking_cancelled', onBookingCancelled);
    socket.on('payment_confirmed', onPaymentConfirmed);
    socket.on('admin_notification', onAdminNotification);

    return () => {
      socket.off('booking_cancelled', onBookingCancelled);
      socket.off('payment_confirmed', onPaymentConfirmed);
      socket.off('admin_notification', onAdminNotification);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await adminApi.getNotifications();
      const dbNotis = res.notifications || res.data?.notifications || [];
      const dbUnread = res.unreadCount ?? res.data?.unreadCount ?? 0;

      // Merge: giữ local-xxx chưa có trong DB (socket real-time chưa kịp lưu)
      setNotifications(prev => {
        const dbIds = new Set(dbNotis.map(n => n._id));
        const localOnly = prev.filter(n => n._id.startsWith('local-') && !dbIds.has(n._id));
        const localUnread = localOnly.filter(n => !n.isRead).length;
        setUnreadCount(dbUnread + localUnread);
        return [...localOnly, ...dbNotis];
      });
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    }
  };

  const timeAgo = (date) => {
    if (!date) return 'Vừa xong';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const handleMarkAsRead = async (noti) => {
    setShowNotifications(false);

    // Call API mark as read nếu không phải local notification
    if (!noti.isRead && !noti._id.startsWith('local-')) {
      try {
        await adminApi.markAsRead(noti._id);
      } catch (err) {
        console.error('Lỗi khi đánh dấu đã đọc:', err);
      }
    }
    
    // Update state trực tiếp để UI phản hồi ngay lập tức
    setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Handle Metadata and redirect
    let metadata = {};
    try {
      if (typeof noti.metadata === 'string') {
        metadata = JSON.parse(noti.metadata);
      } else {
        metadata = noti.metadata || {};
      }
    } catch (e) {
      console.error('Error parsing notification metadata:', e);
    }

    const link = metadata.link;
    const requestId = metadata.requestId || metadata.bookingId || metadata.id || noti.relatedId;

    if (link) {
      const targetLink = link.includes('?') ? `${link}&searchActive=${requestId}` : `${link}?searchActive=${requestId}`;
      navigate(targetLink, { state: { highlightId: requestId } });
      if (window.location.pathname === link) {
        // Phát sự kiện custom để component hiện tại (nếu đang ở trang đó) tự động cập nhật
        window.dispatchEvent(new CustomEvent('notification-clicked', { detail: { highlightId: requestId } }));
      }
    } else {
      const loai = noti.loai || noti.type || '';
      if (loai === 'support' || loai === 'contact') {
        navigate(`/admin/ho-tro?searchActive=${requestId}`, { state: { highlightId: requestId } });
      } else if (loai === 'cancel' || loai === 'booking') {
        navigate(`/admin/ve?searchActive=${requestId}`, { state: { highlightId: requestId } });
      } else if (loai === 'system') {
        navigate(`/admin/chuyen?searchActive=${requestId}`, { state: { highlightId: requestId } });
      }
    }
  };

  const handleBellClick = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setShowNotifications(!showNotifications);
  };

  handleMarkAsReadRef.current = handleMarkAsRead;

  return (
    <div className="w-notification-wrapper">
      <button className="w-icon-btn" onClick={handleBellClick}>
        <FaBell className={isRinging ? 'bell-shake' : unreadCount > 0 ? 'bell-unread-swing' : ''} />
        {unreadCount > 0 && <span className="w-noti-badge pulse">{unreadCount}</span>}
      </button>

      {showNotifications && (
        <div className="w-noti-dropdown fade-in">
          <div className="w-noti-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && <span>{unreadCount} chưa đọc</span>}
          </div>
          <div className="w-noti-list">
            {notifications.length > 0 ? (
              notifications.map(noti => {
                const loai = noti.loai || noti.type || '';
                const isRead = noti.isRead ?? noti.read ?? false;
                return (
                  <div
                    key={noti._id}
                    className={`w-noti-item ${!isRead ? 'unread' : ''}`}
                    onClick={() => handleMarkAsRead(noti)}
                  >
                    <div className="w-noti-icon">
                      {loai === 'support' || loai === 'contact' ? <FaHeadset />
                        : loai === 'cancel' || loai === 'booking' ? <FaTicketAlt />
                          : <FaBell />}
                    </div>
                    <div className="w-noti-content">
                      <p className="w-noti-text">{noti.tieuDe || noti.title || 'Thông báo mới'}</p>
                      <p className="w-noti-subtext">{noti.noiDung || noti.message || noti.content || ''}</p>
                      <span className="w-noti-time">{timeAgo(noti.createdAt)}</span>
                    </div>
                    {!isRead && <div className="unread-dot"></div>}
                  </div>
                );
              })
            ) : (
              <div className="w-noti-empty">Không có thông báo nào</div>
            )}
          </div>
          <div className="w-noti-footer">
            <button onClick={() => setShowNotifications(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
