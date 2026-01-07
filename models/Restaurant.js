const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'restaurant',
        immutable: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'blocked'],
        default: 'pending'
    },
    trialEnabled: {
        type: Boolean,
        default: true
    },
    qrCode: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
restaurantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Generate QR code identifier
restaurantSchema.pre('save', async function (next) {
    if (!this.qrCode) {
        this.qrCode = `QR-${this._id}`;
    }
    next();
});

// Compare password method
restaurantSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
