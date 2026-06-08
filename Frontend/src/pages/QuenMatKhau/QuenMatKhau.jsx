import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import authApi from '../../api/authApi';
import './QuenMatKhau.css';

const QuenMatKhau = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Input Phone, 2: OTP, 3: Reset Password, 4: Success
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const otpRefs = useRef([]);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    if (phoneNumber.trim().length < 10) {
      setError('Số điện thoại không hợp lệ');
      return;
    }
    setError('');
    
    try {
      await authApi.forgotPassword({ soDienThoai: phoneNumber });
      setCountdown(60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu khôi phục mật khẩu.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Vui lòng nhập đủ 6 số mã OTP');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleResendOtp = () => {
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }
    setError('');
    
    try {
      await authApi.resetPassword({
        soDienThoai: phoneNumber,
        otp: otp.join(''),
        matKhauMoi: newPassword,
        xacNhanMatKhauMoi: confirmPassword
      });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu.');
    }
  };

  const formatPhone = (p) => {
    if (p.length <= 4) return p;
    return p.slice(0, 4) + ' *** ' + p.slice(-3);
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2 className="forgot-title">Quên Mật Khẩu</h2>
        
        {step === 1 && (
          <>
            <p className="forgot-subtitle">Vui lòng nhập số điện thoại đã đăng ký để xác thực.</p>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleVerifyPhone} className="forgot-form">
              <div className="form-group">
                <input 
                  type="tel" 
                  placeholder="Nhập số điện thoại" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))} 
                  required 
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-forgot-submit">Gửi mã OTP</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="forgot-subtitle">
              Mã xác thực đã được gửi đến số <strong>{formatPhone(phoneNumber)}</strong>
            </p>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleOtpSubmit} className="forgot-form">
              <div className="forgot-otp-wrap" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`forgot-otp-input ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className="forgot-otp-resend">
                {countdown > 0 ? (
                  <span>Gửi lại mã sau <strong>{countdown}s</strong></span>
                ) : (
                  <button type="button" className="btn-link" onClick={handleResendOtp}>
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <button type="submit" className="btn-forgot-submit" disabled={otp.join('').length < 6}>
                Xác thực
              </button>
              <button type="button" className="btn-forgot-outline" onClick={() => setStep(1)}>
                Quay lại
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <p className="forgot-subtitle">Tạo mật khẩu mới cho tài khoản của bạn.</p>
            {error && <p className="error-text">{error}</p>}
            <form onSubmit={handleResetPassword} className="forgot-form">
              <div className="form-group">
                <input 
                  type="password" 
                  placeholder="Mật khẩu mới" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <input 
                  type="password" 
                  placeholder="Xác nhận mật khẩu mới" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-forgot-submit">Tạo Mật Khẩu Mới</button>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="forgot-success">
            <div className="success-icon">✓</div>
            <h3>Khôi phục thành công!</h3>
            <p>Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại với mật khẩu mới.</p>
            <button className="btn-forgot-submit" onClick={() => navigate('/dang-nhap')}>Đến trang đăng nhập</button>
          </div>
        )}

        {step !== 4 && (
          <div className="forgot-footer">
            <Link to="/dang-nhap">← Quay lại Đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuenMatKhau;
