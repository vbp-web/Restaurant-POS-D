const subscriptionAnalyticsService = require('../services/subscriptionAnalyticsService');

// Get subscription analytics dashboard
exports.getDashboard = async (req, res) => {
    try {
        const data = await subscriptionAnalyticsService.getDashboard();

        res.json({
            success: true,
            data
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

// Get lifecycle data
exports.getLifecycle = async (req, res) => {
    try {
        const data = await subscriptionAnalyticsService.getLifecycleData();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching lifecycle data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lifecycle data',
            error: error.message
        });
    }
};

// Get conversion metrics
exports.getConversion = async (req, res) => {
    try {
        const data = await subscriptionAnalyticsService.getConversionMetrics();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching conversion metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversion metrics',
            error: error.message
        });
    }
};

// Get upgrade/downgrade trends
exports.getTrends = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;
        const data = await subscriptionAnalyticsService.getUpgradeDowngradeTrends(months);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trends',
            error: error.message
        });
    }
};

// Get plan popularity
exports.getPlanPopularity = async (req, res) => {
    try {
        const data = await subscriptionAnalyticsService.getPlanPopularity();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching plan popularity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan popularity',
            error: error.message
        });
    }
};

// Get customer lifetime value
exports.getCLV = async (req, res) => {
    try {
        const data = await subscriptionAnalyticsService.getCustomerLifetimeValue();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching CLV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CLV',
            error: error.message
        });
    }
};

// Get renewal data
exports.getRenewal = async (req, res) => {
    try {
        const data = await subscriptionAnalyticsService.getRenewalData();

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching renewal data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch renewal data',
            error: error.message
        });
    }
};
