const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'outlet_owner', 'admin'],
    required: true
  },
  // For students
  hostel: {
    type: String,
    default: null
  },
  // For outlet owners - link to ONE outlet
  outletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    default: null
  },
  // Contact details
  phone: {
    type: String,
    required: true
  },
  // Ratings (averages, calculated from completed deliveries)
  requesterRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  delivererRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);