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
 * Delete expired availability requests (older than their expiresAt timestamp)
 */
async function cleanupExpiredAvailabilities() {
  try {
    const now = new Date();
    const result = await AvailabilityRequest.deleteMany({
      expiresAt: { $lte: now }
    });

    console.log(`✅ Cleaned up ${result.deletedCount} expired availability requests`);
  } catch (error) {
    console.error('Error cleaning up availability requests:', error);
  }
}

module.exports = { logDailyStats, cleanupExpiredAvailabilities };
