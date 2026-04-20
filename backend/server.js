const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const ActivityLog = require('./models/ActivityLog');
const startScheduler = require('./jobs/scheduler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ===== Middlewares =====
const mongoSanitize = require('express-mongo-sanitize');
app.use(cors());
app.use(express.json());
// Sanitize all incoming req.body, req.query, and req.params against NoSQL Injection
app.use(mongoSanitize());

// Activity logging middleware - logs every API request
app.use(async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    try {
      const duration = Date.now() - start;
      const userId = req.user?.userId || null;
      
      await ActivityLog.create({
        userId,
        endpoint: `${req.method} ${req.path}`,
        method: req.method,
        status: res.statusCode,
        timestamp: new Date(),
        details: {
          duration,
          query: req.query,
          params: req.params
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  });
  
  next();
});

// ===== Route Imports =====
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
const outletRoutes = require('./routes/outletRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// ===== Route Registrations =====
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/analytics', analyticsRoutes);

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({ message: "Server running" });
});

// ===== Start Job Scheduler =====
startScheduler();

// ===== Start Server =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

