const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const shiftSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    actualStartTime: String,
    actualEndTime: String,
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'missed'],
        default: 'scheduled'
    },
    notes: String
}, { _id: true });

const activitySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    description: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
}, { _id: true });

const staffSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
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
        minlength: 6
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'manager', 'waiter', 'chef', 'cashier'],
        required: true
    },
    permissions: {
        canViewOrders: { type: Boolean, default: false },
        canCreateOrders: { type: Boolean, default: false },
        canUpdateOrders: { type: Boolean, default: false },
        canDeleteOrders: { type: Boolean, default: false },
        canViewMenu: { type: Boolean, default: false },
        canManageMenu: { type: Boolean, default: false },
        canViewTables: { type: Boolean, default: false },
        canManageTables: { type: Boolean, default: false },
        canViewStaff: { type: Boolean, default: false },
        canManageStaff: { type: Boolean, default: false },
        canViewAnalytics: { type: Boolean, default: false },
        canManageSettings: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true
    },
    dateOfJoining: {
        type: Date,
        default: Date.now
    },
    salary: {
        type: Number,
        default: 0
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    shifts: [shiftSchema],
    activities: [activitySchema],
    profileImage: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    lastActivity: Date
}, {
    timestamps: true
});

// Indexes
staffSchema.index({ restaurant: 1, email: 1 }, { unique: true });
staffSchema.index({ restaurant: 1, role: 1 });
staffSchema.index({ restaurant: 1, status: 1 });
staffSchema.index({ employeeId: 1 }, { sparse: true });

// Hash password before saving
staffSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
staffSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to set default permissions based on role
staffSchema.methods.setDefaultPermissions = function () {
    const rolePermissions = {
        owner: {
            canViewOrders: true,
            canCreateOrders: true,
            canUpdateOrders: true,
            canDeleteOrders: true,
            canViewMenu: true,
            canManageMenu: true,
            canViewTables: true,
            canManageTables: true,
            canViewStaff: true,
            canManageStaff: true,
            canViewAnalytics: true,
            canManageSettings: true
        },
        manager: {
            canViewOrders: true,
            canCreateOrders: true,
            canUpdateOrders: true,
            canDeleteOrders: true,
            canViewMenu: true,
            canManageMenu: true,
            canViewTables: true,
            canManageTables: true,
            canViewStaff: true,
            canManageStaff: true,
            canViewAnalytics: true,
            canManageSettings: false
        },
        waiter: {
            canViewOrders: true,
            canCreateOrders: true,
            canUpdateOrders: true,
            canDeleteOrders: false,
            canViewMenu: true,
            canManageMenu: false,
            canViewTables: true,
            canManageTables: true,
            canViewStaff: false,
            canManageStaff: false,
            canViewAnalytics: false,
            canManageSettings: false
        },
        chef: {
            canViewOrders: true,
            canCreateOrders: false,
            canUpdateOrders: true,
            canDeleteOrders: false,
            canViewMenu: true,
            canManageMenu: false,
            canViewTables: false,
            canManageTables: false,
            canViewStaff: false,
            canManageStaff: false,
            canViewAnalytics: false,
            canManageSettings: false
        },
        cashier: {
            canViewOrders: true,
            canCreateOrders: true,
            canUpdateOrders: true,
            canDeleteOrders: false,
            canViewMenu: true,
            canManageMenu: false,
            canViewTables: true,
            canManageTables: false,
            canViewStaff: false,
            canManageStaff: false,
            canViewAnalytics: true,
            canManageSettings: false
        }
    };

    this.permissions = rolePermissions[this.role] || {};
};

// Method to log activity
staffSchema.methods.logActivity = function (action, description, metadata = {}) {
    this.activities.push({
        action,
        description,
        metadata,
        timestamp: new Date()
    });
    this.lastActivity = new Date();

    // Keep only last 100 activities
    if (this.activities.length > 100) {
        this.activities = this.activities.slice(-100);
    }

    return this.save();
};

// Method to add shift
staffSchema.methods.addShift = function (shiftData) {
    this.shifts.push(shiftData);
    return this.save();
};

// Method to update shift status
staffSchema.methods.updateShiftStatus = function (shiftId, status, actualTimes = {}) {
    const shift = this.shifts.id(shiftId);
    if (shift) {
        shift.status = status;
        if (actualTimes.actualStartTime) shift.actualStartTime = actualTimes.actualStartTime;
        if (actualTimes.actualEndTime) shift.actualEndTime = actualTimes.actualEndTime;
    }
    return this.save();
};

// Static method to get active staff
staffSchema.statics.getActiveStaff = function (restaurantId) {
    return this.find({
        restaurant: restaurantId,
        status: 'active'
    }).select('-password');
};

// Static method to get staff by role
staffSchema.statics.getStaffByRole = function (restaurantId, role) {
    return this.find({
        restaurant: restaurantId,
        role: role,
        status: 'active'
    }).select('-password');
};

// Static method to get online staff
staffSchema.statics.getOnlineStaff = function (restaurantId) {
    return this.find({
        restaurant: restaurantId,
        isOnline: true,
        status: 'active'
    }).select('-password');
};

// Virtual for full name with role
staffSchema.virtual('displayName').get(function () {
    return `${this.name} (${this.role.charAt(0).toUpperCase() + this.role.slice(1)})`;
});

// Virtual for current shift
staffSchema.virtual('currentShift').get(function () {
    const now = new Date();
    return this.shifts.find(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.toDateString() === now.toDateString() &&
            shift.status === 'ongoing';
    });
});

// Ensure virtuals are included in JSON
staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Staff', staffSchema);
