const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    endpoint: {
        type: String,
        required: true
        // e.g., "GET /api/requests"
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        required: true
    },
    status: {
        type: Number,
        required: true
        // HTTP status code
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: false });

// Index for querying by endpoint
activityLogSchema.index({ endpoint: 1, timestamp: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
