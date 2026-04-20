const express = require('express');
const User = require('../models/User');
const DeliveryRequest = require('../models/DeliveryRequest');
const AvailabilityRequest = require('../models/AvailabilityRequest');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/me
 * Get logged-in user's profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Populate outlet reference for outlet owners
    let userData = user.toObject();
    if (user.role === 'outlet_owner' && user.outletId) {
      const outlet = await user.populate('outletId', 'name locationDescription');
      userData.outlet = outlet.outletId;
    }

    // Add stats
    const deliveriesCompleted = await DeliveryRequest.countDocuments({
      $or: [
        { requestedBy: user._id, status: 'COMPLETED' },
        { acceptedBy: user._id, status: 'COMPLETED' }
      ]
    });

    res.json({
      user: {
        ...userData,
        deliveriesCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/users/:id
 * Get public user profile
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -phone');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add stats
    const deliveriesCompleted = await DeliveryRequest.countDocuments({
      $or: [
        { requestedBy: user._id, status: 'COMPLETED' },
        { acceptedBy: user._id, status: 'COMPLETED' }
      ]
    });

    res.json({
      user: {
        ...user.toObject(),
        deliveriesCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/users/me
 * Update own profile
 */
router.put('/me', verifyToken, async (req, res) => {
  try {
    const { phone, hostel } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (phone) user.phone = phone;
    if (hostel && user.role === 'student') user.hostel = hostel;

    await user.save();

    let userData = user.toObject();
    
    // Populate outlet reference for outlet owners
    if (user.role === 'outlet_owner' && user.outletId) {
      await user.populate('outletId', 'name locationDescription');
      userData.outlet = user.outletId;
    }

    res.json({ message: 'Profile updated', user: userData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role) {
      const VALID_ROLES = ['student', 'outlet_owner', 'admin'];
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Invalid role filter' });
      }
      query.role = role;
    }

    const users = await User.find(query).select('-password');
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user and cascade delete requests (admin only)
 */
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin account' });
      }
    }

    // Cascade delete: remove all requests by this user
    await DeliveryRequest.deleteMany({
      $or: [
        { requestedBy: req.params.id },
        { acceptedBy: req.params.id }
      ]
    });

    await AvailabilityRequest.deleteMany({
      requestedBy: req.params.id
    });

    // Delete user
    await User.deleteOne({ _id: req.params.id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/users/:id/fields
 * Update any field (admin only)
 */
router.put('/:id/fields', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

