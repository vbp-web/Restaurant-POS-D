const Staff = require('../models/Staff');

// Middleware to check if user has specific permission
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const staffId = req.user?.id || req.staffId;

            if (!staffId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const staff = await Staff.findById(staffId);

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            if (staff.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Account is not active'
                });
            }

            // Check if staff has the required permission
            if (!staff.permissions[permission]) {
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to ${permission.replace('can', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`
                });
            }

            // Attach staff info to request
            req.staff = staff;
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking permissions',
                error: error.message
            });
        }
    };
};

// Middleware to check if user has specific role
const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            const staffId = req.user?.id || req.staffId;

            if (!staffId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const staff = await Staff.findById(staffId);

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            if (staff.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Account is not active'
                });
            }

            // Convert single role to array
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            // Check if staff has one of the allowed roles
            if (!allowedRoles.includes(staff.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
                });
            }

            // Attach staff info to request
            req.staff = staff;
            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking role',
                error: error.message
            });
        }
    };
};

// Middleware to check if user is owner or manager
const isOwnerOrManager = checkRole(['owner', 'manager']);

// Middleware to check if user is owner
const isOwner = checkRole('owner');

// Permission-specific middleware
const canViewOrders = checkPermission('canViewOrders');
const canCreateOrders = checkPermission('canCreateOrders');
const canUpdateOrders = checkPermission('canUpdateOrders');
const canDeleteOrders = checkPermission('canDeleteOrders');
const canViewMenu = checkPermission('canViewMenu');
const canManageMenu = checkPermission('canManageMenu');
const canViewTables = checkPermission('canViewTables');
const canManageTables = checkPermission('canManageTables');
const canViewStaff = checkPermission('canViewStaff');
const canManageStaff = checkPermission('canManageStaff');
const canViewAnalytics = checkPermission('canViewAnalytics');
const canManageSettings = checkPermission('canManageSettings');

module.exports = {
    checkPermission,
    checkRole,
    isOwnerOrManager,
    isOwner,
    canViewOrders,
    canCreateOrders,
    canUpdateOrders,
    canDeleteOrders,
    canViewMenu,
    canManageMenu,
    canViewTables,
    canManageTables,
    canViewStaff,
    canManageStaff,
    canViewAnalytics,
    canManageSettings
};
