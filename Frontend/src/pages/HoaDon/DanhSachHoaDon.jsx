import React, { useState, useEffect } from 'react';
import { FaPaperclip, FaSyncAlt, FaTicketAlt } from 'react-icons/fa';
import bookingApi from '../../api/bookingApi';
import Swal from 'sweetalert2';
import './DanhSachHoaDon.css';

const DanhSachHoaDon = () => {
  const [captchaData, setCaptchaData] = useState({ image: '', token: '' });
  const [userInput, setUserInput] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy Captcha thực tế từ Backend
  const fetchCaptcha = async () => {
    try {
      const res = await bookingApi.getCaptcha();
      // Giả sử backend trả về: { captcha: "base64...", captchaToken: "..." }
      setCaptchaData({
        image: res.data?.captcha || res.captcha,
        token: res.data?.captchaToken || res.captchaToken
      });
    } catch (err) {
      console.error('Lỗi lấy captcha:', err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleVerify = async () => {
    if (!ticketCode) {
      Swal.fire('Lỗi', 'Vui lòng nhập mã vé cần xác thực!', 'error');
      return;
    }
    if (!userInput) {
      Swal.fire('Lỗi', 'Vui lòng nhập mã xác thực (Captcha)!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        maVe: ticketCode,
        captchaInput: userInput,
        captchaToken: captchaData.token
      };
      
      const res = await bookingApi.verifyInvoice(payload);
      
      Swal.fire({
        title: 'Xác thực thành công!',
        text: 'Hóa đơn này là hợp lệ trên hệ thống BlueBus.',
        icon: 'success',
        confirmButtonText: 'Xem chi tiết'
      }).then(() => {
        window.location.href = `/hoa-don?code=${ticketCode}`;
      });

    } catch (err) {
      console.error('Lỗi xác thực:', err);
      const msg = err.response?.data?.message || 'Mã xác thực không đúng hoặc mã vé không tồn tại.';
      Swal.fire('Thất bại', msg, 'error');
      fetchCaptcha(); // Refresh captcha on failure
      setUserInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h2 className="verify-title">Xác thực hóa đơn</h2>
        
        <div className="verify-form">
          {/* Ticket Code Input */}
          <div className="ticket-input-wrapper">
             <div className="input-with-icon">
                <FaTicketAlt className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Nhập mã vé (Ví dụ: VE-123...)" 
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                />
             </div>
          </div>

          {/* File Input (Optional/UI Decoration) */}
          <div className="file-input-wrapper">
            <input 
              type="text" 
              placeholder="Chọn file XML (Không bắt buộc)" 
              readOnly 
              value={selectedFile ? selectedFile.name : ''} 
            />
            <label htmlFor="xml-upload" className="file-icon-btn">
              <FaPaperclip />
            </label>
            <input 
              id="xml-upload" 
              type="file" 
              accept=".xml" 
              style={{display:'none'}} 
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>

          {/* Captcha Row */}
          <div className="captcha-row">
            <div className="captcha-img-box">
               {captchaData.image ? (
                 <img src={captchaData.image} alt="Captcha" />
               ) : (
                 <div className="captcha-placeholder">Đang tải...</div>
               )}
            </div>
            <button className="refresh-btn" onClick={fetchCaptcha} disabled={isLoading}>
              <FaSyncAlt className={isLoading ? 'spin' : ''} />
            </button>
          </div>

          {/* Input Captcha */}
          <div className="captcha-input-wrapper">
            <input 
              type="text" 
              placeholder="Nhập mã xác thực" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button 
            className="submit-verify-btn" 
            onClick={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DanhSachHoaDon;
