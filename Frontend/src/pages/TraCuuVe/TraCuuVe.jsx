import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPhoneAlt, FaTicketAlt, FaSearch } from 'react-icons/fa';
import '../HoaDon/TraCuuHoaDon.css';

const TraCuuVe = () => {
  const [ticketCode, setTicketCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Tra cứu vé:", ticketCode, phoneNumber);
    // Chuyển hướng sang trang hóa đơn với mã vé
    navigate(`/hoa-don?code=${ticketCode}`);
  };

  return (
    <div className="lookup-container" style={{ minHeight: 'calc(100vh - 100px)', alignItems: 'flex-start', paddingTop: '60px' }}>
      <div className="lookup-card fade-in">
        <h2 className="lookup-title">Tra cứu thông tin đặt vé</h2>
        
        <form onSubmit={handleSearch} className="lookup-form">
          
          <div className="lookup-input-group">
            <div className="input-icon-box">
              <FaPhoneAlt />
            </div>
            <input 
              type="tel" 
              placeholder="Nhập số điện thoại đặt vé" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          
          <div className="lookup-input-group">
            <div className="input-icon-box">
              <FaTicketAlt />
            </div>
            <input 
              type="text" 
              placeholder="Nhập mã vé (VD: VE-123456789)" 
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-lookup-submit" style={{ marginTop: '20px' }}>
            <FaSearch /> Tra cứu ngay
          </button>
          
          <div className="lookup-note">
            <p>Vui lòng cung cấp chính xác thông tin <strong>Số điện thoại</strong> và <strong>Mã vé</strong> đã được gửi về email hoặc tin nhắn SMS của quý khách để tra cứu.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraCuuVe;
