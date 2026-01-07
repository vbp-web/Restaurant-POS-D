const rootAnalyticsService = require('../services/rootAnalyticsService');

// Get comprehensive dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
    try {
        const data = await rootAnalyticsService.getDashboardData();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data',
            error: error.message
        });
    }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        const [revenue, revenueByPlan] = await Promise.all([
            rootAnalyticsService.calculateRevenue(start, end),
            rootAnalyticsService.getRevenueByPlan(start, end)
        ]);

        res.json({
            success: true,
            data: {
                total: revenue.total,
                count: revenue.count,
                byPlan: revenueByPlan,
                period: { start, end }
            }
        });
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue analytics',
            error: error.message
        });
    }
};

// Get subscription analytics
exports.getSubscriptionAnalytics = async (req, res) => {
    try {
        const [stats, churnRate, mrr, arr] = await Promise.all([
            rootAnalyticsService.getSubscriptionStats(),
            rootAnalyticsService.calculateChurnRate(),
            rootAnalyticsService.calculateMRR(),
            rootAnalyticsService.calculateARR()
        ]);

        res.json({
            success: true,
            data: {
                stats,
                churnRate,
                mrr,
                arr
            }
        });
    } catch (error) {
        console.error('Error fetching subscription analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription analytics',
            error: error.message
        });
    }
};

// Get growth metrics
exports.getGrowthMetrics = async (req, res) => {
    try {
        const { months } = req.query;
        const monthsToFetch = months ? parseInt(months) : 6;

        const metrics = await rootAnalyticsService.getGrowthMetrics(monthsToFetch);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Error fetching growth metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch growth metrics',
            error: error.message
        });
    }
};

// Get top performing restaurants
exports.getTopRestaurants = async (req, res) => {
    try {
        const { limit } = req.query;
        const limitValue = limit ? parseInt(limit) : 10;

        const topRestaurants = await rootAnalyticsService.getTopRestaurants(limitValue);

        res.json({
            success: true,
            data: topRestaurants
        });
    } catch (error) {
        console.error('Error fetching top restaurants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top restaurants',
            error: error.message
        });
    }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
    try {
        const stats = await rootAnalyticsService.getPaymentStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment statistics',
            error: error.message
        });
    }
};
