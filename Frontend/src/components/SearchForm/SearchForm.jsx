import React, { useState, useRef, useEffect } from 'react';
import './SearchForm.css';
import { FaExchangeAlt, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import bookingApi from '../../api/bookingApi';

const RECENT_SEARCHES_DATA = [
  { origin: 'Bạc Liêu', dest: 'Cần Thơ', date: '20/05/2026' },
  { origin: 'Hồ Chí Minh', dest: 'Đà Lạt', date: '21/05/2026' }
];

const SearchForm = ({ 
  initialOrigin = '', 
  initialDest = '', 
  initialDate = '', 
  initialTickets = '1' 
}) => {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = `${today.getDate() < 10 ? '0' + today.getDate() : today.getDate()}/${today.getMonth() + 1 < 10 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1}/${today.getFullYear()}`;

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDest);
  const [date, setDate] = useState(initialDate || todayStr);
  const [tickets, setTickets] = useState(initialTickets);

  // Filter recent searches to only show future ones
  const recentSearches = RECENT_SEARCHES_DATA.filter(item => {
    const [d, m, y] = item.date.split('/');
    const searchDate = new Date(y, m - 1, d);
    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return searchDate >= todayNoTime;
  });

  // Dynamic Locations from API
  const [availableOrigins, setAvailableOrigins] = useState([]);
  const [availableDests, setAvailableDests] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoadingLocations(true);
      try {
        const routes = await bookingApi.getRoutes();
        const origins = [...new Set(routes.map(r => r.diemDi))];
        const dests = [...new Set(routes.map(r => r.diemDen))];
        setAvailableOrigins(origins);
        setAvailableDests(dests);
      } catch (err) {
        console.error('Lỗi khi tải điểm đi/đến:', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchRoutes();
  }, []);
  
  // Custom Date Picker States
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const originRef = useRef(null);
  const destRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originRef.current && !originRef.current.contains(event.target)) setShowOriginDropdown(false);
      if (destRef.current && !destRef.current.contains(event.target)) setShowDestDropdown(false);
      if (dateRef.current && !dateRef.current.contains(event.target)) setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    navigate('/tim-chuyen', { 
      state: { origin, destination, date, tickets } 
    });
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleRecentClick = (item) => {
    setOrigin(item.origin.split(' - ')[0] || item.origin);
    setDestination(item.dest);
    setDate(item.date);
  };

  const renderDropdown = (value, setValue, setShow, list) => (
    <div className="sf-location-dropdown">
      <div className="sf-dropdown-title">TỈNH/THÀNH PHỐ</div>
      {loadingLocations ? (
        <div style={{ padding: '15px', textAlign: 'center', fontSize: '13px', color: '#888' }}>Đang tải...</div>
      ) : (
        <ul className="sf-dropdown-list">
          {list.filter(l => l.toLowerCase().includes(value.toLowerCase())).map(loc => (
            <li key={loc} onClick={() => { setValue(loc); setShow(false); }}>
              <FaMapMarkerAlt className="sf-loc-icon"/> {loc}
            </li>
          ))}
          {list.length === 0 && <div style={{ padding: '15px', color: '#888' }}>Không có dữ liệu</div>}
        </ul>
      )}
    </div>
  );

  // Days of week mapping for Vietnamese
  const getWeekdayStr = (dateString) => {
    if(!dateString) return '';
    const [d, m, y] = dateString.split('/');
    const dateObj = new Date(y, m-1, d);
    const wd = dateObj.getDay();
    return wd === 0 ? 'Chủ nhật' : `Thứ ${wd + 1}`;
  };

  const renderDatePicker = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    
    // Calendar logic
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust so Monday is 0, Sunday is 6
    const emptySlots = (firstDay + 6) % 7; 

    const daysOut = [];
    for(let i=0; i<emptySlots; i++) daysOut.push(<div key={`e${i}`} className="cal-cell empty"></div>);
    
    for(let i=1; i<=daysInMonth; i++) {
       const cellDateObj = new Date(year, month, i);
       // Reset hours for accurate comparison
       const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
       
       const isPast = cellDateObj < todayDateOnly;
       const isToday = cellDateObj.getTime() === todayDateOnly.getTime();
       
       const dStr = `${i<10?'0'+i:i}/${month+1<10?'0'+(month+1):(month+1)}/${year}`;
       const isSel = date === dStr;
       
       const isHighlighted = isSel || (!date && isToday);

       daysOut.push(
         <div key={i} 
           className={`cal-cell ${isHighlighted ? 'active' : ''} ${isPast ? 'past-date' : ''} ${!isPast && !isHighlighted ? 'normal-date' : ''}`} 
           onClick={() => {
             if (isPast) return; 
             setDate(dStr); setShowDatePicker(false);
           }}
         >
           {i}
           {isHighlighted && <span className="today-dot"></span>}
         </div>
       );
    }
    
    const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));
    const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
    
    return (
      <div className="bb-calendar-overlay" onClick={(e) => e.stopPropagation()}>
         <div className="bb-cal-body">
            <div className="bb-cal-month-nav">
               <button className="nav-btn" onClick={prevMonth}>{"<"}</button>
               <strong>THÁNG {month + 1}/{year}</strong>
               <button className="nav-btn" onClick={nextMonth}>{">"}</button>
            </div>
            <div className="bb-cal-grid">
               <div className="cal-head">T2</div>
               <div className="cal-head">T3</div>
               <div className="cal-head">T4</div>
               <div className="cal-head">T5</div>
               <div className="cal-head">T6</div>
               <div className="cal-head">T7</div>
               <div className="cal-head">CN</div>
               {daysOut}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="modern-search-card">
      <div className="ms-card-inner">
        {/* Top Header Row within Form */}
        <div className="ms-top-actions">
          <div className="ms-guide-link">Hướng dẫn mua vé</div>
        </div>

        {/* Input Wrapper Row */}
        <div className="ms-inputs-wrapper">
          
          {/* Origin */}
          <div className="ms-input-box ms-box-left" ref={originRef}>
            <label>Điểm đi</label>
            <input 
              type="text" 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)} 
              onFocus={() => setShowOriginDropdown(true)}
              placeholder="Chọn điểm đi"
            />
            {showOriginDropdown && renderDropdown(origin, setOrigin, setShowOriginDropdown, availableOrigins)}
          </div>

          <div className="ms-swap-btn-container">
            <button className="ms-swap-btn" onClick={handleSwap}>
              <FaExchangeAlt />
            </button>
          </div>

          {/* Destination */}
          <div className="ms-input-box ms-box-right" ref={destRef}>
            <label>Điểm đến</label>
            <input 
              type="text" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              onFocus={() => setShowDestDropdown(true)}
              placeholder="Chọn điểm đến"
            />
            {showDestDropdown && renderDropdown(destination, setDestination, setShowDestDropdown, availableDests)}
          </div>

          <div className="ms-divider"></div>

          {/* Date */}
          <div className="ms-input-box ms-date-box" ref={dateRef}>
            <label>Ngày đi</label>
            <div className="fake-date-input" onClick={() => setShowDatePicker(true)}>
               <div className="ms-date-main">{date}</div>
               <div className="ms-date-sub">{getWeekdayStr(date)}</div>
            </div>
            {showDatePicker && renderDatePicker()}
          </div>

          <div className="ms-divider"></div>

          {/* Tickets */}
          <div className="ms-input-box ms-ticket-box">
            <label>Số vé</label>
            <div className="ticket-select-wrapper">
              <select value={tickets} onChange={e => setTickets(e.target.value)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              <div className="ticket-custom-arrow">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 6L11 1" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Searches Row */}
        {recentSearches.length > 0 && (
          <div className="ms-recent-searches">
            <span className="rs-title">Tìm kiếm gần đây</span>
            <div className="ms-recent-pills">
              {recentSearches.map((item, idx) => (
                <div key={idx} className="ms-pill" onClick={() => handleRecentClick(item)}>
                  <span className="pill-route">{item.origin} - {item.dest}</span>
                  <span className="pill-date">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Action Button */}
      <div className="ms-action-overlap">
        <button className="ms-search-submit" onClick={handleSearch}>
          Tìm chuyến xe
        </button>
      </div>

    </div>
  );
};

export default SearchForm;
