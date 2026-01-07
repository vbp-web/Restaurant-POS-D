const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect, restaurantOnly, ensureOwnRestaurant } = require('../middleware/auth');

// Public routes
router.get('/pricing', subscriptionController.getPricingPlans);

// Protected routes - require authentication
router.use(protect, restaurantOnly, ensureOwnRestaurant);

// Get current subscription
router.get('/current', subscriptionController.getSubscription);

// Upgrade plan
router.post('/upgrade', subscriptionController.upgradePlan);

// Downgrade plan
router.post('/downgrade', subscriptionController.downgradePlan);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Renew subscription
router.post('/renew', subscriptionController.renewSubscription);

// Get notifications
router.get('/notifications', subscriptionController.getNotifications);

// Mark notification as read
router.patch('/notifications/:notificationId', subscriptionController.markNotificationRead);

// Get payment history
router.get('/payments', subscriptionController.getPaymentHistory);

// Check usage
router.get('/usage', subscriptionController.checkUsage);

// Admin routes (would need admin middleware)
router.get('/statistics', subscriptionController.getStatistics);

module.exports = router;
