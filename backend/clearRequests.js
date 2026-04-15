const mongoose = require('mongoose');
const DeliveryRequest = require('./models/DeliveryRequest');
const AvailabilityRequest = require('./models/AvailabilityRequest');
require('dotenv').config();

async function clearRequests() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    console.log('🗑️  Clearing DeliveryRequests...');
    const delRes = await DeliveryRequest.deleteMany({});
    console.log(`✅ Deleted ${delRes.deletedCount} delivery requests`);

    console.log('🗑️  Clearing AvailabilityRequests...');
    const avRes = await AvailabilityRequest.deleteMany({});
    console.log(`✅ Deleted ${avRes.deletedCount} availability requests`);

    console.log('\n✨ Database cleared! Accounts and outlets preserved.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearRequests();
