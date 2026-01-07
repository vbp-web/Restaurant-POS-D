const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const rootAdminSchema = new mongoose.Schema({
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
    role: {
        type: String,
        default: 'root',
        immutable: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
rootAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
rootAdminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('RootAdmin', rootAdminSchema);
