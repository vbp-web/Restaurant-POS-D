const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');
const RootAdmin = require('../models/RootAdmin');

// Verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if root admin
            if (decoded.role === 'root') {
                req.user = await RootAdmin.findById(decoded.id).select('-password');
            } else {
                req.user = await Restaurant.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Restrict to root admin only
exports.rootOnly = (req, res, next) => {
    if (req.user.role !== 'root') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Root admin only.'
        });
    }
    next();
};

// Restrict to restaurant owner only
exports.restaurantOnly = (req, res, next) => {
    if (req.user.role !== 'restaurant') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Restaurant owner only.'
        });
    }

    // Check if restaurant is approved
    if (req.user.status !== 'approved') {
        return res.status(403).json({
            success: false,
            message: 'Your account is not approved yet. Please contact admin.'
        });
    }

    next();
};

// Ensure restaurant can only access their own data
exports.ensureOwnRestaurant = (req, res, next) => {
    req.restaurantId = req.user._id;
    next();
};
