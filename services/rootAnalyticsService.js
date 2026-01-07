const Subscription = require('../models/Subscription');
const PaymentProof = require('../models/PaymentProof');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

class RootAnalyticsService {
    /**
     * Calculate total revenue for a given period
     */
    async calculateRevenue(startDate, endDate) {
        try {
            const payments = await PaymentProof.find({
                status: 'verified',
                verifiedAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

            return {
                total: totalRevenue,
                count: payments.length,
                payments
            };
        } catch (error) {
            console.error('Error calculating revenue:', error);
            throw error;
        }
    }

    /**
     * Get revenue breakdown by plan
     */
    async getRevenueByPlan(startDate, endDate) {
        try {
            const payments = await PaymentProof.find({
                status: 'verified',
                verifiedAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            const revenueByPlan = {
                FREE: 0,
                BASIC: 0,
                PROFESSIONAL: 0,
                ENTERPRISE: 0
            };

            payments.forEach(payment => {
                if (revenueByPlan.hasOwnProperty(payment.plan)) {
                    revenueByPlan[payment.plan] += payment.amount;
                }
            });

            return revenueByPlan;
        } catch (error) {
            console.error('Error getting revenue by plan:', error);
            throw error;
        }
    }

    /**
     * Calculate MRR (Monthly Recurring Revenue)
     */
    async calculateMRR() {
        try {
            const activeSubscriptions = await Subscription.find({
                status: 'active'
            });

            // Plan monthly prices
            const planPrices = {
                FREE: 0,
                BASIC: 999,
                PROFESSIONAL: 2999,
                ENTERPRISE: 4999
            };

            let mrr = 0;
            activeSubscriptions.forEach(sub => {
                mrr += planPrices[sub.plan] || 0;
            });

            return mrr;
        } catch (error) {
            console.error('Error calculating MRR:', error);
            throw error;
        }
    }

    /**
     * Calculate ARR (Annual Recurring Revenue)
     */
    async calculateARR() {
        const mrr = await this.calculateMRR();
        return mrr * 12;
    }

    /**
     * Get subscription statistics
     */
    async getSubscriptionStats() {
        try {
            const subscriptions = await Subscription.find();

            const stats = {
                total: subscriptions.length,
                active: subscriptions.filter(s => s.status === 'active').length,
                cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
                expired: subscriptions.filter(s => s.status === 'expired').length,
                byPlan: {
                    FREE: subscriptions.filter(s => s.plan === 'FREE').length,
                    BASIC: subscriptions.filter(s => s.plan === 'BASIC').length,
                    PROFESSIONAL: subscriptions.filter(s => s.plan === 'PROFESSIONAL').length,
                    ENTERPRISE: subscriptions.filter(s => s.plan === 'ENTERPRISE').length
                }
            };

            return stats;
        } catch (error) {
            console.error('Error getting subscription stats:', error);
            throw error;
        }
    }

    /**
     * Calculate churn rate
     */
    async calculateChurnRate(period = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - period);

            const startSubscriptions = await Subscription.countDocuments({
                createdAt: { $lte: startDate },
                status: 'active'
            });

            const cancelledInPeriod = await Subscription.countDocuments({
                status: 'cancelled',
                updatedAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            const churnRate = startSubscriptions > 0
                ? (cancelledInPeriod / startSubscriptions) * 100
                : 0;

            return {
                churnRate: churnRate.toFixed(2),
                cancelled: cancelledInPeriod,
                total: startSubscriptions,
                period
            };
        } catch (error) {
            console.error('Error calculating churn rate:', error);
            throw error;
        }
    }

    /**
     * Get growth metrics
     */
    async getGrowthMetrics(months = 6) {
        try {
            const metrics = [];
            const now = new Date();

            for (let i = months - 1; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                const revenue = await this.calculateRevenue(monthStart, monthEnd);
                const newRestaurants = await Restaurant.countDocuments({
                    createdAt: {
                        $gte: monthStart,
                        $lte: monthEnd
                    }
                });

                const newSubscriptions = await Subscription.countDocuments({
                    createdAt: {
                        $gte: monthStart,
                        $lte: monthEnd
                    },
                    plan: { $ne: 'FREE' }
                });

                metrics.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    revenue: revenue.total,
                    newRestaurants,
                    newSubscriptions
                });
            }

            return metrics;
        } catch (error) {
            console.error('Error getting growth metrics:', error);
            throw error;
        }
    }

    /**
     * Get top performing restaurants
     */
    async getTopRestaurants(limit = 10) {
        try {
            const payments = await PaymentProof.find({ status: 'verified' })
                .populate('restaurant', 'name email');

            // Aggregate by restaurant
            const restaurantRevenue = {};

            payments.forEach(payment => {
                if (payment.restaurant) {
                    const id = payment.restaurant._id.toString();
                    if (!restaurantRevenue[id]) {
                        restaurantRevenue[id] = {
                            restaurant: payment.restaurant,
                            totalRevenue: 0,
                            paymentCount: 0
                        };
                    }
                    restaurantRevenue[id].totalRevenue += payment.amount;
                    restaurantRevenue[id].paymentCount += 1;
                }
            });

            // Convert to array and sort
            const topRestaurants = Object.values(restaurantRevenue)
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, limit);

            return topRestaurants;
        } catch (error) {
            console.error('Error getting top restaurants:', error);
            throw error;
        }
    }

    /**
     * Get payment success/failure rates
     */
    async getPaymentStats() {
        try {
            const allPayments = await PaymentProof.find();

            const stats = {
                total: allPayments.length,
                verified: allPayments.filter(p => p.status === 'verified').length,
                pending: allPayments.filter(p => p.status === 'pending').length,
                rejected: allPayments.filter(p => p.status === 'rejected').length
            };

            stats.successRate = stats.total > 0
                ? ((stats.verified / stats.total) * 100).toFixed(2)
                : 0;

            stats.rejectionRate = stats.total > 0
                ? ((stats.rejected / stats.total) * 100).toFixed(2)
                : 0;

            return stats;
        } catch (error) {
            console.error('Error getting payment stats:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive dashboard data
     */
    async getDashboardData() {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const yearStart = new Date(now.getFullYear(), 0, 1);

            const [
                todayRevenue,
                monthRevenue,
                yearRevenue,
                revenueByPlan,
                mrr,
                arr,
                subscriptionStats,
                churnRate,
                growthMetrics,
                topRestaurants,
                paymentStats,
                totalRestaurants,
                activeRestaurants
            ] = await Promise.all([
                this.calculateRevenue(todayStart, now),
                this.calculateRevenue(monthStart, now),
                this.calculateRevenue(yearStart, now),
                this.getRevenueByPlan(yearStart, now),
                this.calculateMRR(),
                this.calculateARR(),
                this.getSubscriptionStats(),
                this.calculateChurnRate(),
                this.getGrowthMetrics(6),
                this.getTopRestaurants(5),
                this.getPaymentStats(),
                Restaurant.countDocuments(),
                Restaurant.countDocuments({ status: 'approved' })
            ]);

            return {
                revenue: {
                    today: todayRevenue.total,
                    month: monthRevenue.total,
                    year: yearRevenue.total,
                    byPlan: revenueByPlan
                },
                recurring: {
                    mrr,
                    arr
                },
                subscriptions: subscriptionStats,
                restaurants: {
                    total: totalRestaurants,
                    active: activeRestaurants
                },
                churn: churnRate,
                growth: growthMetrics,
                topRestaurants,
                payments: paymentStats
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            throw error;
        }
    }
}

module.exports = new RootAnalyticsService();
