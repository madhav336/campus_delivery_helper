const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
    itemDescription: { 
      type: String, 
      required: true 
    },
    outlet: { 
      type: String, 
      required: true 
    },
    hostel: { 
      type: String, 
      required: true 
    },
    fee: { 
      type: Number, 
      required: true 
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'],
        default: 'OPEN'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Ratings - stored as subdocuments
    requesterRating: {
      rating: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: null },
      givenAt: { type: Date, default: null }
    },
    delivererRating: {
      rating: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: null },
      givenAt: { type: Date, default: null }
    },
    completedAt: {
      type: Date,
      default: null
    }
}, { timestamps: true });

deliveryRequestSchema.pre('save', function () {
    if (this.status === 'OPEN') {
        this.acceptedBy = null;
    }
    if (this.status === 'IN_PROGRESS' && !this.acceptedBy) {
        throw new Error('acceptedBy required when request is IN_PROGRESS');
    }
});

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
