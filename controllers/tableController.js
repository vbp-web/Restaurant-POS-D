const Table = require('../models/Table');
const Order = require('../models/Order');

// Get all tables for a restaurant
exports.getTables = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const tables = await Table.find({ restaurant: restaurantId })
            .populate('currentOrder')
            .populate('mergedWith', 'tableNumber')
            .sort('tableNumber');

        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tables',
            error: error.message
        });
    }
};

// Get single table
exports.getTable = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findById(id)
            .populate('currentOrder')
            .populate('mergedWith', 'tableNumber capacity');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Error fetching table:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch table',
            error: error.message
        });
    }
};

// Create new table
exports.createTable = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const tableData = {
            ...req.body,
            restaurant: restaurantId
        };

        // Check if table number already exists
        const existingTable = await Table.findOne({
            restaurant: restaurantId,
            tableNumber: tableData.tableNumber
        });

        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Table number already exists'
            });
        }

        const table = new Table(tableData);
        await table.save();

        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: table
        });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create table',
            error: error.message
        });
    }
};

// Update table
exports.updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const table = await Table.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        res.json({
            success: true,
            message: 'Table updated successfully',
            data: table
        });
    } catch (error) {
        console.error('Error updating table:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update table',
            error: error.message
        });
    }
};

// Delete table
exports.deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        if (table.status === 'occupied') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete occupied table'
            });
        }

        await Table.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting table:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete table',
            error: error.message
        });
    }
};

// Update table status
exports.updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, orderId } = req.body;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        if (status === 'occupied' && orderId) {
            await table.occupy(orderId);
        } else if (status === 'available') {
            await table.free();
        } else {
            table.status = status;
            await table.save();
        }

        res.json({
            success: true,
            message: 'Table status updated successfully',
            data: table
        });
    } catch (error) {
        console.error('Error updating table status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update table status',
            error: error.message
        });
    }
};

// Assign order to table
exports.assignOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderId } = req.body;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        if (table.status === 'occupied' && table.currentOrder) {
            return res.status(400).json({
                success: false,
                message: 'Table is already occupied'
            });
        }

        await table.occupy(orderId);

        // Update order with table information
        await Order.findByIdAndUpdate(orderId, {
            $set: { tableNumber: table.tableNumber }
        });

        res.json({
            success: true,
            message: 'Order assigned to table successfully',
            data: table
        });
    } catch (error) {
        console.error('Error assigning order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign order',
            error: error.message
        });
    }
};

// Create reservation
exports.createReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservationData = req.body;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        if (table.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Table is not available for reservation'
            });
        }

        await table.reserve(reservationData);

        res.json({
            success: true,
            message: 'Reservation created successfully',
            data: table
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create reservation',
            error: error.message
        });
    }
};

// Cancel reservation
exports.cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findById(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        await table.cancelReservation();

        res.json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: table
        });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel reservation',
            error: error.message
        });
    }
};

// Merge tables
exports.mergeTables = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { tableIds } = req.body;

        if (!tableIds || tableIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 tables are required to merge'
            });
        }

        const tables = await Table.mergeTables(tableIds, restaurantId);

        res.json({
            success: true,
            message: 'Tables merged successfully',
            data: tables
        });
    } catch (error) {
        console.error('Error merging tables:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to merge tables',
            error: error.message
        });
    }
};

// Split tables
exports.splitTables = async (req, res) => {
    try {
        const { tableIds } = req.body;

        if (!tableIds || tableIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Table IDs are required'
            });
        }

        await Table.splitTables(tableIds);

        const tables = await Table.find({ _id: { $in: tableIds } });

        res.json({
            success: true,
            message: 'Tables split successfully',
            data: tables
        });
    } catch (error) {
        console.error('Error splitting tables:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to split tables',
            error: error.message
        });
    }
};

// Get available tables
exports.getAvailableTables = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const tables = await Table.getAvailableTables(restaurantId);

        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        console.error('Error fetching available tables:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available tables',
            error: error.message
        });
    }
};

// Update table position (for drag and drop)
exports.updateTablePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { x, y } = req.body;

        const table = await Table.findByIdAndUpdate(
            id,
            { $set: { 'position.x': x, 'position.y': y } },
            { new: true }
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        res.json({
            success: true,
            message: 'Table position updated successfully',
            data: table
        });
    } catch (error) {
        console.error('Error updating table position:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update table position',
            error: error.message
        });
    }
};
