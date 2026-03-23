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
        enum: ['PENDING_CONFIRMATION', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING_CONFIRMATION'
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });


deliveryRequestSchema.pre('save', function () {

    // OPEN or PENDING_CONFIRMATION → acceptedBy must be null
    if (this.status === 'OPEN' || this.status === 'PENDING_CONFIRMATION') {
        this.acceptedBy = null;
    }

    // IN_PROGRESS → must have acceptedBy
    if (this.status === 'IN_PROGRESS' && !this.acceptedBy) {
        throw new Error('acceptedBy required when request is IN_PROGRESS');
    }
});

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);