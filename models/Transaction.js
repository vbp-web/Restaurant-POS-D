const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    type: {
        type: String,
        enum: ['PAYMENT', 'REFUND', 'SUBSCRIPTION', 'UPGRADE', 'DOWNGRADE'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'OTHER'],
        default: 'UPI'
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    paymentProof: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentProof'
    },
    plan: {
        type: String,
        enum: ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']
    },
    description: {
        type: String
    },
    metadata: {
        type: Map,
        of: String
    },
    refundReason: {
        type: String
    },
    refundedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RootAdmin'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ restaurant: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ transactionId: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function () {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: this.currency
    }).format(this.amount);
});

module.exports = mongoose.model('Transaction', transactionSchema);
