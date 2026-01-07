const Staff = require('../models/Staff');
const bcrypt = require('bcryptjs');

// Get all staff for a restaurant
exports.getAllStaff = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const staff = await Staff.find({ restaurant: restaurantId })
            .select('-password')
            .sort('-createdAt');

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff',
            error: error.message
        });
    }
};

// Get active staff
exports.getActiveStaff = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const staff = await Staff.getActiveStaff(restaurantId);

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching active staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active staff',
            error: error.message
        });
    }
};

// Get staff by role
exports.getStaffByRole = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { role } = req.params;

        const staff = await Staff.getStaffByRole(restaurantId, role);

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching staff by role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff by role',
            error: error.message
        });
    }
};

// Get online staff
exports.getOnlineStaff = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const staff = await Staff.getOnlineStaff(restaurantId);

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching online staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch online staff',
            error: error.message
        });
    }
};

// Get single staff member
exports.getStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findById(id).select('-password');

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        res.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff',
            error: error.message
        });
    }
};

// Create new staff member
exports.createStaff = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const staffData = {
            ...req.body,
            restaurant: restaurantId
        };

        // Check if email already exists
        const existingStaff = await Staff.findOne({ email: staffData.email });
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Generate employee ID if not provided
        if (!staffData.employeeId) {
            const count = await Staff.countDocuments({ restaurant: restaurantId });
            staffData.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
        }

        const staff = new Staff(staffData);

        // Set default permissions based on role
        staff.setDefaultPermissions();

        await staff.save();

        // Log activity
        await staff.logActivity('account_created', 'Staff account created');

        // Remove password from response
        const staffResponse = staff.toObject();
        delete staffResponse.password;

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: staffResponse
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create staff member',
            error: error.message
        });
    }
};

// Update staff member
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Remove password from updates if present (use separate endpoint)
        delete updates.password;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            staff[key] = updates[key];
        });

        // If role changed, update permissions
        if (updates.role && updates.role !== staff.role) {
            staff.setDefaultPermissions();
        }

        await staff.save();

        // Log activity
        await staff.logActivity('profile_updated', 'Staff profile updated');

        // Remove password from response
        const staffResponse = staff.toObject();
        delete staffResponse.password;

        res.json({
            success: true,
            message: 'Staff member updated successfully',
            data: staffResponse
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update staff member',
            error: error.message
        });
    }
};

// Update staff password
exports.updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Verify current password
        const isMatch = await staff.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        staff.password = newPassword;
        await staff.save();

        // Log activity
        await staff.logActivity('password_changed', 'Password changed');

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update password',
            error: error.message
        });
    }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Don't allow deleting owner
        if (staff.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete owner account'
            });
        }

        await Staff.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete staff member',
            error: error.message
        });
    }
};

// Update staff status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        staff.status = status;
        await staff.save();

        // Log activity
        await staff.logActivity('status_changed', `Status changed to ${status}`);

        res.json({
            success: true,
            message: 'Staff status updated successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

// Add shift
exports.addShift = async (req, res) => {
    try {
        const { id } = req.params;
        const shiftData = req.body;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        await staff.addShift(shiftData);

        // Log activity
        await staff.logActivity('shift_added', `Shift added for ${shiftData.date}`);

        res.json({
            success: true,
            message: 'Shift added successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error adding shift:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add shift',
            error: error.message
        });
    }
};

// Update shift
exports.updateShift = async (req, res) => {
    try {
        const { id, shiftId } = req.params;
        const { status, actualStartTime, actualEndTime } = req.body;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        await staff.updateShiftStatus(shiftId, status, { actualStartTime, actualEndTime });

        // Log activity
        await staff.logActivity('shift_updated', `Shift status updated to ${status}`);

        res.json({
            success: true,
            message: 'Shift updated successfully',
            data: staff
        });
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update shift',
            error: error.message
        });
    }
};

// Get staff activities
exports.getActivities = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;

        const staff = await Staff.findById(id).select('activities');

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        const activities = staff.activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities',
            error: error.message
        });
    }
};

// Staff login
exports.staffLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const staff = await Staff.findOne({ email });

        if (!staff) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (staff.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }

        const isMatch = await staff.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update login info
        staff.lastLogin = new Date();
        staff.isOnline = true;
        await staff.save();

        // Log activity
        await staff.logActivity('login', 'Staff logged in');

        // Remove password from response
        const staffResponse = staff.toObject();
        delete staffResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: staffResponse
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Staff logout
exports.staffLogout = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        staff.isOnline = false;
        await staff.save();

        // Log activity
        await staff.logActivity('logout', 'Staff logged out');

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};
