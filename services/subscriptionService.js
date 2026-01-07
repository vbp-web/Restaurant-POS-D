const Subscription = require('../models/Subscription');

class SubscriptionService {
    // Create initial subscription for new restaurant
    static async createSubscription(restaurantId) {
        try {
            const subscription = new Subscription({
                restaurant: restaurantId,
                plan: 'free_trial',
                status: 'active',
                isTrialActive: true
            });

            subscription.setPlanDetails();
            await subscription.save();

            return subscription;
        } catch (error) {
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }

    // Get subscription by restaurant ID
    static async getSubscription(restaurantId) {
        try {
            const subscription = await Subscription.findOne({ restaurant: restaurantId });
            return subscription;
        } catch (error) {
            throw new Error(`Failed to get subscription: ${error.message}`);
        }
    }

    // Upgrade subscription plan
    static async upgradePlan(restaurantId, newPlan, paymentData = null) {
        try {
            const subscription = await Subscription.findOne({ restaurant: restaurantId });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            await subscription.upgradePlan(newPlan);

            // Add payment if provided
            if (paymentData) {
                await subscription.addPayment(paymentData);
            }

            await subscription.addNotification(
                'subscription_renewed',
                `Your subscription has been upgraded to ${newPlan} plan`
            );

            return subscription;
        } catch (error) {
            throw new Error(`Failed to upgrade plan: ${error.message}`);
        }
    }

    // Downgrade subscription plan
    static async downgradePlan(restaurantId, newPlan) {
        try {
            const subscription = await Subscription.findOne({ restaurant: restaurantId });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.plan = newPlan;
            subscription.setPlanDetails();
            await subscription.save();

            await subscription.addNotification(
                'subscription_renewed',
                `Your subscription has been changed to ${newPlan} plan`
            );

            return subscription;
        } catch (error) {
            throw new Error(`Failed to downgrade plan: ${error.message}`);
        }
    }

    // Cancel subscription
    static async cancelSubscription(restaurantId, reason) {
        try {
            const subscription = await Subscription.findOne({ restaurant: restaurantId });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            await subscription.cancelSubscription(reason);

            await subscription.addNotification(
                'subscription_cancelled',
                'Your subscription has been cancelled'
            );

            return subscription;
        } catch (error) {
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    // Renew subscription
    static async renewSubscription(restaurantId, paymentData) {
        try {
            const subscription = await Subscription.findOne({ restaurant: restaurantId });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            await subscription.addPayment(paymentData);

            await subscription.addNotification(
                'subscription_renewed',
                'Your subscription has been renewed successfully'
            );

            return subscription;
        } catch (error) {
            throw new Error(`Failed to renew subscription: ${error.message}`);
        }
    }

    // Track usage
    static async trackUsage(restaurantId, usageType) {
        try {
            const subscription = await Subscription.findOne({ restaurant: restaurantId });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            await subscription.incrementUsage(usageType);

            return subscription;
        } catch (error) {
            throw new Error(`Failed to track usage: ${error.message}`);
        }
    }

    // Check and notify trials ending soon
    static async notifyTrialsEndingSoon() {
        try {
            const subscriptions = await Subscription.checkTrialsEndingSoon(3);

            for (const subscription of subscriptions) {
                const daysRemaining = subscription.trialDaysRemaining;
                await subscription.addNotification(
                    'trial_ending',
                    `Your trial period ends in ${daysRemaining} days. Please subscribe to continue using the service.`
                );
            }

            return subscriptions;
        } catch (error) {
            throw new Error(`Failed to notify trials: ${error.message}`);
        }
    }

    // Check and update expired subscriptions
    static async updateExpiredSubscriptions() {
        try {
            const expired = await Subscription.checkExpiredSubscriptions();
            return expired;
        } catch (error) {
            throw new Error(`Failed to update expired subscriptions: ${error.message}`);
        }
    }

    // Reset monthly usage for all subscriptions
    static async resetMonthlyUsage() {
        try {
            const subscriptions = await Subscription.find({});

            for (const subscription of subscriptions) {
                await subscription.resetMonthlyUsage();
            }

            return subscriptions.length;
        } catch (error) {
            throw new Error(`Failed to reset monthly usage: ${error.message}`);
        }
    }

    // Get subscription statistics
    static async getStatistics() {
        try {
            const total = await Subscription.countDocuments();
            const active = await Subscription.countDocuments({ status: 'active' });
            const trials = await Subscription.countDocuments({ isTrialActive: true });
            const cancelled = await Subscription.countDocuments({ status: 'cancelled' });
            const expired = await Subscription.countDocuments({ status: 'expired' });

            const planBreakdown = await Subscription.aggregate([
                {
                    $group: {
                        _id: '$plan',
                        count: { $sum: 1 },
                        revenue: { $sum: '$amount' }
                    }
                }
            ]);

            const totalRevenue = await Subscription.aggregate([
                {
                    $match: { status: 'active' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            return {
                total,
                active,
                trials,
                cancelled,
                expired,
                planBreakdown,
                monthlyRevenue: totalRevenue[0]?.total || 0
            };
        } catch (error) {
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }

    // Get pricing plans
    static getPricingPlans() {
        return [
            {
                id: 'free_trial',
                name: 'FREE_TRIAL',
                price: 0,
                duration: '5 days only',
                description: 'Try all features free for 5 days',
                features: [
                    '✨ Full access to all features',
                    '📊 Test all premium tools',
                    '🎯 No payment required',
                    '⏰ 5 days to explore',
                    '📧 Email support'
                ],
                limits: {
                    maxRestaurants: 1,
                    maxOrders: 50,
                    maxStaff: 5,
                    maxTables: 10,
                    maxMenuItems: 50
                },
                requiresPayment: false
            },
            {
                id: 'basic',
                name: 'BASIC',
                price: 999,
                duration: 'per month',
                description: 'Perfect for small restaurants',
                features: [
                    '1 restaurant',
                    '500 orders/month',
                    'All core features',
                    'Kitchen display',
                    'Payment integration',
                    'Email support'
                ],
                limits: {
                    maxRestaurants: 1,
                    maxOrders: 500,
                    maxStaff: 10,
                    maxTables: 20,
                    maxMenuItems: 100
                },
                popular: false,
                requiresPayment: true
            },
            {
                id: 'professional',
                name: 'PROFESSIONAL',
                price: 2999,
                duration: 'per month',
                description: 'For growing restaurant businesses',
                features: [
                    '3 restaurants',
                    'Unlimited orders',
                    'All features',
                    'Analytics dashboard',
                    'Table management',
                    'Staff management',
                    'Priority support',
                    'Custom branding'
                ],
                limits: {
                    maxRestaurants: 3,
                    maxOrders: -1,
                    maxStaff: 50,
                    maxTables: 100,
                    maxMenuItems: 500
                },
                popular: true,
                requiresPayment: true
            },
            {
                id: 'enterprise',
                name: 'ENTERPRISE',
                price: 9999,
                duration: 'per month',
                description: 'For large restaurant chains',
                features: [
                    'Unlimited restaurants',
                    'Unlimited orders',
                    'All features',
                    'Multi-branch support',
                    'API access',
                    'Dedicated account manager',
                    'Custom development',
                    '24/7 support'
                ],
                limits: {
                    maxRestaurants: -1,
                    maxOrders: -1,
                    maxStaff: -1,
                    maxTables: -1,
                    maxMenuItems: -1
                },
                popular: false,
                requiresPayment: true
            }
        ];
    }
}

module.exports = SubscriptionService;
