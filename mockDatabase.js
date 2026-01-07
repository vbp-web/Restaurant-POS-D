// Mock Database - In-Memory Storage
// This replaces MongoDB for testing without database

class MockDatabase {
    constructor() {
        this.rootAdmins = [];
        this.restaurants = [];
        this.categories = [];
        this.menuItems = [];
        this.orders = [];
        this.initialize();
    }

    initialize() {
        // Create default root admin
        this.rootAdmins.push({
            _id: 'root-001',
            email: 'admin@restaurantpos.com',
            password: '$2a$12$Mu2YtB9EsVOV/fLeTap2YuRj8wE4D02isBPoOHmC6f7ZvLvCCyKtq', // Admin@123456
            role: 'root',
            createdAt: new Date()
        });

        // Create demo restaurant
        this.restaurants.push({
            _id: 'rest-001',
            name: 'Demo Restaurant',
            email: 'demo@restaurant.com',
            password: '$2a$12$FitqMEgcy7otE.UyPR0sPO1cpg1sYDonwbkSeoVX.h3qInxjK9m0W', // Demo@123456
            phone: '1234567890',
            address: '123 Demo Street, Demo City',
            role: 'restaurant',
            status: 'approved',
            trialEnabled: true,
            qrCode: 'QR-DEMO-001',
            createdAt: new Date()
        });

        // Create demo categories
        this.categories.push(
            {
                _id: 'cat-001',
                restaurantId: 'rest-001',
                name: 'Starters',
                isActive: true,
                createdAt: new Date()
            },
            {
                _id: 'cat-002',
                restaurantId: 'rest-001',
                name: 'Main Course',
                isActive: true,
                createdAt: new Date()
            },
            {
                _id: 'cat-003',
                restaurantId: 'rest-001',
                name: 'Desserts',
                isActive: true,
                createdAt: new Date()
            }
        );

        // Create demo menu items
        this.menuItems.push(
            {
                _id: 'item-001',
                restaurantId: 'rest-001',
                categoryId: 'cat-001',
                name: 'French Fries',
                price: 100,
                description: 'Crispy golden fries',
                isAvailable: true,
                createdAt: new Date()
            },
            {
                _id: 'item-002',
                restaurantId: 'rest-001',
                categoryId: 'cat-001',
                name: 'Paneer Tikka',
                price: 250,
                description: 'Grilled cottage cheese with spices',
                isAvailable: true,
                createdAt: new Date()
            },
            {
                _id: 'item-003',
                restaurantId: 'rest-001',
                categoryId: 'cat-002',
                name: 'Butter Chicken',
                price: 350,
                description: 'Creamy tomato-based curry',
                isAvailable: true,
                createdAt: new Date()
            },
            {
                _id: 'item-004',
                restaurantId: 'rest-001',
                categoryId: 'cat-002',
                name: 'Dal Makhani',
                price: 200,
                description: 'Black lentils in creamy gravy',
                isAvailable: true,
                createdAt: new Date()
            },
            {
                _id: 'item-005',
                restaurantId: 'rest-001',
                categoryId: 'cat-003',
                name: 'Gulab Jamun',
                price: 80,
                description: 'Sweet milk dumplings',
                isAvailable: true,
                createdAt: new Date()
            }
        );

        // Create demo orders
        this.orders.push(
            {
                _id: 'order-001',
                restaurantId: 'rest-001',
                tableNumber: '5',
                items: [
                    {
                        menuItemId: 'item-001',
                        name: 'French Fries',
                        price: 100,
                        quantity: 2
                    },
                    {
                        menuItemId: 'item-002',
                        name: 'Paneer Tikka',
                        price: 250,
                        quantity: 1
                    }
                ],
                totalAmount: 450,
                status: 'NEW',
                createdAt: new Date(Date.now() - 5 * 60000),
                updatedAt: new Date(Date.now() - 5 * 60000)
            },
            {
                _id: 'order-002',
                restaurantId: 'rest-001',
                tableNumber: '3',
                items: [
                    {
                        menuItemId: 'item-003',
                        name: 'Butter Chicken',
                        price: 350,
                        quantity: 1
                    }
                ],
                totalAmount: 350,
                status: 'PREPARING',
                createdAt: new Date(Date.now() - 10 * 60000),
                updatedAt: new Date(Date.now() - 3 * 60000)
            }
        );

        console.log('✅ Mock database initialized with demo data');
    }

    // Helper to generate IDs
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Find methods
    findRootAdmin(query) {
        return this.rootAdmins.find(admin => {
            if (query.email) return admin.email === query.email;
            if (query._id) return admin._id === query._id;
            return false;
        });
    }

    findRestaurant(query) {
        return this.restaurants.find(rest => {
            if (query.email) return rest.email === query.email;
            if (query._id) return rest._id === query._id;
            if (query.qrCode) return rest.qrCode === query.qrCode;
            return false;
        });
    }

    findAllRestaurants() {
        return this.restaurants;
    }

    findCategories(restaurantId) {
        return this.categories.filter(cat => cat.restaurantId === restaurantId);
    }

    findCategory(id) {
        return this.categories.find(cat => cat._id === id);
    }

    findMenuItems(restaurantId) {
        return this.menuItems.filter(item => item.restaurantId === restaurantId);
    }

    findMenuItem(id) {
        return this.menuItems.find(item => item._id === id);
    }

    findOrders(restaurantId) {
        return this.orders.filter(order => order.restaurantId === restaurantId);
    }

    findOrder(id, restaurantId) {
        return this.orders.find(order => order._id === id && order.restaurantId === restaurantId);
    }

    // Create methods
    createRestaurant(data) {
        const restaurant = {
            _id: this.generateId('rest'),
            ...data,
            role: 'restaurant',
            status: 'pending',
            trialEnabled: true,
            qrCode: `QR-${this.generateId('').toUpperCase()}`,
            createdAt: new Date()
        };
        this.restaurants.push(restaurant);
        return restaurant;
    }

    createCategory(restaurantId, name) {
        const category = {
            _id: this.generateId('cat'),
            restaurantId,
            name,
            isActive: true,
            createdAt: new Date()
        };
        this.categories.push(category);
        return category;
    }

    createMenuItem(data) {
        const item = {
            _id: this.generateId('item'),
            ...data,
            isAvailable: true,
            createdAt: new Date()
        };
        this.menuItems.push(item);
        return item;
    }

    createOrder(data) {
        const order = {
            _id: this.generateId('order'),
            ...data,
            status: 'NEW',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.orders.push(order);
        return order;
    }

    // Update methods
    updateRestaurant(id, updates) {
        const restaurant = this.findRestaurant({ _id: id });
        if (restaurant) {
            Object.assign(restaurant, updates);
        }
        return restaurant;
    }

    updateMenuItem(id, updates) {
        const item = this.findMenuItem(id);
        if (item) {
            Object.assign(item, updates);
        }
        return item;
    }

    updateOrder(id, restaurantId, updates) {
        const order = this.findOrder(id, restaurantId);
        if (order) {
            Object.assign(order, updates);
            order.updatedAt = new Date();
        }
        return order;
    }
}

// Create singleton instance
const mockDB = new MockDatabase();

module.exports = mockDB;
