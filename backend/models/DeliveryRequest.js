const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
    itemDescription: { type: String, required: true },
    outlet: { type: String, required: true },
    hostel: { type: String, required: true },
    fee: { type: Number, required: true },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'],
        default: 'OPEN'
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
    }
}, { timestamps: true });

<<<<<<< HEAD
// ENFORCE VALIDATION
=======
>>>>>>> feature/backend-sprint2
deliveryRequestSchema.pre('save', function () {
    if (this.status === 'OPEN') {
        this.acceptedBy = null;
    }
<<<<<<< HEAD
=======

>>>>>>> feature/backend-sprint2
    if (this.status === 'IN_PROGRESS' && !this.acceptedBy) {
        throw new Error('acceptedBy required when request is IN_PROGRESS');
    }
});

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
