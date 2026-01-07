const mongoose = require('mongoose');

const paymentProofSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    plan: {
        type: String,
        required: true,
        enum: ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']
    },
    amount: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    paymentScreenshot: {
        type: String, // Base64 encoded image or file path
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RootAdmin'
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    notes: {
        type: String
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
paymentProofSchema.index({ restaurant: 1, status: 1 });
paymentProofSchema.index({ transactionId: 1 });

module.exports = mongoose.model('PaymentProof', paymentProofSchema);
