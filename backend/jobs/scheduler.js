const schedule = require('node-schedule');
const { logDailyStats, cleanupExpiredAvailabilities, markExpiredPendingDeliveries } = require('./cleanup');

/**
 * Start scheduled jobs
 */
function startScheduler() {
  // Run daily at midnight (00:00)
  const dailyJob = schedule.scheduleJob('0 0 * * *', async () => {
    console.log('🌙 Running nightly maintenance job...');
    await logDailyStats();
    await cleanupExpiredAvailabilities();
    await markExpiredPendingDeliveries();
    console.log('✅ Nightly maintenance complete');
  });

  console.log('📅 Scheduler started - will run daily at midnight');
  return dailyJob;
}

module.exports = startScheduler;
