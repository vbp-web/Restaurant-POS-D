const Subscription = require('../models/Subscription');
const Restaurant = require('../models/Restaurant');
const Transaction = require('../models/Transaction');

class SubscriptionAnalyticsService {
    /**
     * Get subscription lifecycle data
     */
    async getLifecycleData() {
        try {
            const subscriptions = await Subscription.find()
                .populate('restaurant', 'createdAt');

            const lifecycle = {
                new: 0,           // Less than 30 days
                active: 0,        // 30-90 days
                established: 0,   // 90-180 days
                mature: 0,        // 180-365 days
                veteran: 0        // 365+ days
            };

            const now = new Date();

            subscriptions.forEach(sub => {
                if (sub.status !== 'active') return;

                const createdAt = sub.restaurant?.createdAt || sub.createdAt;
                const daysSinceCreation = Math.floor((now - new Date(createdAt)) / (1000 * 60 * 60 * 24));

                if (daysSinceCreation < 30) lifecycle.new++;
                else if (daysSinceCreation < 90) lifecycle.active++;
                else if (daysSinceCreation < 180) lifecycle.established++;
                else if (daysSinceCreation < 365) lifecycle.mature++;
                else lifecycle.veteran++;
            });

            return lifecycle;
        } catch (error) {
            console.error('Error getting lifecycle data:', error);
            throw error;
        }
    }

    /**
     * Get conversion metrics
     */
    async getConversionMetrics() {
        try {
            const totalRestaurants = await Restaurant.countDocuments();
            const freeUsers = await Subscription.countDocuments({ plan: 'FREE', status: 'active' });
            const paidUsers = await Subscription.countDocuments({
                plan: { $ne: 'FREE' },
                status: 'active'
            });

            // Trial to paid conversion (restaurants that upgraded from FREE)
            const upgradedFromFree = await Subscription.countDocuments({
                plan: { $ne: 'FREE' },
                status: 'active',
                previousPlan: 'FREE'
            });

            // Plan distribution among paid users
            const planDistribution = {
                BASIC: await Subscription.countDocuments({ plan: 'BASIC', status: 'active' }),
                PROFESSIONAL: await Subscription.countDocuments({ plan: 'PROFESSIONAL', status: 'active' }),
                ENTERPRISE: await Subscription.countDocuments({ plan: 'ENTERPRISE', status: 'active' })
            };

            const conversionRate = totalRestaurants > 0
                ? ((paidUsers / totalRestaurants) * 100).toFixed(2)
                : 0;

            const trialConversionRate = freeUsers > 0
                ? ((upgradedFromFree / (freeUsers + upgradedFromFree)) * 100).toFixed(2)
                : 0;

            return {
                totalRestaurants,
                freeUsers,
                paidUsers,
                upgradedFromFree,
                conversionRate,
                trialConversionRate,
                planDistribution
            };
        } catch (error) {
            console.error('Error getting conversion metrics:', error);
            throw error;
        }
    }

    /**
     * Get upgrade/downgrade trends
     */
    async getUpgradeDowngradeTrends(months = 6) {
        try {
            const trends = [];
            const now = new Date();

            for (let i = months - 1; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                const upgrades = await Transaction.countDocuments({
                    type: 'UPGRADE',
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                });

                const downgrades = await Transaction.countDocuments({
                    type: 'DOWNGRADE',
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                });

                const newSubscriptions = await Subscription.countDocuments({
                    plan: { $ne: 'FREE' },
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                });

                trends.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    upgrades,
                    downgrades,
                    newSubscriptions,
                    netChange: upgrades - downgrades
                });
            }

            return trends;
        } catch (error) {
            console.error('Error getting upgrade/downgrade trends:', error);
            throw error;
        }
    }

    /**
     * Get plan popularity metrics
     */
    async getPlanPopularity() {
        try {
            const plans = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
            const popularity = {};

            for (const plan of plans) {
                const count = await Subscription.countDocuments({ plan, status: 'active' });
                const revenue = await Transaction.aggregate([
                    {
                        $match: {
                            plan,
                            status: 'COMPLETED',
                            type: { $in: ['PAYMENT', 'SUBSCRIPTION', 'UPGRADE'] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' }
                        }
                    }
                ]);

                popularity[plan] = {
                    subscribers: count,
                    revenue: revenue[0]?.total || 0,
                    averageRevenue: count > 0 ? (revenue[0]?.total || 0) / count : 0
                };
            }

            return popularity;
        } catch (error) {
            console.error('Error getting plan popularity:', error);
            throw error;
        }
    }

    /**
     * Get customer lifetime value (CLV)
     */
    async getCustomerLifetimeValue() {
        try {
            const restaurants = await Restaurant.find();
            let totalCLV = 0;
            let count = 0;

            for (const restaurant of restaurants) {
                const revenue = await Transaction.aggregate([
                    {
                        $match: {
                            restaurant: restaurant._id,
                            status: 'COMPLETED',
                            type: { $in: ['PAYMENT', 'SUBSCRIPTION', 'UPGRADE'] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' }
                        }
                    }
                ]);

                if (revenue[0]?.total) {
                    totalCLV += revenue[0].total;
                    count++;
                }
            }

            const averageCLV = count > 0 ? totalCLV / count : 0;

            return {
                totalCLV,
                averageCLV,
                customersWithRevenue: count
            };
        } catch (error) {
            console.error('Error calculating CLV:', error);
            throw error;
        }
    }

    /**
     * Get subscription renewal data
     */
    async getRenewalData() {
        try {
            const now = new Date();
            const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const next60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
            const next90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            const expiringIn30 = await Subscription.countDocuments({
                status: 'active',
                endDate: { $gte: now, $lte: next30Days }
            });

            const expiringIn60 = await Subscription.countDocuments({
                status: 'active',
                endDate: { $gte: next30Days, $lte: next60Days }
            });

            const expiringIn90 = await Subscription.countDocuments({
                status: 'active',
                endDate: { $gte: next60Days, $lte: next90Days }
            });

            const expired = await Subscription.countDocuments({
                status: 'expired'
            });

            return {
                expiringIn30,
                expiringIn60,
                expiringIn90,
                expired,
                total: expiringIn30 + expiringIn60 + expiringIn90
            };
        } catch (error) {
            console.error('Error getting renewal data:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive subscription analytics dashboard
     */
    async getDashboard() {
        try {
            const [
                lifecycle,
                conversion,
                trends,
                popularity,
                clv,
                renewal
            ] = await Promise.all([
                this.getLifecycleData(),
                this.getConversionMetrics(),
                this.getUpgradeDowngradeTrends(6),
                this.getPlanPopularity(),
                this.getCustomerLifetimeValue(),
                this.getRenewalData()
            ]);

            return {
                lifecycle,
                conversion,
                trends,
                popularity,
                clv,
                renewal
            };
        } catch (error) {
            console.error('Error getting subscription analytics dashboard:', error);
            throw error;
        }
    }
}

module.exports = new SubscriptionAnalyticsService();
