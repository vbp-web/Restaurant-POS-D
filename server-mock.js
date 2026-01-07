require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mockDB = require('./mockDatabase');
const http = require('http');
const socketIo = require('socket.io');

// Initialize express
const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('✅ Kitchen Display connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ Kitchen Display disconnected:', socket.id);
    });
});

// Make io globally available
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('\n🎯 Running in MOCK MODE (No MongoDB required)');
console.log('📝 Using in-memory data storage\n');

// JWT Helper
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'mock-secret-key', {
        expiresIn: '30d'
    });
};

// Auth Middleware
const protect = (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-secret-key');

        if (decoded.role === 'root') {
            req.user = mockDB.findRootAdmin({ _id: decoded.id });
        } else {
            req.user = mockDB.findRestaurant({ _id: decoded.id });
        }

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const rootOnly = (req, res, next) => {
    if (req.user.role !== 'root') {
        return res.status(403).json({ success: false, message: 'Access denied. Root admin only.' });
    }
    next();
};

const restaurantOnly = (req, res, next) => {
    if (req.user.role !== 'restaurant') {
        return res.status(403).json({ success: false, message: 'Access denied. Restaurant owner only.' });
    }
    if (req.user.status !== 'approved') {
        return res.status(403).json({ success: false, message: 'Your account is not approved yet.' });
    }
    next();
};

// ==================== ROOT ADMIN ROUTES ====================

// Root admin login
app.post('/api/root/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = mockDB.findRootAdmin({ email });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(admin._id, admin.role);
        res.json({
            success: true,
            token,
            user: { id: admin._id, email: admin.email, role: admin.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all restaurants
app.get('/api/root/restaurants', protect, rootOnly, (req, res) => {
    const restaurants = mockDB.findAllRestaurants().map(r => ({
        ...r,
        password: undefined
    }));
    res.json({ success: true, count: restaurants.length, data: restaurants });
});

// Approve restaurant
app.put('/api/root/restaurants/:id/approve', protect, rootOnly, (req, res) => {
    const restaurant = mockDB.updateRestaurant(req.params.id, { status: 'approved' });
    if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, message: 'Restaurant approved', data: restaurant });
});

// Block restaurant
app.put('/api/root/restaurants/:id/block', protect, rootOnly, (req, res) => {
    const restaurant = mockDB.updateRestaurant(req.params.id, { status: 'blocked' });
    if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, message: 'Restaurant blocked', data: restaurant });
});

// ==================== BUSINESS ROUTES ====================

// Restaurant registration
app.post('/api/business/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (mockDB.findRestaurant({ email })) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const restaurant = mockDB.createRestaurant({
            name,
            email,
            password: hashedPassword,
            phone,
            address
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Awaiting admin approval.',
            data: { id: restaurant._id, name: restaurant.name, email: restaurant.email, status: restaurant.status }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Restaurant login
app.post('/api/business/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const restaurant = mockDB.findRestaurant({ email });

        if (!restaurant || !(await bcrypt.compare(password, restaurant.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (restaurant.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Your account has been blocked' });
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get orders
app.get('/api/business/orders', protect, restaurantOnly, (req, res) => {
    console.log('📋 GET /api/business/orders - Restaurant ID:', req.user._id);
    const orders = mockDB.findOrders(req.user._id);
    console.log('📦 Found orders:', orders.length);
    console.log('📝 Orders:', JSON.stringify(orders, null, 2));
    res.json({ success: true, count: orders.length, data: orders });
});

// Update order status
app.put('/api/business/orders/:id/status', protect, restaurantOnly, (req, res) => {
    const { status } = req.body;
    const validStatuses = ['NEW', 'PREPARING', 'SERVED', 'PAID'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = mockDB.updateOrder(req.params.id, req.user._id, { status });
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated', data: order });
});

// Get categories
app.get('/api/business/categories', protect, restaurantOnly, (req, res) => {
    const categories = mockDB.findCategories(req.user._id);
    res.json({ success: true, count: categories.length, data: categories });
});

// Create category
app.post('/api/business/categories', protect, restaurantOnly, (req, res) => {
    const { name } = req.body;
    const category = mockDB.createCategory(req.user._id, name);
    res.status(201).json({ success: true, data: category });
});

// Get menu items
app.get('/api/business/menu', protect, restaurantOnly, (req, res) => {
    const items = mockDB.findMenuItems(req.user._id);
    const itemsWithCategory = items.map(item => ({
        ...item,
        categoryId: mockDB.findCategory(item.categoryId)
    }));
    res.json({ success: true, count: items.length, data: itemsWithCategory });
});

// Create menu item
app.post('/api/business/menu', protect, restaurantOnly, (req, res) => {
    const { categoryId, name, price, description } = req.body;

    const category = mockDB.findCategory(categoryId);
    if (!category || category.restaurantId !== req.user._id) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const item = mockDB.createMenuItem({
        restaurantId: req.user._id,
        categoryId,
        name,
        price,
        description
    });

    res.status(201).json({ success: true, data: item });
});

// Update menu item
app.put('/api/business/menu/:id', protect, restaurantOnly, (req, res) => {
    const item = mockDB.updateMenuItem(req.params.id, req.body);
    if (!item || item.restaurantId !== req.user._id) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
});

// Get analytics
app.get('/api/business/analytics', protect, restaurantOnly, (req, res) => {
    const analyticsService = require('./services/analyticsService');
    const analytics = analyticsService.getMockAnalytics(req.user._id);
    res.json({ success: true, data: analytics });
});

// ==================== PUBLIC ROUTES ====================

// Get menu by QR code
app.get('/api/public/menu/:qrCode', (req, res) => {
    const restaurant = mockDB.findRestaurant({ qrCode: req.params.qrCode });

    if (!restaurant || restaurant.status !== 'approved') {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const menuItems = mockDB.findMenuItems(restaurant._id).filter(item => item.isAvailable);

    const groupedMenu = {};
    menuItems.forEach(item => {
        const category = mockDB.findCategory(item.categoryId);
        const categoryName = category?.name || 'Uncategorized';

        if (!groupedMenu[categoryName]) {
            groupedMenu[categoryName] = [];
        }

        groupedMenu[categoryName].push({
            id: item._id,
            name: item.name,
            price: item.price,
            description: item.description
        });
    });

    res.json({
        success: true,
        restaurant: { id: restaurant._id, name: restaurant.name },
        menu: groupedMenu
    });
});

// Create order from QR
app.post('/api/public/orders', (req, res) => {
    try {
        const { qrCode, tableNumber, items } = req.body;

        const restaurant = mockDB.findRestaurant({ qrCode });
        if (!restaurant || restaurant.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = mockDB.findMenuItem(item.menuItemId);
            if (!menuItem || menuItem.restaurantId !== restaurant._id || !menuItem.isAvailable) {
                return res.status(400).json({ success: false, message: `Item ${item.menuItemId} not available` });
            }

            totalAmount += menuItem.price * item.quantity;
            orderItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity
            });
        }

        const order = mockDB.createOrder({
            restaurantId: restaurant._id,
            tableNumber,
            items: orderItems,
            totalAmount
        });

        console.log('✅ Order created successfully!');
        console.log('📦 Order ID:', order._id);
        console.log('🏪 Restaurant ID:', restaurant._id);
        console.log('🪑 Table Number:', tableNumber);
        console.log('💰 Total Amount:', totalAmount);
        console.log('📝 Full order:', JSON.stringify(order, null, 2));

        // Emit order to kitchen display via Socket.io
        if (global.io) {
            global.io.emit('new-order', order);
            console.log('🔔 Order sent to kitchen display');
        }

        // Verify order was added to database
        const allOrders = mockDB.findOrders(restaurant._id);
        console.log('🔍 Total orders for this restaurant:', allOrders.length);

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
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== INVOICE ROUTES ====================
const invoiceRoutes = require('./routes/invoiceRoutes');
app.use('/api', invoiceRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running (Mock Mode)', mode: 'MOCK_DATA' });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';

    // Find the local IP address
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
    }

    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 Local URL: http://localhost:${PORT}`);
    console.log(`📱 Network URL: http://${localIP}:${PORT}`);
    console.log(`\n📋 Available Routes:`);
    console.log(`   Root Admin:  /api/root`);
    console.log(`   Business:    /api/business`);
    console.log(`   Public:      /api/public`);
    console.log(`\n🎯 MOCK MODE - No MongoDB required!`);
    console.log(`🔌 Socket.io enabled for real-time updates`);
    console.log(`\n📝 Demo Credentials:`);
    console.log(`   Root Admin: admin@restaurantpos.com / Admin@123456`);
    console.log(`   Restaurant: demo@restaurant.com / Demo@123456`);
    console.log(`\n✅ Server ready for connections from all devices\n`);
});
