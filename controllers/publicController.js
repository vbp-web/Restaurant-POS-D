const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// @desc    Get restaurant menu by QR code
// @route   GET /api/public/menu/:qrCode
// @access  Public
exports.getMenuByQR = async (req, res) => {
    try {
        const { qrCode } = req.params;

        const restaurant = await Restaurant.findOne({ qrCode, status: 'approved' });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found or not active'
            });
        }

        const menuItems = await MenuItem.find({
            restaurantId: restaurant._id,
            isAvailable: true
        }).populate('categoryId', 'name').sort('categoryId name');

        // Group by category
        const groupedMenu = {};
        menuItems.forEach(item => {
            const categoryName = item.categoryId?.name || 'Uncategorized';
            if (!groupedMenu[categoryName]) {
                groupedMenu[categoryName] = [];
            }
            groupedMenu[categoryName].push({
                id: item._id,
                name: item.name,
                price: item.price,
                description: item.description,
                image: item.image
            });
        });

        res.json({
            success: true,
            restaurant: {
                id: restaurant._id,
                name: restaurant.name
            },
            menu: groupedMenu
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create order from QR
// @route   POST /api/public/orders
// @access  Public
exports.createOrder = async (req, res) => {
    try {
        const { qrCode, tableNumber, items } = req.body;

        if (!qrCode || !tableNumber || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const restaurant = await Restaurant.findOne({ qrCode, status: 'approved' });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found or not active'
            });
        }

        // Validate and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findOne({
                _id: item.menuItemId,
                restaurantId: restaurant._id,
                isAvailable: true
            });

            if (!menuItem) {
                return res.status(400).json({
                    success: false,
                    message: `Menu item ${item.menuItemId} not found or not available`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity
            });
        }

        const order = await Order.create({
            restaurantId: restaurant._id,
            tableNumber,
            items: orderItems,
            totalAmount
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                orderId: order._id,
                tableNumber: order.tableNumber,
                totalAmount: order.totalAmount,
                status: order.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
