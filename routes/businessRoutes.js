const express = require('express');
const router = express.Router();
const { protect, restaurantOnly, ensureOwnRestaurant } = require('../middleware/auth');
const { upload, validateImageSize } = require('../middleware/upload');
const {
    register,
    login,
    getOrders,
    updateOrderStatus,
    getCategories,
    createCategory,
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItemImage,
    getAnalytics
} = require('../controllers/businessController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Restaurant owner only)
router.use(protect, restaurantOnly, ensureOwnRestaurant);

// Orders
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);

// Menu
router.get('/menu', getMenuItems);
router.post('/menu', upload.single('image'), validateImageSize, createMenuItem);
router.put('/menu/:id', upload.single('image'), validateImageSize, updateMenuItem);
router.delete('/menu/:id/image', deleteMenuItemImage);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
