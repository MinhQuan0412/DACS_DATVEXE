import React, { useState } from 'react';
import { FaPaperclip, FaCheckCircle } from 'react-icons/fa';
import './XacThucHoaDon.css';
import Swal from 'sweetalert2';

const XacThucHoaDon = () => {
  const [file, setFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVerify = () => {
    if (!file) {
      Swal.fire('Lưu ý', 'Vui lòng chọn file XML để xác thực!', 'warning');
      return;
    }
    
    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      Swal.fire({
        icon: 'success',
        title: 'Xác thực thành công',
        text: 'Hóa đơn điện tử của bạn là hợp lệ và đã được ký số chính xác.',
        confirmButtonColor: '#7c86e0'
      });
    }, 1500);
  };

  return (
    <div className="verify-invoice-container">
      <div className="verify-card">
        <h2 className="verify-title">Xác thực hóa đơn</h2>
        
        <div className="verify-form">
          <div className="file-input-wrapper">
            <input 
              type="text" 
              readOnly 
              placeholder={file ? file.name : "Chọn file XML"} 
              className="file-name-display"
            />
            <label htmlFor="xml-upload" className="file-upload-label">
              <FaPaperclip />
              <input 
                id="xml-upload" 
                type="file" 
                accept=".xml" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="verify-actions">
            <button 
              className="btn-verify-submit" 
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? 'Đang xác thực...' : 'Xác thực'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XacThucHoaDon;
