const Subscription = require('../models/Subscription');

// Middleware to check if subscription is active
const checkSubscription = async (req, res, next) => {
    try {
        const restaurantId = req.params.restaurantId || req.body.restaurant || req.user?.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const subscription = await Subscription.findOne({ restaurant: restaurantId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No subscription found. Please subscribe to a plan.'
            });
        }

        // Check if trial is active
        if (subscription.isTrialActive && subscription.isTrialValid) {
            req.subscription = subscription;
            return next();
        }

        // Check if subscription is active
        if (!subscription.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired. Please renew to continue.',
                subscriptionStatus: subscription.status
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking subscription',
            error: error.message
        });
    }
};

// Middleware to check if feature is available in subscription
const checkFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            const subscription = req.subscription;

            if (!subscription) {
                return res.status(403).json({
                    success: false,
                    message: 'Subscription information not found'
                });
            }

            if (!subscription.hasFeature(featureName)) {
                return res.status(403).json({
                    success: false,
                    message: `This feature is not available in your current plan. Please upgrade to access ${featureName.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
                    currentPlan: subscription.plan,
                    feature: featureName
                });
            }

            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking feature access',
                error: error.message
            });
        }
    };
};

// Middleware to check usage limits
const checkUsageLimit = (limitType) => {
    return async (req, res, next) => {
        try {
            const subscription = req.subscription;

            if (!subscription) {
                return res.status(403).json({
                    success: false,
                    message: 'Subscription information not found'
                });
            }

            const limitCheck = subscription.checkLimit(limitType);

            if (!limitCheck.allowed) {
                // Add notification
                await subscription.addNotification(
                    'limit_reached',
                    `You have reached your ${limitType.replace('max', '')} limit. Please upgrade your plan.`
                );

                return res.status(403).json({
                    success: false,
                    message: `You have reached your ${limitType.replace('max', '').toLowerCase()} limit (${limitCheck.limit}). Please upgrade your plan to add more.`,
                    currentPlan: subscription.plan,
                    limit: limitCheck.limit,
                    current: limitCheck.current
                });
            }

            req.limitCheck = limitCheck;
            next();
        } catch (error) {
            console.error('Usage limit check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking usage limit',
                error: error.message
            });
        }
    };
};

// Feature-specific middleware
const requireKitchenDisplay = checkFeature('kitchenDisplay');
const requireAnalytics = checkFeature('analytics');
const requireTableManagement = checkFeature('tableManagement');
const requireStaffManagement = checkFeature('staffManagement');
const requirePaymentIntegration = checkFeature('paymentIntegration');
const requireCustomBranding = checkFeature('customBranding');
const requireApiAccess = checkFeature('apiAccess');

// Usage limit middleware
const checkRestaurantLimit = checkUsageLimit('maxRestaurants');
const checkOrderLimit = checkUsageLimit('maxOrders');
const checkStaffLimit = checkUsageLimit('maxStaff');
const checkTableLimit = checkUsageLimit('maxTables');
const checkMenuItemLimit = checkUsageLimit('maxMenuItems');

module.exports = {
    checkSubscription,
    checkFeature,
    checkUsageLimit,
    requireKitchenDisplay,
    requireAnalytics,
    requireTableManagement,
    requireStaffManagement,
    requirePaymentIntegration,
    requireCustomBranding,
    requireApiAccess,
    checkRestaurantLimit,
    checkOrderLimit,
    checkStaffLimit,
    checkTableLimit,
    checkMenuItemLimit
};
