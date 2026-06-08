import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../AdminShared.css';
import './QuanLyHoTro.css';
import {
  FaTrashAlt, FaInbox, FaSpinner,
  FaCheckCircle, FaSearch,
  FaPhone, FaEnvelope, FaCalendarAlt,
  FaSave, FaTimes, FaStickyNote, FaReply
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import adminApi from '../../../api/adminApi';
import axiosClient from '../../../api/axiosClient';

const STATUS_CONFIG = {
  open:        { label: 'Chờ xử lý',     cls: 'st-pending',     icon: '⏳' },
  pending:     { label: 'Chờ xử lý',     cls: 'st-pending',     icon: '⏳' },
  in_progress: { label: 'Đang xử lý',    cls: 'st-inprogress',  icon: '🔄' },
  resolved:    { label: 'Đã giải quyết', cls: 'st-resolved',    icon: '✅' },
  closed:      { label: 'Đã đóng',       cls: 'st-closed',      icon: '🔒' },
};

const fmt = (iso) => iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const QuanLyHoTro = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [selected, setSelected]   = useState(null);
  const [editStatus, setEditSt]   = useState('');
  const [editPhanHoi, setEditPhanHoi] = useState('');
  const [editGhiChu, setEditGhiChu] = useState('');
  const [currentPage, setPage]    = useState(1);
  const PER_PAGE = 8;
  const location = useLocation();

  useEffect(() => { fetchData(); }, []);

  // Xử lý khi được điều hướng từ thông báo (có highlightId)
  useEffect(() => {
    const handleHighlight = (id) => {
      if (!id) return;
      console.log('--- NOTIFICATION DEBUG ---');
      console.log('Looking for Feedback ID:', id);
      console.log('Current Feedbacks Count:', feedbacks.length);
      
      const target = feedbacks.find(f => 
        f._id === id || 
        f._id?.toString() === id?.toString() ||
        f._id?.toString().includes(id?.toString())
      );

      if (target) {
        console.log('Target Found:', target.tieuDe);
        openDetail(target);
        // Xóa highlightId trong state để không bị mở lại khi F5
        window.history.replaceState({}, document.title);
      } else {
        console.warn('Target NOT found in current list.');
      }
    };

    if (feedbacks.length > 0) {
      if (location.state?.highlightId) {
        handleHighlight(location.state.highlightId);
      }

      const onNotiClick = (e) => {
        console.log('Notification event received:', e.detail);
        handleHighlight(e.detail?.highlightId);
      };
      
      window.addEventListener('notification-clicked', onNotiClick);
      return () => window.removeEventListener('notification-clicked', onNotiClick);
    }
  }, [feedbacks, location.state]);

  const [debugInfo, setDebugInfo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    let list = [];
    let lastError = '';

    const tryFetch = async (url) => {
      try {
        console.log(`Trying: ${url}`);
        const r = await axiosClient.get(url);
        if (Array.isArray(r)) return r;
        if (r?.data && Array.isArray(r.data)) return r.data;
        if (r?.doc && Array.isArray(r.doc)) return r.doc;
        return null;
      } catch (e) {
        console.warn(`Failed: ${url}`, e);
        lastError = e.message || (typeof e === 'string' ? e : '404 Not Found');
        return null;
      }
    };

    // Chuỗi thử lỗi "Bất tử"
    list = await tryFetch('/api/admin/support-tickets');
    if (!list || list.length === 0) list = await tryFetch('/api/admin/support-requests');
    if (!list || list.length === 0) list = await tryFetch('/api/admin/contacts');
    if (!list || list.length === 0) list = await tryFetch('/api/support-tickets');

    if (list && list.length > 0) {
      setFeedbacks(list.map(item => ({
        ...item,
        trangThai: item.trangThai || item.status || 'open'
      })));
      setDebugInfo('');
    } else {
      setFeedbacks([]);
      setDebugInfo(`Vẫn chưa tìm thấy dữ liệu. Lỗi cuối cùng: ${lastError}. Vui lòng bảo bạn BE kiểm tra lại đường dẫn /api/admin/support-tickets.`);
    }
    setLoading(false);
  };

  const openDetail = (fb) => {
    setSelected(fb);
    setEditSt(fb.trangThai || 'open');
    // BE trả về field 'phanHoi', fallback sang 'phanHoiKhachHang' cho tương thích cũ
    setEditPhanHoi(fb.phanHoi || fb.phanHoiKhachHang || '');
    setEditGhiChu(fb.ghiChuNoiBo || '');
  };

  const saveChanges = async () => {
    try {
      // BE expect field 'phanHoi' (không phải 'phanHoiKhachHang')
      const payload = { 
        trangThai: editStatus, 
        phanHoi: editPhanHoi,
        ghiChuNoiBo: editGhiChu 
      };
      await adminApi.updateSupportRequest(selected._id, payload);
      
      // Cập nhật local state — lưu cả 2 field để hiển thị đúng dù BE trả về field nào
      setFeedbacks(prev => prev.map(f => f._id === selected._id ? { 
        ...f, 
        trangThai: editStatus, 
        phanHoi: editPhanHoi,
        phanHoiKhachHang: editPhanHoi,
        ghiChuNoiBo: editGhiChu 
      } : f));
      
      setSelected(prev => ({ 
        ...prev, 
        trangThai: editStatus, 
        phanHoi: editPhanHoi,
        phanHoiKhachHang: editPhanHoi,
        ghiChuNoiBo: editGhiChu 
      }));
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Đã cập nhật!', 
        text: editPhanHoi ? 'Email phản hồi đã được gửi cho khách.' : '',
        timer: 2000, 
        showConfirmButton: false 
      });
    } catch (err) {
      const errData = err;
      const errorMsg = typeof errData === 'string' ? errData : (errData?.message || errData?.error || 'Không thể cập nhật phản hồi.');
      Swal.fire('Lỗi', errorMsg, 'error');
    }
  };

  const deleteFb = async (fb) => {
    const res = await Swal.fire({ title: 'Xóa phản hồi?', text: 'Hành động không thể hoàn tác.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (!res.isConfirmed) return;
    try { 
      await adminApi.deleteSupportRequest(fb._id); 
      setFeedbacks(prev => prev.filter(f => f._id !== fb._id));
      if (selected?._id === fb._id) setSelected(null);
      Swal.fire({ icon: 'success', title: 'Đã xóa!', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể xóa phản hồi này.', 'error');
    }
  };

  // Stats
  const total       = feedbacks.length;
  const cntPending  = feedbacks.filter(f => f.trangThai === 'open' || f.trangThai === 'pending' || !f.trangThai).length;
  const cntProgress = feedbacks.filter(f => f.trangThai === 'in_progress').length;
  const cntResolved = feedbacks.filter(f => f.trangThai === 'resolved').length;

  // Filter + paginate
  const filtered = feedbacks.filter(f => {
    const q = search.toLowerCase();
    const matchQ = !q || [f.hoTen, f.email, f.soDienThoai, f.tieuDe, f.maVe].some(v => v?.toLowerCase().includes(q));
    const matchSt = statusFilter === 'All' || f.trangThai === statusFilter || ((f.trangThai === 'open' || !f.trangThai) && statusFilter === 'pending');
    return matchQ && matchSt;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const stCfg = (s) => STATUS_CONFIG[s] || STATUS_CONFIG['pending'];

  return (
    <div className="admin-page fade-in">
      <div className="page-header qlht-header-premium">
        <div className="header-left">
          <h2 className="title-gradient">Trung tâm Hỗ trợ & CSKH</h2>
          <p className="subtitle-premium">Quản lý và phản hồi yêu cầu của hành khách nhanh chóng</p>
        </div>
        <div className="header-right">
           <button className="btn-refresh-premium" onClick={fetchData}><FaSpinner className={loading ? 'spin' : ''} /> Làm mới</button>
        </div>
      </div>

      {debugInfo && (
        <div style={{ background: '#fff4e5', color: '#663c00', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', borderLeft: '4px solid #ffa117', fontWeight: 600 }}>
          ⚠️ CHẨN ĐOÁN HỆ THỐNG: {debugInfo}
        </div>
      )}

      <div className="qlht-stats-row">
        <div className="qlht-stat-card" style={{ borderTop: '3px solid #64748B' }}>
          <FaInbox className="qlht-stat-icon" style={{ color: '#64748B' }} />
          <div><p className="qlht-stat-num">{total}</p><p className="qlht-stat-label">Tổng phản hồi</p></div>
        </div>
        <div className="qlht-stat-card" style={{ borderTop: '3px solid #F59E0B', cursor: 'pointer' }} onClick={() => setStatus('pending')}>
          <FaSpinner className="qlht-stat-icon" style={{ color: '#F59E0B' }} />
          <div><p className="qlht-stat-num" style={{ color: '#F59E0B' }}>{cntPending}</p><p className="qlht-stat-label">Chờ xử lý</p></div>
        </div>
        <div className="qlht-stat-card" style={{ borderTop: '3px solid #3B82F6', cursor: 'pointer' }} onClick={() => setStatus('in_progress')}>
          <FaSpinner className="qlht-stat-icon" style={{ color: '#3B82F6' }} />
          <div><p className="qlht-stat-num" style={{ color: '#3B82F6' }}>{cntProgress}</p><p className="qlht-stat-label">Đang xử lý</p></div>
        </div>
        <div className="qlht-stat-card" style={{ borderTop: '3px solid #10B981', cursor: 'pointer' }} onClick={() => setStatus('resolved')}>
          <FaCheckCircle className="qlht-stat-icon" style={{ color: '#10B981' }} />
          <div><p className="qlht-stat-num" style={{ color: '#10B981' }}>{cntResolved}</p><p className="qlht-stat-label">Đã giải quyết</p></div>
        </div>
      </div>

      <div className={`qlht-main-layout ${selected ? 'has-panel' : ''}`}>
        <div className="qlht-table-section">
          <div className="qlht-filter-bar">
            <div className="qlht-search-wrap">
              <FaSearch className="qlht-search-icon" />
              <input
                className="qlht-search-input"
                placeholder="Tìm tên, email, SĐT, tiêu đề..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="qlht-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="All">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>

          {loading ? (
            <div className="qlht-loading"><FaSpinner className="spin" /> Đang tải dữ liệu...</div>
          ) : (
            <>
              <div className="table-container">
                <table className="admin-table qlht-table">
                  <thead>
                    <tr>
                      <th>Người gửi</th>
                      <th>Tiêu đề</th>
                      <th>Mã vé</th>
                      <th>Ngày gửi</th>
                       <th>Ngày cập nhật</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length > 0 ? pageItems.map(fb => (
                      <tr key={fb._id} className={`qlht-row ${selected?._id === fb._id ? 'qlht-row-active' : ''}`} onClick={() => openDetail(fb)}>
                        <td>
                          <div className="qlht-sender">
                            <div className="qlht-avatar">{(fb.hoTen || '?')[0].toUpperCase()}</div>
                            <div>
                              <div className="qlht-sender-name">{fb.hoTen}</div>
                              <div className="qlht-sender-email">{fb.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="qlht-title-cell">{fb.tieuDe}</td>
                        <td style={{ fontWeight: 600, color: '#1565C0' }}>{fb.maVe || '—'}</td>
                        <td className="qlht-date">{fmt(fb.createdAt)}</td>
                        <td className="qlht-date">{fb.updatedAt ? fmt(fb.updatedAt) : '—'}</td>
                        <td>
                          <span className={`qlht-status-badge ${stCfg(fb.trangThai).cls}`}>
                            {stCfg(fb.trangThai).icon} {stCfg(fb.trangThai).label}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="action-btns">
                            <button className="btn-action btn-delete" onClick={() => deleteFb(fb)} title="Xóa"><FaTrashAlt /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="qlht-empty">Không có yêu cầu hỗ trợ nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>Trước</button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} className={`page-btn ${safePage === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Sau</button>
                </div>
              )}
            </>
          )}
        </div>

        {selected && (
          <div className="qlht-detail-panel">
            <div className="qlht-panel-header">
              <h3>Chi tiết yêu cầu</h3>
              <button className="qlht-panel-close" onClick={() => setSelected(null)}><FaTimes /></button>
            </div>

            <div className="qlht-panel-section">
              <div className="qlht-panel-avatar-row">
                <div className="qlht-panel-avatar">{(selected.hoTen || '?')[0].toUpperCase()}</div>
                <div>
                  <p className="qlht-panel-name">{selected.hoTen}</p>
                  <span className={`qlht-status-badge ${stCfg(selected.trangThai).cls}`} style={{ fontSize: '11px' }}>
                    {stCfg(selected.trangThai).icon} {stCfg(selected.trangThai).label}
                  </span>
                </div>
              </div>
              <div className="qlht-panel-meta">
                <span><FaPhone /> {selected.soDienThoai || '—'}</span>
                <span><FaEnvelope /> {selected.email || '—'}</span>
                <span><FaCalendarAlt /> {fmt(selected.createdAt)}</span>
                {selected.maVe && <span style={{ color: '#1565C0', fontWeight: 700 }}>🎟️ Mã vé: {selected.maVe}</span>}
              </div>
            </div>

            <div className="qlht-panel-section">
              <p className="qlht-panel-sec-title">Nội dung hỗ trợ</p>
              <div className="qlht-msg-box">
                <p className="qlht-msg-subject">{selected.tieuDe}</p>
                <p className="qlht-msg-body">{selected.noiDung}</p>
              </div>
            </div>

            <div className="qlht-panel-section">
              <p className="qlht-panel-sec-title">Xử lý ticket</p>
              <label className="qlht-form-label">Cập nhật trạng thái</label>
              <select className="qlht-form-select" value={editStatus} onChange={e => setEditSt(e.target.value)}>
                <option value="open">⏳ Chờ xử lý (Open)</option>
                <option value="in_progress">🔄 Đang xử lý</option>
                <option value="resolved">✅ Đã giải quyết</option>
                <option value="closed">🔒 Đã đóng</option>
              </select>

              <label className="qlht-form-label" style={{ marginTop: '14px' }}>
                <FaReply style={{marginRight: '6px', color: '#3B82F6'}} /> Nội dung phản hồi khách hàng (Gửi qua Email)
              </label>
              <textarea
                className="qlht-form-textarea"
                rows={4}
                value={editPhanHoi}
                onChange={e => setEditPhanHoi(e.target.value)}
                placeholder="Nội dung khách hàng sẽ nhận được qua email..."
              />

              <label className="qlht-form-label" style={{ marginTop: '14px' }}>
                <FaStickyNote style={{marginRight: '6px', color: '#64748B'}} /> Ghi chú nội bộ (Chỉ Admin thấy)
              </label>
              <textarea
                className="qlht-form-textarea"
                rows={3}
                value={editGhiChu}
                onChange={e => setEditGhiChu(e.target.value)}
                placeholder="Nhập ghi chú xử lý nội bộ..."
              />

              <button className="qlht-save-btn" onClick={saveChanges}>
                <FaSave /> Cập nhật ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuanLyHoTro;
