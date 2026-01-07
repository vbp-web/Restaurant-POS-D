const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    tableNumber: {
        type: String,
        required: true
    },
    items: [{
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        name: String,
        price: Number,
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['NEW', 'PREPARING', 'SERVED', 'PAID'],
        default: 'NEW'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on status change
orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Ensure data isolation
orderSchema.index({ restaurantId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
