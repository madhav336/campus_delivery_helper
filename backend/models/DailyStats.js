const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
        // Represents midnight of that day
    },
    totalUsers: {
        type: Number,
        default: 0
    },
    newUsersCount: {
        type: Number,
        default: 0
    },
    totalDeliveryRequests: {
        type: Number,
        default: 0
    },
    deliveryRequestsCreatedToday: {
        type: Number,
        default: 0
    },
    availabilityRequestsCreatedToday: {
        type: Number,
        default: 0
    },
    completedDeliveriesCount: {
        type: Number,
        default: 0
    },
    averageDeliveryRating: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('DailyStats', dailyStatsSchema);
