import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchForm from '../../components/SearchForm/SearchForm';
import bookingApi from '../../api/bookingApi';
import socket from '../../utils/socket';
import './KetQuaTimKiem.css';

/* ========== SVG ICON GHẾ ========== */
const SeatIcon = ({ status }) => {
   let fill = '#f1f7fd', stroke = '#80bfff';
   if (status === 'sold')     { fill = '#e0e0e0'; stroke = '#ccc'; }
   if (status === 'selected') { fill = '#0060C4'; stroke = '#004b9b'; }
   return (
      <svg width="32" height="38" viewBox="0 0 46 56" xmlns="http://www.w3.org/2000/svg">
         <rect x="2" y="18" width="6" height="22" rx="3" fill={fill} stroke={stroke} strokeWidth="2"/>
         <rect x="38" y="18" width="6" height="22" rx="3" fill={fill} stroke={stroke} strokeWidth="2"/>
         <rect x="8" y="4" width="30" height="38" rx="8" fill={fill} stroke={stroke} strokeWidth="2"/>
         <path d="M11 42 v5 a4 4 0 0 0 4 4 h16 a4 4 0 0 0 4 -4 v-5 Z" fill={fill} stroke={stroke} strokeWidth="2"/>
      </svg>
   );
};

/* ========== SƠ ĐỒ GHẾ CHUẨN FUTA: Layout 2+1 ========== */
const FutaDeckMap = ({ title, seats, selectedSeats, onToggle }) => {
   const rows = [];
   for (let i = 0; i < seats.length; i += 3) {
      rows.push(seats.slice(i, i + 3));
   }

   const renderSeat = (s) => {
      if (!s) return null;
      const status = s.isBooked ? 'sold' : selectedSeats.includes(s.id) ? 'selected' : 'available';
      return (
         <div key={s.id} className={`seat-unit ${status}`} onClick={() => !s.isBooked && onToggle(s.id)}>
            <SeatIcon status={status} />
            <span className="seat-label">{s.id}</span>
         </div>
      );
   };

   return (
      <div className="futa-kq-deck">
         <h5>{title}</h5>
         <div className="futa-kq-rows">
            {rows.map((row, ri) => (
               <div key={ri} className={`futa-kq-row ${row.length === 2 ? 'last-row' : ''}`}>
                  <div className="futa-kq-pair">
                     {row.length === 2 ? renderSeat(row[0]) : row.slice(0, 2).map(s => renderSeat(s))}
                  </div>
                  <div className="futa-kq-single">
                     {row.length === 2 ? renderSeat(row[1]) : (row.length > 2 && renderSeat(row[2]))}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

const KetQuaTimKiem = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const searchState = location.state || { origin: '', destination: '', date: '', tickets: '1' };

   const [origin, setOrigin] = useState(searchState.origin);
   const [dest, setDest] = useState(searchState.destination);
   const [date, setDate] = useState(searchState.date);

   useEffect(() => {
      if (location.state) {
         setOrigin(location.state.origin);
         setDest(location.state.destination);
         setDate(location.state.date);
      }
   }, [location.state]);

   const [trips, setTrips] = useState([]);
   const [filteredTrips, setFilteredTrips] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const [selectedTripId, setSelectedTripId] = useState(null);

   const [expandedTripId, setExpandedTripId] = useState(null);
   const [activeTab, setActiveTab] = useState('chon_ghe');
   const [selectedSeats, setSelectedSeats] = useState([]);
   const [realSeats, setRealSeats] = useState({ lowerDeck: [], upperDeck: [] });
   const [tripStops, setTripStops] = useState(null);
   const [isLoadingSeats, setIsLoadingSeats] = useState(false);
   const [isLoadingStops, setIsLoadingStops] = useState(false);
   const [activeSort, setActiveSort] = useState('');

   const [timeFilter, setTimeFilter] = useState([]);
   const [typeFilter, setTypeFilter] = useState([]);

   useEffect(() => { fetchTrips(); }, [origin, dest, date]);

   const formatTime = (isoString) => {
      if (!isoString) return '--:--';
      try {
         const d = new Date(isoString);
         if (isNaN(d.getTime())) return '--:--';
         return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) { return '--:--'; }
   };

   const fetchTrips = async () => {
      setIsLoading(true);
      try {
         let formattedDate = date;
         if (date && date.includes('/')) {
            const [d, m, y] = date.split('/');
            formattedDate = `${y}-${m}-${d}`;
         }
         const res = await bookingApi.searchTrips({ diemDi: origin, diemDen: dest, ngay: formattedDate });
         const tripData = res?.data || (Array.isArray(res) ? res : []);
         const finalTrips = Array.isArray(tripData) ? tripData : [];
         // Debug: xem BE trả về field nào liên quan đến ghế
         if (finalTrips.length > 0) {
           const sample = finalTrips[0];
           console.log('🚌 Sample trip fields:', {
             tongSoGheTrong: sample.tongSoGheTrong,
             tongSoGhe: sample.tongSoGhe,
             gheDaDat: sample.gheDaDat?.length,
             tongSoGheDaDat: sample.tongSoGheDaDat,
             xeId_tongSoGhe: sample.xeId?.tongSoGhe,
           });
         }
         setTrips(finalTrips);
         setFilteredTrips(finalTrips);
      } catch (err) {
         console.error('Lỗi khi tìm chuyến:', err);
         setTrips([]);
         setFilteredTrips([]);
      } finally { setIsLoading(false); }
   };

   /* ===== API: Tạo sơ đồ ghế từ getTripDetail ===== */
   const [lockedSeats, setLockedSeats] = useState([]);
   const lockedSeatsRef = useRef(lockedSeats);
   useEffect(() => { lockedSeatsRef.current = lockedSeats; }, [lockedSeats]);

   const generateSeats = (bookedSeats = [], currentLocked = []) => {
      const lower = Array.from({ length: 17 }, (_, i) => {
         const id = `A${(i + 1).toString().padStart(2, '0')}`;
         return { id, isBooked: bookedSeats.includes(id) || currentLocked.includes(id) };
      });
      const upper = Array.from({ length: 17 }, (_, i) => {
         const id = `B${(i + 1).toString().padStart(2, '0')}`;
         return { id, isBooked: bookedSeats.includes(id) || currentLocked.includes(id) };
      });
      return { lowerDeck: lower, upperDeck: upper };
   };

   const fetchSeats = async (tripId) => {
      setIsLoadingSeats(true);
      try {
         const res = await bookingApi.getTripDetail(tripId);
         const data = res.data || res;
         setRealSeats(generateSeats(data.gheDaDat || [], lockedSeats));
      } catch (err) {
         console.error('Lỗi khi tải chỗ ngồi:', err);
         setRealSeats(generateSeats([], lockedSeats));
      } finally { setIsLoadingSeats(false); }
   };

   // Update realSeats whenever lockedSeats changes
   useEffect(() => {
      setRealSeats(prev => {
         const lower = prev.lowerDeck?.map(s => ({ ...s, isBooked: s.isBooked || lockedSeats.includes(s.id) })) || [];
         const upper = prev.upperDeck?.map(s => ({ ...s, isBooked: s.isBooked || lockedSeats.includes(s.id) })) || [];
         return { lowerDeck: lower, upperDeck: upper };
      });
   }, [lockedSeats]);

   useEffect(() => {
      if (!expandedTripId || activeTab !== 'chon_ghe') return;
      
      fetchSeats(expandedTripId);
      
      // Join realtime socket room
      socket.emit('joinTripRoom', expandedTripId);

      // Polling: làm mới ghế mỗi 5s để đồng bộ với người dùng khác
      const pollInterval = setInterval(() => fetchSeats(expandedTripId), 2000);
      
      socket.on('seat_locked', (data) => {
         const id = data.chuyenXeId || data.tripId || data.chuyenXe;
         const seats = data.danhSachGhe || data.seats || data.ghe || [];
         if (id === expandedTripId) {
            setLockedSeats(prev => [...new Set([...prev, ...seats])]);
            // Tự động bỏ chọn ghế nếu bị người khác khóa
            setSelectedSeats(prev => prev.filter(s => !seats.includes(s)));
         }
      });

      socket.on('seat_released', (data) => {
         const id = data.chuyenXeId || data.tripId || data.chuyenXe;
         const seats = data.danhSachGhe || data.seats || data.ghe || [];
         if (id === expandedTripId) {
            setLockedSeats(prev => prev.filter(seat => !seats.includes(seat)));
         }
      });

      socket.on('seatsUpdated', (data) => {
         const id = data.chuyenXeId || data.tripId || data.chuyenXe || data._id;
         const booked = data.bookedSeats || data.gheDaDat || [];
         if (id === expandedTripId || !id) {
            // Dùng ref để tránh stale closure
            setRealSeats(generateSeats(booked, lockedSeatsRef.current));
            setLockedSeats(prev => prev.filter(seat => !booked.includes(seat)));
         }
      });

      socket.on('booking_cancelled', (data) => {
         console.log('❌ [Socket] booking_cancelled received in KetQuaTimKiem:', data);
         const id = data.chuyenXeId || data.tripId || data.chuyenXe || data._id;
         const releasedSeats = data.gheTraLai || data.danhSachGhe || data.seats || data.ghe || [];

         if ((!id || id === expandedTripId) && releasedSeats.length > 0) {
            setLockedSeats(prev => prev.filter(seat => !releasedSeats.includes(seat)));
            setRealSeats(prev => {
               const lower = prev.lowerDeck?.map(s => ({ ...s, isBooked: s.isBooked && !releasedSeats.includes(s.id) })) || [];
               const upper = prev.upperDeck?.map(s => ({ ...s, isBooked: s.isBooked && !releasedSeats.includes(s.id) })) || [];
               return { lowerDeck: lower, upperDeck: upper };
            });
         }
      });

      return () => {
         clearInterval(pollInterval);
         socket.emit('leaveTripRoom', expandedTripId);
         socket.off('seat_locked');
         socket.off('seat_released');
         socket.off('seatsUpdated');
         socket.off('booking_cancelled');
      };
   }, [expandedTripId, activeTab]);

   const fetchStops = async (tripId) => {
      setIsLoadingStops(true);
      try {
         const res = await bookingApi.getTripDetail(tripId);
         const data = res.data || res;
         setTripStops({
            tuyenXe: `${data.tuyenXeId?.diemDi} - ${data.tuyenXeId?.diemDen}`,
            diemDon: data.diemDon || [],
            diemTra: data.diemTra || []
         });
      } catch (err) {
         console.error('Lỗi khi tải lịch trình:', err);
         setTripStops(null);
      } finally { setIsLoadingStops(false); }
   };

   const toggleSeat = (seatId) => {
      const isSelected = selectedSeats.includes(seatId);
      setSelectedSeats(prev => isSelected ? prev.filter(s => s !== seatId) : [...prev, seatId]);
      
      // Emit socket event
      socket.emit(isSelected ? 'seat_released' : 'seat_locked', {
         chuyenXeId: expandedTripId,
         danhSachGhe: [seatId]
      });
   };

   const getPriceNum = (priceVal) => {
      if (typeof priceVal === 'number') return priceVal;
      if (typeof priceVal === 'string') return parseFloat(priceVal.replace(/[^\d]/g, '') || 0);
      return 0;
   };

   useEffect(() => {
      let result = [...trips];
      
      // 1. Loại bỏ các chuyến xe đã hết chỗ trống
      result = result.filter(t => {
        // Ưu tiên dùng field tongSoGheTrong nếu BE trả về
        if (typeof t.tongSoGheTrong === 'number') return t.tongSoGheTrong > 0;
        // Fallback: tính từ tongSoGhe - số ghế đã đặt
        const total = t.tongSoGhe || t.xeId?.tongSoGhe || 34;
        const booked = t.gheDaDat?.length || t.tongSoGheDaDat || 0;
        return (total - booked) > 0;
      });

      // 2. Lọc theo giờ
      if (timeFilter.length > 0) {
         result = result.filter(t => {
            const hour = parseInt(formatTime(t.thoiGianKhoiHanh).split(':')[0]);
            if (timeFilter.includes('morning') && hour >= 6 && hour < 12) return true;
            if (timeFilter.includes('afternoon') && hour >= 12 && hour < 18) return true;
            if (timeFilter.includes('evening') && hour >= 18 && hour < 24) return true;
            return false;
         });
      }
      
      // 3. Lọc theo loại xe
      if (typeFilter.length > 0) {
         result = result.filter(t => typeFilter.some(type => t.xeId?.loaiXe?.includes(type) || t.loaiXe?.includes(type)));
      }
      
      // 4. Sắp xếp
      if (activeSort === 'price') result.sort((a, b) => getPriceNum(a.giaVe || a.tuyenXeId?.giaVe) - getPriceNum(b.giaVe || b.tuyenXeId?.giaVe));
      else if (activeSort === 'time') result.sort((a, b) => (a.thoiGianKhoiHanh || '').localeCompare(b.thoiGianKhoiHanh || ''));
      else if (activeSort === 'seats') result.sort((a, b) => (b.tongSoGheTrong || 0) - (a.tongSoGheTrong || 0));
      
      setFilteredTrips(result);
   }, [trips, timeFilter, typeFilter, activeSort]);

   const toggleTimeFilter = (g) => setTimeFilter(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
   const toggleTypeFilter = (t) => setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
   const clearFilters = () => { setTimeFilter([]); setTypeFilter([]); };

   const selectedTrip = trips.find(t => t._id === selectedTripId || t.maChuyen === selectedTripId);

   return (
      <div className="search-results-page fade-in">
         <div className="search-ad-banner">
            <div className="ad-img-wrapper">
               <img src="/commercial_bus_banner_wide_new.png" alt="BlueBus Ads" className="ad-img" />
            </div>
         </div>

         <div className="search-form-section">
            <div className="container">
               <SearchForm initialOrigin={origin} initialDest={dest} initialDate={date} initialTickets={searchState.tickets} />
            </div>
         </div>

         <div className="container search-layout-grid">
            <div className="sidebar-container">
               {selectedTripId && (
                  <div className="user-trip-card fade-in">
                     <div className="ut-header"><h3>CHUYẾN ĐI CỦA BẠN</h3></div>
                     <div className="ut-body">
                        <div className="ut-date-info">
                           <div className="ut-badge">1</div>
                           <div className="ut-date-text">
                              <strong>{date}</strong>
                              <span>{origin} - {dest}</span>
                           </div>
                        </div>
                        <div className="ut-timeline">
                           <span className="ut-time">{selectedTrip ? formatTime(selectedTrip.thoiGianKhoiHanh) : '--:--'} <span className="status-dot origin-dot">●</span></span>
                           <div className="ut-line"></div>
                           <span className="ut-time"><span className="status-pin dest-pin">📍</span> {selectedTrip ? formatTime(selectedTrip.thoiGianDen) : '--:--'}</span>
                        </div>
                     </div>
                  </div>
               )}

               <div className="search-sidebar">
                  <div className="filter-header">
                     <h3>BỘ LỌC TÌM KIẾM</h3>
                     <span className="clear-filters" onClick={clearFilters}>Bỏ lọc 🗑️</span>
                  </div>
                  <div className="filter-section">
                     <h4>Giờ đi</h4>
                     <label className="checkbox-label"><input type="checkbox" checked={timeFilter.includes('morning')} onChange={() => toggleTimeFilter('morning')} /> Buổi sáng 06:00 - 12:00</label>
                     <label className="checkbox-label"><input type="checkbox" checked={timeFilter.includes('afternoon')} onChange={() => toggleTimeFilter('afternoon')} /> Buổi chiều 12:00 - 18:00</label>
                     <label className="checkbox-label"><input type="checkbox" checked={timeFilter.includes('evening')} onChange={() => toggleTimeFilter('evening')} /> Buổi tối 18:00 - 24:00</label>
                  </div>
                  <div className="filter-section">
                     <h4>Loại xe</h4>
                     <div className="filter-button-group">
                        <button className={typeFilter.includes('Ghế') ? 'active' : ''} onClick={() => toggleTypeFilter('Ghế')}>Ghế</button>
                        <button className={typeFilter.includes('Giường') ? 'active' : ''} onClick={() => toggleTypeFilter('Giường')}>Giường</button>
                        <button className={typeFilter.includes('Limousine') ? 'active' : ''} onClick={() => toggleTypeFilter('Limousine')}>Limousine</button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="search-main-results">
               <div className="results-title-bar">
                  <h2>{origin} - {dest} ({filteredTrips.length})</h2>
                  <div className="sort-tabs bb-sort-tabs">
                     <button className={`sort-btn ${activeSort === 'price' ? 'active-sort' : ''}`} onClick={() => setActiveSort('price')}>Giá rẻ</button>
                     <button className={`sort-btn ${activeSort === 'time' ? 'active-sort' : ''}`} onClick={() => setActiveSort('time')}>Giờ đi</button>
                     <button className={`sort-btn ${activeSort === 'seats' ? 'active-sort' : ''}`} onClick={() => setActiveSort('seats')}>Ghế trống</button>
                  </div>
               </div>

               <div className="trips-list">
                  {isLoading ? (
                     <div style={{ padding: '50px', textAlign: 'center' }}>Đang tìm chuyến xe...</div>
                  ) : filteredTrips.length === 0 ? (
                     <div className="empty-results-container">
                        <div className="empty-results">
                           <img src="https://storage.googleapis.com/futa-busline-cms-dev/empty_state_4bb09a25b3.svg" alt="No routes" />
                           <p>Không tìm thấy chuyến xe phù hợp cho ngày này.</p>
                        </div>
                     </div>
                  ) : (
                     filteredTrips.map((trip) => {
                        const tripId = trip._id || trip.maChuyen;
                        const priceStr = trip.giaVe || trip.tuyenXeId?.giaVe || '0';
                        const distStr = trip.tuyenXeId?.khoangCach || '300 km';
                        const loaiXe = trip.xeId?.loaiXe || trip.loaiXe || 'Limousine';

                        return (
                           <div key={tripId} className={`futa-trip-card ${selectedTripId === tripId ? 'active-trip' : ''}`} onClick={() => setSelectedTripId(tripId)}>
                              <div className="trip-flight-row">
                                 <div className="tf-main-col">
                                    <div className="tf-time-row">
                                       <div className="tf-time-group start">
                                          <span className="tf-time">{formatTime(trip.thoiGianKhoiHanh)}</span>
                                          <span className="tf-dot origin"></span>
                                       </div>
                                       <div className="tf-duration-dashed">
                                          <span>{distStr}</span>
                                          <div className="dashed-line"></div>
                                       </div>
                                       <div className="tf-time-group end">
                                          <span className="tf-icon dest">📍</span>
                                          <span className="tf-time">{formatTime(trip.thoiGianDen)}</span>
                                       </div>
                                    </div>
                                    <div className="tf-station-row">
                                       <span className="tf-station start">{trip.tuyenXeId?.diemDi}</span>
                                       <span className="tf-station end">{trip.tuyenXeId?.diemDen}</span>
                                    </div>
                                 </div>
                                 <div className="tf-side-col">
                                    <div className="tf-type-seats">
                                       <span className="dot-gray">•</span> {loaiXe} <span className="dot-gray">•</span> <span className="text-blue">{trip.tongSoGheTrong} chỗ trống</span>
                                    </div>
                                    <div className="tf-price">
                                       {getPriceNum(priceStr).toLocaleString('vi-VN')} <span className="price-unit">đ</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="trip-bottom-actions">
                                 <div className="trip-links">
                                    <span className={expandedTripId === tripId && activeTab === 'chon_ghe' ? 'active-link' : ''} onClick={(e) => { e.stopPropagation(); setExpandedTripId(expandedTripId === tripId ? null : tripId); setActiveTab('chon_ghe'); fetchSeats(tripId); setSelectedSeats([]); }}>Chọn ghế</span>
                                    <span className={expandedTripId === tripId && activeTab === 'lich_trinh' ? 'active-link' : ''} onClick={(e) => { e.stopPropagation(); setExpandedTripId(expandedTripId === tripId ? null : tripId); setActiveTab('lich_trinh'); fetchStops(tripId); }}>Lịch trình</span>
                                 </div>
                                 <button className="btn-book-action" onClick={(e) => { e.stopPropagation(); navigate('/dat-ve', { state: { trip } }); }}>Chọn chuyến</button>
                              </div>

                              {expandedTripId === tripId && (
                                 <div className="trip-expanded-section" onClick={(e) => e.stopPropagation()}>
                                    {activeTab === 'chon_ghe' && (
                                       <div className="tab-pane seat-pane">
                                          {isLoadingSeats ? <div style={{padding:'20px',textAlign:'center'}}>Đang tải chỗ ngồi...</div> : (
                                             <div className="futa-kq-seats-section">
                                                <FutaDeckMap title="Tầng dưới" seats={realSeats.lowerDeck || []} selectedSeats={selectedSeats} onToggle={toggleSeat} />
                                                <FutaDeckMap title="Tầng trên" seats={realSeats.upperDeck || []} selectedSeats={selectedSeats} onToggle={toggleSeat} />
                                                <div className="futa-kq-legend">
                                                   <div className="legend-row"><SeatIcon status="sold" /> <span>Đã bán</span></div>
                                                   <div className="legend-row"><SeatIcon status="available" /> <span>Còn trống</span></div>
                                                   <div className="legend-row"><SeatIcon status="selected" /> <span>Đang chọn</span></div>
                                                </div>
                                             </div>
                                          )}
                                          <div className="seat-pane-footer" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                             <div className="spf-left">
                                                <div className="selected-info">
                                                   <span>Số ghế: <strong>{selectedSeats.join(', ') || 'Chưa chọn'}</strong></span>
                                                   <span style={{ marginLeft: '15px' }}>Tổng tiền: <strong style={{ color: '#0060C4' }}>{(selectedSeats.length * getPriceNum(priceStr)).toLocaleString('vi-VN')}đ</strong></span>
                                                </div>
                                             </div>
                                             <div className="spf-right">
                                                <button className="btn-book-action active-book-btn" disabled={selectedSeats.length === 0} onClick={() => navigate('/dat-ve', { state: { trip, selectedSeats } })}>Tiếp tục</button>
                                             </div>
                                          </div>
                                       </div>
                                    )}
                                    {activeTab === 'lich_trinh' && (
                                       <div className="tab-pane timeline-pane">
                                          {isLoadingStops ? <div className="loading-stops">Đang tải lịch trình...</div> : !tripStops ? <div className="no-stops">Không có thông tin lịch trình.</div> : (
                                             <div className="bb-timeline-wrapper">
                                                <div className="bb-timeline-header">
                                                   <h4 className="bb-timeline-route-title">{tripStops.tuyenXe}</h4>
                                                   <span className="bb-timeline-hint">Dự kiến có thể thay đổi tùy tình hình giao thông</span>
                                                </div>
                                                <div className="bb-timeline-list">
                                                   {tripStops.diemDon?.map((stop, idx) => (
                                                      <div key={stop._id || idx} className="bb-timeline-item origin">
                                                         <div className="bb-timeline-left">
                                                            <div className="bb-stop-time">{idx === 0 ? formatTime(trip.thoiGianKhoiHanh) : ''}</div>
                                                         </div>
                                                         <div className="bb-timeline-center">
                                                            <div className="bb-timeline-dot origin"></div>
                                                            <div className="bb-timeline-line blue"></div>
                                                         </div>
                                                         <div className="bb-timeline-right">
                                                            <div className="bb-stop-name">{stop.tenDiem}</div>
                                                            <div className="bb-stop-addr">{stop.diaChi}</div>
                                                         </div>
                                                      </div>
                                                   ))}
                                                   {tripStops.diemTra?.map((stop, idx) => {
                                                      const isLast = idx === tripStops.diemTra.length - 1;
                                                      return (
                                                         <div key={stop._id || idx} className="bb-timeline-item dest">
                                                            <div className="bb-timeline-left">
                                                               <div className="bb-stop-time">{isLast ? formatTime(trip.thoiGianDen) : ''}</div>
                                                            </div>
                                                            <div className="bb-timeline-center">
                                                               <div className="bb-timeline-dot dest"></div>
                                                               {!isLast && <div className="bb-timeline-line red"></div>}
                                                            </div>
                                                            <div className="bb-timeline-right">
                                                               <div className="bb-stop-name">{stop.tenDiem}</div>
                                                               <div className="bb-stop-addr">{stop.diaChi}</div>
                                                            </div>
                                                         </div>
                                                      );
                                                   })}
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        )
                     })
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default KetQuaTimKiem;
