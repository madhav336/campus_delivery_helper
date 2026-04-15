const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const DailyStats = require('../models/DailyStats');
const DeliveryRequest = require('../models/DeliveryRequest');
const User = require('../models/User');
const Outlet = require('../models/Outlet');
const AvailabilityRequest = require('../models/AvailabilityRequest');

const router = express.Router();

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

async function getRawTrends(since) {
  const [deliveryCreated, availabilityCreated, availabilityResponded, completed, newUsers] = await Promise.all([
    DeliveryRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]),
    AvailabilityRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]),
    AvailabilityRequest.aggregate([
      {
        $match: {
          'response.respondedAt': { $ne: null, $gte: since }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$response.respondedAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]),
    DeliveryRequest.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          completedAt: { $ne: null, $gte: since }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const toMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));

  return {
    deliveryCreated: toMap(deliveryCreated),
    availabilityCreated: toMap(availabilityCreated),
    availabilityResponded: toMap(availabilityResponded),
    completed: toMap(completed),
    newUsers: toMap(newUsers)
  };
}

async function getRoleDistribution() {
  const rows = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  return {
    student: rows.find((r) => r._id === 'student')?.count || 0,
    outlet_owner: rows.find((r) => r._id === 'outlet_owner')?.count || 0,
    admin: rows.find((r) => r._id === 'admin')?.count || 0
  };
}

async function getOutletPerformance() {
  const outlets = await Outlet.find().select('name');
  const performance = await Promise.all(
    outlets.map(async (outlet) => {
      const total = await AvailabilityRequest.countDocuments({ outlet: outlet._id });
      const confirmed = await AvailabilityRequest.countDocuments({
        outlet: outlet._id,
        status: 'CONFIRMED'
      });
      const availableYes = await AvailabilityRequest.countDocuments({
        outlet: outlet._id,
        status: 'CONFIRMED',
        'response.available': true
      });

      return {
        outletId: outlet._id,
        outletName: outlet.name,
        totalRequests: total,
        respondedRequests: confirmed,
        availableResponses: availableYes,
        responseRate: total > 0 ? Number(((confirmed / total) * 100).toFixed(1)) : 0
      };
    })
  );

  return performance.sort((a, b) => b.totalRequests - a.totalRequests);
}

async function getLeaderboard(limit = 10) {
  const topDeliverers = await User.find({ role: 'student' })
    .select('name delivererRating')
    .sort({ delivererRating: -1, name: 1 })
    .limit(limit);

  const topRequesters = await User.find({ role: 'student' })
    .select('name requesterRating')
    .sort({ requesterRating: -1, name: 1 })
    .limit(limit);

  return {
    topDeliverers: topDeliverers.map((u) => ({
      id: u._id,
      name: u.name,
      rating: u.delivererRating || 0
    })),
    topRequesters: topRequesters.map((u) => ({
      id: u._id,
      name: u.name,
      rating: u.requesterRating || 0
    }))
  };
}

/**
 * GET /api/analytics/dashboard
 * Unified analytics payload for admin dashboard
 */
router.get('/dashboard', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const dayCount = Math.max(1, Math.min(parseInt(req.query.days, 10) || 14, 90));
    const today = startOfDay();
    const since = daysAgo(dayCount - 1);

    const [
      totalUsers,
      totalOutlets,
      totalDeliveryRequests,
      completedDeliveries,
      totalAvailabilityRequests,
      todayNewUsers,
      todayRequests,
      todayAvailability,
      delivererRatingAgg,
      requesterRatingAgg,
      roleDistribution,
      leaderboard,
      outletPerformance,
      dailyStats,
      apiUsage
    ] = await Promise.all([
      User.countDocuments(),
      Outlet.countDocuments(),
      DeliveryRequest.countDocuments(),
      DeliveryRequest.countDocuments({ status: 'COMPLETED' }),
      AvailabilityRequest.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      DeliveryRequest.countDocuments({ createdAt: { $gte: today } }),
      AvailabilityRequest.countDocuments({ createdAt: { $gte: today } }),
      DeliveryRequest.aggregate([
        {
          $match: {
            status: 'COMPLETED',
            'delivererRating.rating': { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$delivererRating.rating' },
            count: { $sum: 1 }
          }
        }
      ]),
      DeliveryRequest.aggregate([
        {
          $match: {
            status: 'COMPLETED',
            'requesterRating.rating': { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$requesterRating.rating' },
            count: { $sum: 1 }
          }
        }
      ]),
      getRoleDistribution(),
      getLeaderboard(10),
      getOutletPerformance(),
      DailyStats.find({ date: { $gte: since } }).sort({ date: 1 }),
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
          $group: {
            _id: { endpoint: '$endpoint', method: '$method' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);

    const completionRate = totalDeliveryRequests > 0
      ? Number(((completedDeliveries / totalDeliveryRequests) * 100).toFixed(1))
      : 0;

    const delivererStats = delivererRatingAgg[0] || { avg: 0, count: 0 };
    const requesterStats = requesterRatingAgg[0] || { avg: 0, count: 0 };

    const avgDelivererRating = Number((delivererStats.avg || 0).toFixed(2));
    const avgRequesterRating = Number((requesterStats.avg || 0).toFixed(2));

    const totalRatingCount = (delivererStats.count || 0) + (requesterStats.count || 0);
    const avgRating = totalRatingCount > 0
      ? Number((((avgDelivererRating * (delivererStats.count || 0)) + (avgRequesterRating * (requesterStats.count || 0))) / totalRatingCount).toFixed(2))
      : 0;

    const rawTrendMaps = await getRawTrends(since);
    const dailyStatsMap = Object.fromEntries(
      dailyStats.map((row) => [dayKey(row.date), row])
    );

    const trends = [];
    for (let i = 0; i < dayCount; i += 1) {
      const date = new Date(since);
      date.setDate(since.getDate() + i);
      const key = dayKey(date);
      const statRow = dailyStatsMap[key];

      trends.push({
        date,
        deliveryCreated: statRow
          ? (statRow.deliveryRequestsCreatedToday || 0)
          : (rawTrendMaps.deliveryCreated[key] || 0),
        availabilityCreated: statRow
          ? (statRow.availabilityRequestsCreatedToday || 0)
          : (rawTrendMaps.availabilityCreated[key] || 0),
        availabilityResponded: rawTrendMaps.availabilityResponded[key] || 0,
        completed: statRow
          ? (statRow.completedDeliveriesCount || 0)
          : (rawTrendMaps.completed[key] || 0),
        newUsers: statRow
          ? (statRow.newUsersCount || 0)
          : (rawTrendMaps.newUsers[key] || 0)
      });
    }

    res.json({
      summary: {
        totalUsers,
        totalOutlets,
        totalDeliveryRequests,
        totalAvailabilityRequests,
        completedDeliveries,
        completionRate,
        avgRating,
        avgDelivererRating,
        avgRequesterRating,
        today: {
          newUsers: todayNewUsers,
          deliveryRequests: todayRequests,
          availabilityRequests: todayAvailability
        },
        roleDistribution
      },
      trends,
      leaderboard,
      outletPerformance,
      apiUsage: apiUsage.map((item) => ({
        endpoint: item._id.endpoint,
        method: item._id.method,
        count: item.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/analytics/summary
 * Get summary stats (admin only)
 */
router.get('/summary', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDeliveryRequests = await DeliveryRequest.countDocuments();
    const completedDeliveries = await DeliveryRequest.countDocuments({ status: 'COMPLETED' });
    const totalAvailabilityRequests = await AvailabilityRequest.countDocuments();
    const totalOutlets = await Outlet.countDocuments();

    res.json({
      totalUsers,
      totalRequests: totalDeliveryRequests,
      completedRequests: completedDeliveries,
      totalAvailabilityRequests,
      totalOutlets,
      avgRequestFee: 0
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
    const startDate = daysAgo(days);

    const stats = await DailyStats.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    res.json({
      data: stats.map((s) => ({
        date: s.date,
        count: s.deliveryRequestsCreatedToday || 0
      }))
    });
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
    const startDate = daysAgo(days);

    const stats = await DailyStats.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    res.json({
      data: stats.map((s) => ({
        date: s.date,
        count: s.newUsersCount || 0
      }))
    });
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
          _id: {
            endpoint: '$endpoint',
            method: '$method'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      data: usage.map((u) => ({
        endpoint: u._id.endpoint,
        method: u._id.method,
        count: u.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/analytics/leaderboard
 * Get top deliverers and requesters by rating
 */
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(10);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
