const Subscription = require('../models/Subscription');
const SubscriptionService = require('../services/subscriptionService');

// Get subscription for a restaurant
exports.getSubscription = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        let subscription = await SubscriptionService.getSubscription(restaurantId);

        // If subscription doesn't exist, create one (for backward compatibility)
        if (!subscription) {
            console.log(`Creating subscription for restaurant ${restaurantId}`);
            subscription = await SubscriptionService.createSubscription(restaurantId);
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription',
            error: error.message
        });
    }
};

// Create subscription (usually done automatically when restaurant is created)
exports.createSubscription = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // Check if subscription already exists
        const existing = await SubscriptionService.getSubscription(restaurantId);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Subscription already exists for this restaurant'
            });
        }

        const subscription = await SubscriptionService.createSubscription(restaurantId);

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subscription',
            error: error.message
        });
    }
};

// Upgrade subscription plan
exports.upgradePlan = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { planName, paymentData } = req.body;

        if (!planName) {
            return res.status(400).json({
                success: false,
                message: 'Plan name is required'
            });
        }

        // Check if subscription exists, create if it doesn't
        let existingSubscription = await SubscriptionService.getSubscription(restaurantId);
        if (!existingSubscription) {
            console.log(`Creating subscription for restaurant ${restaurantId} before upgrade`);
            existingSubscription = await SubscriptionService.createSubscription(restaurantId);
        }

        const subscription = await SubscriptionService.upgradePlan(
            restaurantId,
            planName,
            paymentData
        );

        res.json({
            success: true,
            message: 'Plan upgraded successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Error upgrading plan:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upgrade plan',
            error: error.message
        });
    }
};

// Downgrade subscription plan
exports.downgradePlan = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { plan } = req.body;

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: 'Plan is required'
            });
        }

        const subscription = await SubscriptionService.downgradePlan(restaurantId, plan);

        res.json({
            success: true,
            message: 'Plan changed successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Error changing plan:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change plan',
            error: error.message
        });
    }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { reason } = req.body;

        const subscription = await SubscriptionService.cancelSubscription(
            restaurantId,
            reason
        );

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription',
            error: error.message
        });
    }
};

// Renew subscription
exports.renewSubscription = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { paymentData } = req.body;

        if (!paymentData) {
            return res.status(400).json({
                success: false,
                message: 'Payment data is required'
            });
        }

        const subscription = await SubscriptionService.renewSubscription(
            restaurantId,
            paymentData
        );

        res.json({
            success: true,
            message: 'Subscription renewed successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Error renewing subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to renew subscription',
            error: error.message
        });
    }
};

// Get pricing plans
exports.getPricingPlans = (req, res) => {
    try {
        const plans = SubscriptionService.getPricingPlans();

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Error fetching pricing plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing plans',
            error: error.message
        });
    }
};

// Get subscription statistics (admin only)
exports.getStatistics = async (req, res) => {
    try {
        const stats = await SubscriptionService.getStatistics();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

// Get notifications
exports.getNotifications = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const subscription = await Subscription.findOne({ restaurant: restaurantId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const notifications = subscription.notifications
            .sort((a, b) => b.sentAt - a.sentAt)
            .slice(0, 50);

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { restaurantId, notificationId } = req.params;

        const subscription = await Subscription.findOne({ restaurant: restaurantId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const notification = subscription.notifications.id(notificationId);
        if (notification) {
            notification.read = true;
            await subscription.save();
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification',
            error: error.message
        });
    }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const subscription = await Subscription.findOne({ restaurant: restaurantId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const payments = subscription.paymentHistory
            .sort((a, b) => b.paidAt - a.paidAt);

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history',
            error: error.message
        });
    }
};

// Check usage limits
exports.checkUsage = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const subscription = await Subscription.findOne({ restaurant: restaurantId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const usage = {
            restaurants: subscription.checkLimit('maxRestaurants'),
            orders: subscription.checkLimit('maxOrders'),
            staff: subscription.checkLimit('maxStaff'),
            tables: subscription.checkLimit('maxTables'),
            menuItems: subscription.checkLimit('maxMenuItems')
        };

        res.json({
            success: true,
            data: {
                plan: subscription.plan,
                usage: subscription.usage,
                limits: subscription.limits,
                checks: usage
            }
        });
    } catch (error) {
        console.error('Error checking usage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check usage',
            error: error.message
        });
    }
};
