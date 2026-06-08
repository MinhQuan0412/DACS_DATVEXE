import React from 'react';
import './ChinhSach.css';

const ChinhSach = () => {
  return (
    <div className="policy-container">
      <div className="policy-sidebar">
        <ul className="policy-nav">
          <li className="active"><a href="#dieukhoan">Điều khoản sử dụng</a></li>
          <li><a href="#thanhtoan">Chính sách thanh toán</a></li>
          <li><a href="#huyve">Chính sách hủy và đổi vé</a></li>
          <li><a href="#baomat">Chính sách bảo mật</a></li>
        </ul>
      </div>

      <div className="policy-content">
        <h1>Chính Sách & Điều Khoản</h1>
        <p className="last-updated">Cập nhật lần cuối: 01/11/2026</p>

        <div className="policy-section" id="dieukhoan">
          <h2>1. Điều khoản sử dụng</h2>
          <p>
            Chào mừng bạn đến với hệ thống đặt vé trực tuyến của chúng tôi. 
            Việc người dùng truy cập, sử dụng, hoặc thao tác trên website đồng nghĩa với việc 
            bạn đã đọc, hiểu và đồng ý tuân thủ các quy định dưới đây.
          </p>
          <ul>
            <li>Người dùng chịu trách nhiệm cung cấp thông tin chính xác khi đặt vé.</li>
            <li>Chúng tôi có quyền từ chối phục vụ nếu phát hiện gian lận hoặc dùng thông tin sai lệch.</li>
            <li>Trẻ em dưới 6 tuổi đi cùng người ghép ghế không phải mua vé.</li>
          </ul>
        </div>

        <div className="policy-section" id="thanhtoan">
          <h2>2. Chính sách thanh toán</h2>
          <p>Hệ thống hỗ trợ nhiều phương thức thanh toán an toàn, bảo mật tuyệt đối cho mọi giao dịch.</p>
          <ul>
            <li>Ví điện tử: Momo, VNPay, ZaloPay...</li>
            <li>Thẻ tín dụng / Ghi nợ: Visa, MasterCard, JCB.</li>
            <li>Thanh toán COD tại quầy (chỉ áp dụng đối với một số tuyến cụ thể và cần xác nhận trước).</li>
          </ul>
          <div className="highlight-box">
            Lưu ý: Vé chỉ có hiệu lực khi quá trình thanh toán hoàn tất 100%. Quý khách sẽ nhận được Email hoặc SMS xác nhận kèm Mã Vé.
          </div>
        </div>

        <div className="policy-section" id="huyve">
          <h2>3. Chính sách hủy vé và đổi vé</h2>
          <p>Chúng tôi luôn tạo điều kiện tốt nhất cho khách hàng thay đổi lịch trình khi kết hợp cùng các công ty vận tải đối tác.</p>
          <table className="policy-table">
            <thead>
              <tr>
                <th>Thời gian hủy vé (trước khi khởi hành)</th>
                <th>Phí hủy vé</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Trên 24 tiếng</td>
                <td>Miễn phí (Hoàn 100% tiền)</td>
              </tr>
              <tr>
                <td>Từ 12 tiếng tới 24 tiếng</td>
                <td>30% giá vé</td>
              </tr>
              <tr>
                <td>Từ 4 tiếng tới 12 tiếng</td>
                <td>50% giá vé</td>
              </tr>
              <tr>
                <td>Dưới 4 tiếng</td>
                <td>Không hỗ trợ hoàn tiền</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="policy-section" id="baomat">
          <h2>4. Chính sách bảo mật</h2>
          <p>
            Chúng tôi cam kết sử dụng thông tin của quý khách hàng (họ tên, email, sđt) 
            hoàn toàn cho mục đích đặt vé xe và thông báo thay đổi lịch trình (nếu có). 
            Mọi hành vi trao đổi, mua bán thông tin cho bên thứ 3 đều không được phép trên hệ thống này.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChinhSach;
