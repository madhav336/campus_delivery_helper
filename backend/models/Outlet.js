const mongoose = require('mongoose');

const outletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  locationDescription: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Outlet', outletSchema);