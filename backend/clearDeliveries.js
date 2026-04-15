require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryRequest = require('./models/DeliveryRequest');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_delivery';

mongoose.connect(mongoUri)
  .then(async () => {
    try {
      const result = await DeliveryRequest.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} delivery requests`);
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
