import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import authApi from '../../api/authApi';
import { FaUser, FaEnvelope } from 'react-icons/fa';
import './DangKy.css';

const DangKy = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [animDir, setAnimDir] = useState('forward');

  const otpRefs = useRef([]);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const goToStep = (nextStep) => {
    setAnimDir(nextStep > step ? 'forward' : 'backward');
    setStep(nextStep);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      alert('Vui lòng nhập số điện thoại hợp lệ (ít nhất 10 số)');
      return;
    }
    
    // Hiện loading
    Swal.fire({
      title: 'Đang gửi yêu cầu...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      await authApi.sendOtp({ soDienThoai: phone });
      Swal.close();
      setCountdown(60);
      goToStep(2);
    } catch (error) {
      Swal.close();
      console.error('Registration Error:', error);
      const msg = error.message || error.error || error.msg || (typeof error === 'string' ? error : 'Không thể kết nối tới máy chủ ngrok. Vui lòng kiểm tra xem Backend đã bật chưa.');
      Swal.fire('Lỗi', msg, 'error');
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
      alert('Vui lòng nhập đủ 6 số mã OTP');
      return;
    }
    goToStep(3);
  };

  const handleResendOtp = () => {
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, text: 'Yếu', color: '#ef4444' };
    if (score <= 2) return { level: 2, text: 'Trung bình', color: '#eab308' };
    if (score <= 3) return { level: 3, text: 'Khá', color: '#3b82f6' };
    return { level: 4, text: 'Mạnh', color: '#22c55e' };
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    goToStep(4);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!fullName.trim()) {
      alert('Vui lòng nhập họ tên!');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ!');
      return;
    }
    
    try {
      await authApi.register({
        soDienThoai: phone,
        otp: otp.join(''),
        hoTen: fullName,
        matKhau: password,
        xacNhanMatKhau: confirmPassword,
        email: email
      });
      
      Swal.fire('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', 'success').then(() => {
        navigate('/dang-nhap');
      });
    } catch (error) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể đăng ký tài khoản.', 'error');
    }
  };

  const strength = getPasswordStrength(password);

  const formatPhone = (p) => {
    if (p.length <= 4) return p;
    return p.slice(0, 4) + ' *** ' + p.slice(-3);
  };

  const stepLabels = ['Số điện thoại', 'Xác thực', 'Mật khẩu', 'Thông tin'];

  return (
    <div className="rg-page">
      <div className="rg-wrapper">
        {/* Right panel - form */}
        <div className="rg-right">
          {/* Tabs */}
          <div className="rg-tabs">
            <div className="rg-tab" onClick={() => navigate('/dang-nhap')}>Đăng nhập</div>
            <div className="rg-tab rg-tab--active">Đăng ký</div>
          </div>

          {/* Form body */}
          <div className="rg-form-area">
            <div className={`rg-slide rg-slide--${animDir}`} key={step}>

              {/* Step 1 */}
              {step === 1 && (
                <form onSubmit={handlePhoneSubmit}>
                  <div className="rg-field">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                      autoFocus
                      maxLength={12}
                    />
                  </div>

                  <button type="submit" className="rg-btn rg-btn--primary">Gửi mã OTP</button>

                  <p className="rg-switch">
                    Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
                  </p>
                </form>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <form onSubmit={handleOtpSubmit}>
                  <h3 className="rg-form-title">Xác thực OTP</h3>
                  <p className="rg-form-desc">
                    Mã xác thực đã được gửi đến số <strong>{formatPhone(phone)}</strong>
                  </p>
                  <div className="rg-otp-wrap" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`rg-otp-input ${digit ? 'filled' : ''}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <div className="rg-otp-resend">
                    {countdown > 0 ? (
                      <span>Gửi lại mã sau <strong>{countdown}s</strong></span>
                    ) : (
                      <button type="button" className="rg-link-btn" onClick={handleResendOtp}>
                        Gửi lại mã OTP
                      </button>
                    )}
                  </div>

                  <button type="submit" className="rg-btn rg-btn--primary" disabled={otp.join('').length < 6}>
                    Xác thực
                  </button>
                </form>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <form onSubmit={handlePasswordSubmit}>
                  <h3 className="rg-form-title">Tạo mật khẩu</h3>
                  <p className="rg-form-desc">Thiết lập mật khẩu bảo mật cho tài khoản</p>

                  <div className="rg-field">
                    <label>Mật khẩu</label>
                    <div className="rg-field-pwd">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                      />
                      <button type="button" className="rg-pwd-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>

                  <div className="rg-field">
                    <label>Xác nhận mật khẩu</label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="rg-btn rg-btn--primary">Tiếp tục</button>
                  <button type="button" className="rg-btn rg-btn--outline" onClick={() => goToStep(2)}>Quay lại</button>
                </form>
              )}

              {/* Step 4: Info */}
              {step === 4 && (
                <form onSubmit={handleRegisterSubmit}>
                  <h3 className="rg-form-title">Thông tin khách hàng</h3>
                  <p className="rg-form-desc">Hoàn tất thông tin cá nhân của bạn</p>

                  <div className="rg-field">
                    <label>Họ và tên</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="rg-field">
                    <label>Email liên hệ</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="rg-terms" style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px' }}>
                      <input type="checkbox" required /> Tôi đồng ý với Điều khoản & Chính sách
                    </label>
                  </div>

                  <button type="submit" className="rg-btn rg-btn--success">Hoàn tất đăng ký</button>
                  <button type="button" className="rg-btn rg-btn--outline" onClick={() => goToStep(3)}>Quay lại</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DangKy;
