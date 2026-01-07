const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

/**
 * Get dashboard analytics for a restaurant
 * @param {String} restaurantId - Restaurant ID
 * @param {Date} startDate - Start date for analytics
 * @param {Date} endDate - End date for analytics
 * @returns {Object} Analytics data
 */
exports.getDashboardAnalytics = async (restaurantId, startDate, endDate) => {
    try {
        // Default to last 30 days if no dates provided
        if (!endDate) {
            endDate = new Date();
        }
        if (!startDate) {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }

        // Fetch orders in date range
        const orders = await Order.find({
            restaurantId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: -1 });

        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Calculate total orders
        const totalOrders = orders.length;

        // Calculate average order value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get order status breakdown
        const statusBreakdown = {
            NEW: orders.filter(o => o.status === 'NEW').length,
            PREPARING: orders.filter(o => o.status === 'PREPARING').length,
            SERVED: orders.filter(o => o.status === 'SERVED').length,
            PAID: orders.filter(o => o.status === 'PAID').length
        };

        // Calculate best-selling items
        const itemCounts = {};
        const itemRevenue = {};

        orders.forEach(order => {
            (order.items || []).forEach(item => {
                const itemName = item.name;
                itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity;
                itemRevenue[itemName] = (itemRevenue[itemName] || 0) + (item.price * item.quantity);
            });
        });

        const bestSellingItems = Object.entries(itemCounts)
            .map(([name, count]) => ({
                name,
                count,
                revenue: itemRevenue[name]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate hourly distribution
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
            hour,
            orders: 0,
            revenue: 0
        }));

        orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hourlyData[hour].orders++;
            hourlyData[hour].revenue += order.totalAmount || 0;
        });

        // Calculate daily revenue (last 7 days)
        const dailyRevenue = Array(7).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= date && orderDate < nextDate;
            });

            return {
                date: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
                revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                orders: dayOrders.length
            };
        });

        // Calculate peak hours
        const peakHour = hourlyData.reduce((max, curr) =>
            curr.orders > max.orders ? curr : max
            , { hour: 0, orders: 0 });

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        return {
            summary: {
                totalRevenue,
                totalOrders,
                avgOrderValue: Math.round(avgOrderValue),
                todayRevenue,
                todayOrders: todayOrders.length
            },
            statusBreakdown,
            bestSellingItems,
            hourlyData,
            dailyRevenue,
            peakHour: {
                hour: peakHour.hour,
                orders: peakHour.orders,
                time: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`
            },
            dateRange: {
                start: startDate,
                end: endDate
            }
        };
    } catch (error) {
        console.error('Analytics error:', error);
        throw new Error('Failed to generate analytics');
    }
};

/**
 * Get mock analytics data (for demo/testing)
 */
exports.getMockAnalytics = (restaurantId) => {
    return {
        summary: {
            totalRevenue: 45000,
            totalOrders: 156,
            avgOrderValue: 288,
            todayRevenue: 8500,
            todayOrders: 24
        },
        statusBreakdown: {
            NEW: 5,
            PREPARING: 8,
            SERVED: 12,
            PAID: 131
        },
        bestSellingItems: [
            { name: 'Paneer Tikka', count: 45, revenue: 11250 },
            { name: 'Butter Chicken', count: 38, revenue: 13300 },
            { name: 'French Fries', count: 52, revenue: 5200 },
            { name: 'Coke', count: 67, revenue: 3350 },
            { name: 'Naan', count: 89, revenue: 4450 }
        ],
        hourlyData: Array(24).fill(0).map((_, hour) => ({
            hour,
            orders: hour >= 12 && hour <= 14 ? Math.floor(Math.random() * 15) + 10 :
                hour >= 19 && hour <= 21 ? Math.floor(Math.random() * 20) + 15 :
                    Math.floor(Math.random() * 5),
            revenue: 0
        })),
        dailyRevenue: [
            { date: 'Mon, Dec 23', revenue: 5200, orders: 18 },
            { date: 'Tue, Dec 24', revenue: 6800, orders: 22 },
            { date: 'Wed, Dec 25', revenue: 8900, orders: 28 },
            { date: 'Thu, Dec 26', revenue: 7200, orders: 24 },
            { date: 'Fri, Dec 27', revenue: 9500, orders: 32 },
            { date: 'Sat, Dec 28', revenue: 11200, orders: 38 },
            { date: 'Sun, Dec 29', revenue: 8500, orders: 24 }
        ],
        peakHour: {
            hour: 20,
            orders: 25,
            time: '20:00 - 21:00'
        },
        dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
        }
    };
};

module.exports = exports;
