const mongoose = require('mongoose');

const outletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['CANTEEN', 'SHOP', 'CP'],
    required: true
  },
  locationDescription: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Outlet', outletSchema);

