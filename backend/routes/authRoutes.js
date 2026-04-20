const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Outlet = require('../models/Outlet');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_sprint3';

/**
 * POST /api/auth/signup
 * Register a new user (student or outlet_owner)
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, phone, hostel, outletName, outletLocation } = req.body;

    // Validation
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Reject non-string email to prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    const safeEmail = String(email);
    const existing = await User.findOne({ email: { $eq: safeEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (role === 'student') {
      if (!hostel) {
        return res.status(400).json({ message: 'Hostel required for students' });
      }
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: 'student',
        phone,
        hostel,
        requesterRating: 0,
        delivererRating: 0
      });
    } else if (role === 'outlet_owner') {
      if (!outletName || !outletLocation) {
        return res.status(400).json({ message: 'Outlet details required for outlet owners' });
      }
      
      // Create outlet with owner reference
      const outlet = new Outlet({
        name: outletName,
        locationDescription: outletLocation,
        isActive: true
      });
      await outlet.save();

      user = new User({
        name,
        email,
        password: hashedPassword,
        role: 'outlet_owner',
        phone,
        outletId: outlet._id,
        requesterRating: 0,
        delivererRating: 0
      });
      
      // Update outlet with owner reference
      outlet.owner = user._id;
      await outlet.save();
    } else if (role === 'admin') {
      // Only allow admin creation via backend directly (not signup)
      return res.status(403).json({ message: 'Admin role not available via signup' });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Reject non-string inputs to prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input format' });
    }

    const safeEmail = String(email);
    const user = await User.findOne({ email: { $eq: safeEmail } }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
