const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ===== Middlewares =====
app.use(cors());
app.use(express.json());

// ===== Route Imports =====
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
const outletRoutes = require('./routes/outletRoutes');

// ===== Route Registrations =====
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/outlets', outletRoutes);

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({ message: "Server running" });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

