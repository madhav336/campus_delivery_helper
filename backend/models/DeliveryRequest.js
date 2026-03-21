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
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });


// ✅ FIXED VERSION (no next issues)
deliveryRequestSchema.pre('save', function () {

    // OPEN → acceptedBy must be null
    if (this.status === 'OPEN') {
        this.acceptedBy = null;
    }

    // IN_PROGRESS → must have acceptedBy
    if (this.status === 'IN_PROGRESS' && !this.acceptedBy) {
        throw new Error('acceptedBy required when request is IN_PROGRESS');
    }
});

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);