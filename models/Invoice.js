const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true
    },
    // Customer Details
    customerName: {
        type: String,
        default: 'Walk-in Customer'
    },
    customerPhone: {
        type: String,
        default: ''
    },
    customerEmail: {
        type: String,
        default: ''
    },
    customerGSTIN: {
        type: String,
        default: ''
    },
    // Restaurant Details (cached for invoice)
    restaurantDetails: {
        name: String,
        address: String,
        phone: String,
        email: String,
        gstNumber: String,
        logo: String
    },
    // Items
    items: [{
        name: String,
        quantity: Number,
        price: Number,
        amount: Number,
        hsnCode: {
            type: String,
            default: '996331' // HSN code for restaurant services
        }
    }],
    // Amounts
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    discountPercentage: {
        type: Number,
        default: 0
    },
    // Tax Details
    taxDetails: {
        cgst: {
            rate: { type: Number, default: 2.5 },
            amount: { type: Number, default: 0 }
        },
        sgst: {
            rate: { type: Number, default: 2.5 },
            amount: { type: Number, default: 0 }
        },
        igst: {
            rate: { type: Number, default: 0 },
            amount: { type: Number, default: 0 }
        }
    },
    totalTax: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    roundOff: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true
    },
    // Payment Details
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'WALLET', 'PENDING'],
        default: 'PENDING'
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'UNPAID', 'PARTIAL'],
        default: 'UNPAID'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    // UPI Payment QR
    upiId: {
        type: String,
        default: ''
    },
    qrCodeData: {
        type: String,
        default: ''
    },
    // Additional Info
    tableNumber: String,
    notes: {
        type: String,
        default: ''
    },
    termsAndConditions: {
        type: String,
        default: 'Thank you for your business! Please visit again.'
    },
    // Email Status
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date,
    // Timestamps
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
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

// Update timestamp on save
invoiceSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries and uniqueness per restaurant
invoiceSchema.index({ restaurantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ restaurantId: 1, invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
