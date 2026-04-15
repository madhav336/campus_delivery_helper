require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Outlet = require('./models/Outlet');
const DeliveryRequest = require('./models/DeliveryRequest');
const AvailabilityRequest = require('./models/AvailabilityRequest');
const ActivityLog = require('./models/ActivityLog');
const DailyStats = require('./models/DailyStats');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_delivery';

async function resetForManualTesting() {
  try {
    const clearAnalytics = process.argv.includes('--full');

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    const adminUsers = await User.find({ role: 'admin' }).sort({ createdAt: 1 });

    if (adminUsers.length === 0) {
      throw new Error('No admin account found. Create an admin before running this reset.');
    }

    const keeperAdmin = adminUsers[0];

    console.log(`👤 Preserving admin: ${keeperAdmin.email} (${keeperAdmin._id})`);

    // Clear all requests first to avoid dangling references.
    const [deliveryRes, availabilityRes] = await Promise.all([
      DeliveryRequest.deleteMany({}),
      AvailabilityRequest.deleteMany({}),
    ]);

    // Keep one admin, wipe all other users.
    const usersRes = await User.deleteMany({ _id: { $ne: keeperAdmin._id } });

    // Remove all outlets and detach keeper admin from outlet linkage if any.
    const outletsRes = await Outlet.deleteMany({});
    await User.updateOne({ _id: keeperAdmin._id }, { $unset: { outletId: '' } });

    // Optional full wipe for analytics history.
    let activityRes = { deletedCount: 0 };
    let dailyStatsRes = { deletedCount: 0 };
    if (clearAnalytics) {
      [activityRes, dailyStatsRes] = await Promise.all([
        ActivityLog.deleteMany({}),
        DailyStats.deleteMany({}),
      ]);
    }

    console.log('');
    console.log('✅ Reset complete for manual testing');
    console.log(`   - Deleted delivery requests: ${deliveryRes.deletedCount}`);
    console.log(`   - Deleted availability requests: ${availabilityRes.deletedCount}`);
    console.log(`   - Deleted users (non-preserved): ${usersRes.deletedCount}`);
    console.log(`   - Deleted outlets: ${outletsRes.deletedCount}`);
    if (clearAnalytics) {
      console.log(`   - Deleted activity logs: ${activityRes.deletedCount}`);
      console.log(`   - Deleted daily stats: ${dailyStatsRes.deletedCount}`);
    }
    console.log(`   - Preserved admin: ${keeperAdmin.email}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetForManualTesting();
