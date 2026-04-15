const AvailabilityRequest = require('../models/AvailabilityRequest');
const DailyStats = require('../models/DailyStats');
const DeliveryRequest = require('../models/DeliveryRequest');
const User = require('../models/User');

/**
 * Log daily statistics before cleaning up expired availability requests
 */
async function logDailyStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already logged for today
    const existing = await DailyStats.findOne({ date: today });
    if (existing) {
      console.log('Daily stats already logged for today');
      return;
    }

    // Get statistics
    const totalUsers = await User.countDocuments();
    const newUsersCount = await User.countDocuments({
      createdAt: { $gte: today }
    });

    const totalDeliveryRequests = await DeliveryRequest.countDocuments();
    const deliveryRequestsCreatedToday = await DeliveryRequest.countDocuments({
      createdAt: { $gte: today }
    });

    const availabilityRequestsCreatedToday = await AvailabilityRequest.countDocuments({
      createdAt: { $gte: today }
    });

    const completedDeliveriesCount = await DeliveryRequest.countDocuments({
      status: 'COMPLETED',
      completedAt: { $gte: today }
    });

    // Get average delivery rating
    const completedDeliveries = await DeliveryRequest.find({
      status: 'COMPLETED',
      'delivererRating.rating': { $ne: null }
    });
    
    let averageDeliveryRating = 0;
    if (completedDeliveries.length > 0) {
      const sum = completedDeliveries.reduce((acc, req) => {
        return acc + (req.delivererRating.rating || 0);
      }, 0);
      averageDeliveryRating = sum / completedDeliveries.length;
    }

    // Create daily stats record
    const dailyStats = new DailyStats({
      date: today,
      totalUsers,
      newUsersCount,
      totalDeliveryRequests,
      deliveryRequestsCreatedToday,
      availabilityRequestsCreatedToday,
      completedDeliveriesCount,
      averageDeliveryRating
    });

    await dailyStats.save();
    console.log(`✅ Daily stats logged for ${today.toDateString()}`);

  } catch (error) {
    console.error('Error logging daily stats:', error);
  }
}

/**
 * Archive expired availability requests (keep for analytics, hide from interface)
 * Requests with expiresAt <= now are kept in DB but filtered out in all API responses
 */
async function cleanupExpiredAvailabilities() {
  try {
    const now = new Date();
    // Just log analytics - we keep expired requests in DB indefinitely for analytics
    const expiredCount = await AvailabilityRequest.countDocuments({
      expiresAt: { $lte: now }
    });

    console.log(`📊 Archived ${expiredCount} expired availability requests (kept for analytics)`);
  } catch (error) {
    console.error('Error archiving availability requests:', error);
  }
}

/**
 * Mark delivery requests as expired pending if they've been OPEN for more than 24 hours
 * These are kept in DB for analytics but hidden from main requests list
 */
async function markExpiredPendingDeliveries() {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    const result = await DeliveryRequest.updateMany(
      {
        status: 'OPEN',
        isExpiredPending: false,
        createdAt: { $lt: twentyFourHoursAgo }
      },
      {
        isExpiredPending: true
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`📌 Marked ${result.modifiedCount} delivery requests as expired pending`);
    }
  } catch (error) {
    console.error('Error marking expired pending deliveries:', error);
  }
}

module.exports = { logDailyStats, cleanupExpiredAvailabilities, markExpiredPendingDeliveries };
