const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  outlet: { type: String, required: true },
  item: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'AVAILABLE', 'NOT_AVAILABLE'], 
    default: 'PENDING' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Availability', AvailabilitySchema);
