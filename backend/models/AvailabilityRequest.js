const mongoose = require('mongoose');

const availabilityRequestSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true
    },
    outlet: {
        type: String,
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED'],
        default: 'PENDING'
    },
    response: {
        available: { type: Boolean, default: null },
        respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        respondedAt: { type: Date, default: null }
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AvailabilityRequest', availabilityRequestSchema);