// Server start
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Gán io vào app để các routes có thể gọi req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Tham gia phòng của chuyến xe
  socket.on('joinTripRoom', (tripId) => {
    socket.join(tripId);
  });

  // Lắng nghe khi có người chọn ghế (chưa thanh toán, mới đang bấm)
  socket.on('seat_locked', (data) => {
    // Phát lại cho TẤT CẢ mọi người khác trong cùng chuyến xe (trừ người gửi)
    socket.broadcast.to(data.chuyenXeId).emit('seat_locked', data);
  });

  // Lắng nghe khi người dùng bỏ chọn ghế
  socket.on('seat_released', (data) => {
    socket.broadcast.to(data.chuyenXeId).emit('seat_released', data);
  });
  
  socket.on('leaveTripRoom', (tripId) => {
    socket.leave(tripId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

require('./cron'); // Kích hoạt hệ thống quét vé hết hạn tự động
const PORT = process.env.PORT || 5001;

// Trust proxy (required for ngrok/proxies)
app.set('trust proxy', 1);

// Import Routes
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const routeRoutes = require('./routes/routeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const hoaDonRoutes = require('./routes/hoaDonRoutes');
const supportRoutes = require('./routes/supportRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
// Middleware
app.use(cors());
app.use(express.json());

// Initialize cron jobs
require('./cron');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', hoaDonRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/support-requests', supportRoutes); // Alias cho FE
app.use('/api/vouchers', voucherRoutes);
// Test Route
app.get('/api', (req, res) => {
  res.json({ message: 'Bus Booking API is running on port ' + PORT });
});


// Serve Frontend static files (dist)
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
// Trigger restart server!
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });