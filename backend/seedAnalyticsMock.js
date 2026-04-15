require('dotenv').config();
const mongoose = require('mongoose');

const DailyStats = require('./models/DailyStats');
const ActivityLog = require('./models/ActivityLog');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_delivery';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedAnalyticsMock() {
  try {
    const days = Math.max(7, Math.min(parseInt(process.argv[2], 10) || 14, 90));

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Replace existing analytics history so the generated timeline is clean.
    await Promise.all([
      DailyStats.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    const today = startOfDay(new Date());
    const dailyDocs = [];
    const activityDocs = [];

    let totalUsers = 1; // preserved admin baseline
    let totalDeliveryRequests = 0;

    const endpointWeights = [
      { endpoint: 'GET /api/analytics/dashboard', method: 'GET', min: 4, max: 12 },
      { endpoint: 'GET /api/requests', method: 'GET', min: 20, max: 70 },
      { endpoint: 'POST /api/requests', method: 'POST', min: 3, max: 15 },
      { endpoint: 'GET /api/availability', method: 'GET', min: 8, max: 40 },
      { endpoint: 'POST /api/availability', method: 'POST', min: 1, max: 8 },
      { endpoint: 'GET /api/users', method: 'GET', min: 1, max: 6 },
      { endpoint: 'GET /api/outlets', method: 'GET', min: 2, max: 12 },
    ];

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const newUsersCount = randInt(0, 3);
      const deliveryCreated = randInt(2, 18);
      const availabilityCreated = randInt(1, 14);
      const completedDeliveriesCount = randInt(0, Math.max(1, deliveryCreated));

      totalUsers += newUsersCount;
      totalDeliveryRequests += deliveryCreated;

      dailyDocs.push({
        date,
        totalUsers,
        newUsersCount,
        totalDeliveryRequests,
        deliveryRequestsCreatedToday: deliveryCreated,
        availabilityRequestsCreatedToday: availabilityCreated,
        completedDeliveriesCount,
        averageDeliveryRating: Number((randInt(34, 48) / 10).toFixed(1)),
      });

      for (const ep of endpointWeights) {
        const count = randInt(ep.min, ep.max);
        for (let j = 0; j < count; j += 1) {
          const timestamp = new Date(date);
          timestamp.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), randInt(0, 999));

          activityDocs.push({
            userId: null,
            endpoint: ep.endpoint,
            method: ep.method,
            status: 200,
            timestamp,
            details: {
              duration: randInt(40, 900),
              query: {},
              params: {},
              source: 'mock-seed',
            },
          });
        }
      }
    }

    await DailyStats.insertMany(dailyDocs);
    await ActivityLog.insertMany(activityDocs);

    console.log('Mock analytics seeded successfully.');
    console.log(`  Days: ${days}`);
    console.log(`  DailyStats rows: ${dailyDocs.length}`);
    console.log(`  ActivityLog rows: ${activityDocs.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Mock analytics seed failed:', error.message);
    process.exit(1);
  }
}

seedAnalyticsMock();
