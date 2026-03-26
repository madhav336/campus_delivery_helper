const mongoose = require('mongoose');

const availabilityRequestSchema = new mongoose.Schema({
    item: {
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
        enum: ['PENDING', 'AVAILABLE', 'NOT_AVAILABLE'],
        default: 'PENDING'
    },
    outletOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('AvailabilityRequest', availabilityRequestSchema);