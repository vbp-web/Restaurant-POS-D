const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const SubscriptionService = require('../services/subscriptionService');

// Generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Restaurant registration
// @route   POST /api/business/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const existingRestaurant = await Restaurant.findOne({ email });
        if (existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant already registered with this email'
            });
        }

        const restaurant = await Restaurant.create({
            name,
            email,
            password,
            phone,
            address
        });

        // Create initial subscription for the restaurant
        try {
            await SubscriptionService.createSubscription(restaurant._id);
        } catch (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError);
            // Continue even if subscription creation fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Awaiting admin approval.',
            data: {
                id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                status: restaurant.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Restaurant login
// @route   POST /api/business/login
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

        const restaurant = await Restaurant.findOne({ email });

        if (!restaurant || !(await restaurant.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (restaurant.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact admin.'
            });
        }

        const token = generateToken(restaurant._id, restaurant.role);

        res.json({
            success: true,
            token,
            user: {
                id: restaurant._id,
                name: restaurant.name,
                email: restaurant.email,
                role: restaurant.role,
                status: restaurant.status,
                qrCode: restaurant.qrCode
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all orders for restaurant
// @route   GET /api/business/orders
// @access  Private (Restaurant only)
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ restaurantId: req.restaurantId })
            .populate('items.menuItemId', 'name')
            .sort('-createdAt');

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update order status
// @route   PUT /api/business/orders/:id/status
// @access  Private (Restaurant only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['NEW', 'PREPARING', 'SERVED', 'PAID'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all categories
// @route   GET /api/business/categories
// @access  Private (Restaurant only)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ restaurantId: req.restaurantId }).sort('name');

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create category
// @route   POST /api/business/categories
// @access  Private (Restaurant only)
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category name'
            });
        }

        const category = await Category.create({
            restaurantId: req.restaurantId,
            name
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all menu items
// @route   GET /api/business/menu
// @access  Private (Restaurant only)
exports.getMenuItems = async (req, res) => {
    try {
        const items = await MenuItem.find({ restaurantId: req.restaurantId })
            .populate('categoryId', 'name')
            .sort('name');

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create menu item
// @route   POST /api/business/menu
// @access  Private (Restaurant only)
exports.createMenuItem = async (req, res) => {
    try {
        const { categoryId, name, price, description } = req.body;

        if (!categoryId || !name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Verify category belongs to restaurant
        const category = await Category.findOne({
            _id: categoryId,
            restaurantId: req.restaurantId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const menuItemData = {
            restaurantId: req.restaurantId,
            categoryId,
            name,
            price,
            description
        };

        // Add image if uploaded
        if (req.imageBase64) {
            menuItemData.image = req.imageBase64;
        }

        const menuItem = await MenuItem.create(menuItemData);

        res.status(201).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update menu item
// @route   PUT /api/business/menu/:id
// @access  Private (Restaurant only)
exports.updateMenuItem = async (req, res) => {
    try {
        const { name, price, description, isAvailable } = req.body;

        const menuItem = await MenuItem.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        if (name) menuItem.name = name;
        if (price !== undefined) menuItem.price = price;
        if (description !== undefined) menuItem.description = description;
        if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

        // Update image if uploaded
        if (req.imageBase64) {
            menuItem.image = req.imageBase64;
        }

        await menuItem.save();

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete menu item image
// @route   DELETE /api/business/menu/:id/image
// @access  Private (Restaurant only)
exports.deleteMenuItemImage = async (req, res) => {
    try {
        const menuItem = await MenuItem.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        menuItem.image = '';
        await menuItem.save();

        res.json({
            success: true,
            message: 'Image removed successfully',
            data: menuItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get analytics data
// @route   GET /api/business/analytics
// @access  Private (Restaurant only)
exports.getAnalytics = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        // Get all orders for this restaurant
        const orders = await Order.find({ restaurantId }).populate('items.menuItemId', 'name');

        // Calculate summary statistics
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Last 7 days revenue
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= date && orderDate < nextDate;
            });

            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
                orders: dayOrders.length
            });
        }

        // Best selling items
        const itemSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const itemName = item.menuItemId?.name || 'Unknown Item';
                if (!itemSales[itemName]) {
                    itemSales[itemName] = { name: itemName, quantity: 0, revenue: 0 };
                }
                itemSales[itemName].quantity += item.quantity;
                itemSales[itemName].revenue += item.price * item.quantity;
            });
        });

        const bestSellingItems = Object.values(itemSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Hourly data (orders by hour)
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
            hour: `${hour}:00`,
            orders: 0
        }));

        orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hourlyData[hour].orders++;
        });

        // Find peak hour
        const peakHourData = hourlyData.reduce((max, current) =>
            current.orders > max.orders ? current : max
            , hourlyData[0]);

        // Status breakdown
        const statusBreakdown = {
            NEW: orders.filter(o => o.status === 'NEW').length,
            PREPARING: orders.filter(o => o.status === 'PREPARING').length,
            SERVED: orders.filter(o => o.status === 'SERVED').length,
            PAID: orders.filter(o => o.status === 'PAID').length
        };

        res.json({
            success: true,
            data: {
                summary: {
                    totalRevenue,
                    totalOrders,
                    avgOrderValue,
                    todayRevenue,
                    todayOrders: todayOrders.length
                },
                dailyRevenue: last7Days,
                bestSellingItems,
                hourlyData: hourlyData.filter(h => h.orders > 0),
                peakHour: {
                    time: peakHourData.hour,
                    orders: peakHourData.orders
                },
                statusBreakdown
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
