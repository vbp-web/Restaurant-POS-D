const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    tableNumber: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved'],
        default: 'available'
    },
    position: {
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        }
    },
    shape: {
        type: String,
        enum: ['square', 'rectangle', 'circle'],
        default: 'square'
    },
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    reservation: {
        customerName: String,
        customerPhone: String,
        reservationTime: Date,
        numberOfGuests: Number,
        specialRequests: String
    },
    mergedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ restaurant: 1, status: 1 });

// Virtual for checking if table is available
tableSchema.virtual('isAvailable').get(function () {
    return this.status === 'available' && this.isActive;
});

// Method to occupy table
tableSchema.methods.occupy = function (orderId) {
    this.status = 'occupied';
    this.currentOrder = orderId;
    return this.save();
};

// Method to free table
tableSchema.methods.free = function () {
    this.status = 'available';
    this.currentOrder = null;
    this.mergedWith = [];
    return this.save();
};

// Method to reserve table
tableSchema.methods.reserve = function (reservationData) {
    this.status = 'reserved';
    this.reservation = reservationData;
    return this.save();
};

// Method to cancel reservation
tableSchema.methods.cancelReservation = function () {
    this.status = 'available';
    this.reservation = undefined;
    return this.save();
};

// Static method to get available tables
tableSchema.statics.getAvailableTables = function (restaurantId) {
    return this.find({
        restaurant: restaurantId,
        status: 'available',
        isActive: true
    }).sort('tableNumber');
};

// Static method to merge tables
tableSchema.statics.mergeTables = async function (tableIds, restaurantId) {
    const tables = await this.find({
        _id: { $in: tableIds },
        restaurant: restaurantId,
        status: 'available'
    });

    if (tables.length !== tableIds.length) {
        throw new Error('All tables must be available to merge');
    }

    // Update all tables to reference each other
    await this.updateMany(
        { _id: { $in: tableIds } },
        { $set: { mergedWith: tableIds.filter(id => id !== tables[0]._id) } }
    );

    return tables;
};

// Static method to split merged tables
tableSchema.statics.splitTables = async function (tableIds) {
    return this.updateMany(
        { _id: { $in: tableIds } },
        { $set: { mergedWith: [] } }
    );
};

module.exports = mongoose.model('Table', tableSchema);
