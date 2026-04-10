const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const DailyStats = require('../models/DailyStats');
const DeliveryRequest = require('../models/DeliveryRequest');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/analytics/summary
 * Get summary stats (admin only)
 */
router.get('/summary', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDeliveryRequests = await DeliveryRequest.countDocuments();
    const completedDeliveries = await DeliveryRequest.countDocuments({ status: 'COMPLETED' });

    res.json({
      totalUsers,
      totalDeliveryRequests,
      completedDeliveries
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/analytics/requests-over-time
 * Get delivery requests created per day (last 30 days)
 */
router.get('/requests-over-time', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await DailyStats.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/analytics/users-over-time
 * Get new users created per day
 */
router.get('/users-over-time', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await DailyStats.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/analytics/api-usage
 * Get API endpoint hit counts
 */
router.get('/api-usage', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const usage = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$endpoint',
          hitCount: { $sum: 1 },
          lastHit: { $max: '$timestamp' }
        }
      },
      { $sort: { hitCount: -1 } }
    ]);

    res.json({ data: usage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/analytics/leaderboard
 * Get top deliverers and requesters by rating
 */
router.get('/leaderboard', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Top deliverers
    const topDeliverers = await User.find({ role: 'student' })
      .select('name delivererRating')
      .sort({ delivererRating: -1 })
      .limit(10);

    // Top requesters
    const topRequesters = await User.find({ role: 'student' })
      .select('name requesterRating')
      .sort({ requesterRating: -1 })
      .limit(10);

    res.json({
      topDeliverers,
      topRequesters
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
