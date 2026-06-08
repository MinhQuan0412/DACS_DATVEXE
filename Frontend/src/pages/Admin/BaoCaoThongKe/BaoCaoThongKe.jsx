import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../AdminShared.css';
import './BaoCaoThongKe.css';
import { FaTicketAlt, FaBusAlt, FaMoneyBillWave, FaChartPie } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminApi from '../../../api/adminApi';

const BaoCaoThongKe = () => {
  const context = useOutletContext();
  const userRole = context?.userRole || 'Admin';
  
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getDashboardStats();
      console.log('Stats Response:', data);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải báo cáo thống kê...</div>;

  const { summary, dailyStats, topRoutes, routeDetails, statusDistribution } = stats || {};

  // Map charts
  const chartData = (dailyStats || []).map(s => ({
    date: s._id,
    tickets: s.tickets,
    revenue: s.revenue / 1000000 // sang triệu
  }));

  const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '15px' }}>
        <h2 style={{ color: '#1565C0' }}>Báo Cáo Thống Kê</h2>
      </div>

      <div className="bao-cao-container">
        {/* Overview Cards */}
        <div className="bc-overview-cards">
          <div className="overview-card">
            <div className="oc-icon blue"><FaTicketAlt /></div>
            <div className="oc-info">
              <h4>Tổng vé đã bán</h4>
              <p>{summary?.totalTickets || 0}</p>
            </div>
          </div>
          
          <div className="overview-card trips">
            <div className="oc-icon orange"><FaBusAlt /></div>
            <div className="oc-info">
              <h4>Tổng chuyến thành công</h4>
              <p>{summary?.totalTrips || 0}</p>
            </div>
          </div>

          {userRole === 'Admin' && (
            <div className="overview-card revenue fade-in">
              <div className="oc-icon green"><FaMoneyBillWave /></div>
              <div className="oc-info">
                <h4>Tổng doanh thu</h4>
                <p>{(summary?.totalRevenue / 1000000).toFixed(1)} Tr</p>
              </div>
            </div>
          )}

          <div className="overview-card cancelled">
            <div className="oc-icon red"><FaChartPie /></div>
            <div className="oc-info">
              <h4>Doanh thu hôm nay</h4>
              <p>{((summary?.todayRevenue || 0) / 1000000).toFixed(1)} Tr</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bc-charts-wrapper">
          <div className="bc-chart-row">
            <div className="chart-box">
              <h3>Số vé bán theo ngày</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f5f5f5'}} />
                    <Bar dataKey="tickets" fill="#1565C0" name="Số vé" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {userRole === 'Admin' && (
              <div className="chart-box fade-in">
                <h3>Doanh thu theo ngày (Triệu VNĐ)</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={3} name="Doanh thu" dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tables */}
        <div className="bc-tables-row">
          <div className="table-box">
            <h3>Chi tiết theo tuyến đường</h3>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên Tuyến</th>
                    <th>Số Chuyến</th>
                    <th>Số Vé Bán</th>
                    {userRole === 'Admin' && <th>Doanh Thu</th>}
                  </tr>
                </thead>
                <tbody>
                  {(routeDetails || []).map((route, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'bold', color: '#1565C0' }}>{route.tenTuyen}</td>
                      <td>{route.soChuyen}</td>
                      <td>{route.soVe}</td>
                      {userRole === 'Admin' && <td style={{ color: '#E53935', fontWeight: 'bold' }}>{formatCurrency(route.doanhThu)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-box">
            <h3>Thống kê trạng thái vé</h3>
            <div style={{ marginTop: '20px' }}>
              {(statusDistribution || []).map((s, i) => (
                <div className="status-stat" key={i}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong>{s._id.toUpperCase()}</strong>
                  </span>
                  <span>{s.count} vé</span>
                </div>
              ))}
              
              <div style={{ marginTop: '30px', background: '#f5f5f5', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Tổng cộng</p>
                <h3 style={{ margin: 0, color: '#1565C0' }}>{summary?.totalTickets || 0} vé</h3>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BaoCaoThongKe;
