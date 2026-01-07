const jwt = require('jsonwebtoken');
const RootAdmin = require('../models/RootAdmin');

// Generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Root admin login
// @route   POST /api/root/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const admin = await RootAdmin.findOne({ email });

        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(admin._id, admin.role);

        res.json({
            success: true,
            token,
            user: {
                id: admin._id,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all restaurants
// @route   GET /api/root/restaurants
// @access  Private (Root only)
exports.getAllRestaurants = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurants = await Restaurant.find().select('-password').sort('-createdAt');

        res.json({
            success: true,
            count: restaurants.length,
            data: restaurants
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Approve restaurant
// @route   PUT /api/root/restaurants/:id/approve
// @access  Private (Root only)
exports.approveRestaurant = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        restaurant.status = 'approved';
        await restaurant.save();

        res.json({
            success: true,
            message: 'Restaurant approved successfully',
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Block restaurant
// @route   PUT /api/root/restaurants/:id/block
// @access  Private (Root only)
exports.blockRestaurant = async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        restaurant.status = 'blocked';
        await restaurant.save();

        res.json({
            success: true,
            message: 'Restaurant blocked successfully',
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
