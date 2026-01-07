const Transaction = require('../models/Transaction');
const PaymentProof = require('../models/PaymentProof');
const Restaurant = require('../models/Restaurant');

class FinancialService {
    /**
     * Create a new transaction
     */
    async createTransaction(data) {
        try {
            const transaction = new Transaction(data);
            await transaction.save();
            return transaction;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    /**
     * Get all transactions with filters
     */
    async getTransactions(filters = {}) {
        try {
            const {
                startDate,
                endDate,
                type,
                status,
                restaurant,
                limit = 100,
                skip = 0
            } = filters;

            const query = {};

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            if (type) query.type = type;
            if (status) query.status = status;
            if (restaurant) query.restaurant = restaurant;

            const transactions = await Transaction.find(query)
                .populate('restaurant', 'name email')
                .populate('processedBy', 'email')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);

            const total = await Transaction.countDocuments(query);

            return {
                transactions,
                total,
                page: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error getting transactions:', error);
            throw error;
        }
    }

    /**
     * Get transaction by ID
     */
    async getTransactionById(id) {
        try {
            const transaction = await Transaction.findById(id)
                .populate('restaurant', 'name email phone')
                .populate('processedBy', 'email')
                .populate('paymentProof');

            return transaction;
        } catch (error) {
            console.error('Error getting transaction:', error);
            throw error;
        }
    }

    /**
     * Get financial summary
     */
    async getFinancialSummary(startDate, endDate) {
        try {
            const query = {
                status: 'COMPLETED',
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            const transactions = await Transaction.find(query);

            const summary = {
                totalRevenue: 0,
                totalRefunds: 0,
                netRevenue: 0,
                transactionCount: transactions.length,
                byType: {},
                byPlan: {},
                byPaymentMethod: {}
            };

            transactions.forEach(txn => {
                if (txn.type === 'REFUND') {
                    summary.totalRefunds += txn.amount;
                } else {
                    summary.totalRevenue += txn.amount;
                }

                // By type
                if (!summary.byType[txn.type]) {
                    summary.byType[txn.type] = { count: 0, amount: 0 };
                }
                summary.byType[txn.type].count++;
                summary.byType[txn.type].amount += txn.amount;

                // By plan
                if (txn.plan) {
                    if (!summary.byPlan[txn.plan]) {
                        summary.byPlan[txn.plan] = { count: 0, amount: 0 };
                    }
                    summary.byPlan[txn.plan].count++;
                    summary.byPlan[txn.plan].amount += txn.amount;
                }

                // By payment method
                if (!summary.byPaymentMethod[txn.paymentMethod]) {
                    summary.byPaymentMethod[txn.paymentMethod] = { count: 0, amount: 0 };
                }
                summary.byPaymentMethod[txn.paymentMethod].count++;
                summary.byPaymentMethod[txn.paymentMethod].amount += txn.amount;
            });

            summary.netRevenue = summary.totalRevenue - summary.totalRefunds;

            return summary;
        } catch (error) {
            console.error('Error getting financial summary:', error);
            throw error;
        }
    }

    /**
     * Process refund
     */
    async processRefund(transactionId, refundData) {
        try {
            const transaction = await Transaction.findById(transactionId);

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (transaction.status === 'REFUNDED') {
                throw new Error('Transaction already refunded');
            }

            // Create refund transaction
            const refund = await this.createTransaction({
                restaurant: transaction.restaurant,
                type: 'REFUND',
                amount: refundData.amount || transaction.amount,
                status: 'COMPLETED',
                paymentMethod: transaction.paymentMethod,
                transactionId: `REFUND-${Date.now()}`,
                description: `Refund for ${transaction.transactionId}`,
                refundReason: refundData.reason,
                processedBy: refundData.processedBy,
                metadata: {
                    originalTransaction: transactionId
                }
            });

            // Update original transaction
            transaction.status = 'REFUNDED';
            transaction.refundedAt = new Date();
            await transaction.save();

            return {
                original: transaction,
                refund
            };
        } catch (error) {
            console.error('Error processing refund:', error);
            throw error;
        }
    }

    /**
     * Export transactions to CSV format
     */
    async exportToCSV(filters = {}) {
        try {
            const { transactions } = await this.getTransactions({ ...filters, limit: 10000 });

            const csvRows = [
                ['Date', 'Transaction ID', 'Restaurant', 'Type', 'Amount', 'Status', 'Payment Method', 'Plan', 'Description']
            ];

            transactions.forEach(txn => {
                csvRows.push([
                    new Date(txn.createdAt).toLocaleDateString('en-IN'),
                    txn.transactionId,
                    txn.restaurant?.name || 'N/A',
                    txn.type,
                    txn.amount,
                    txn.status,
                    txn.paymentMethod,
                    txn.plan || 'N/A',
                    txn.description || ''
                ]);
            });

            return csvRows.map(row => row.join(',')).join('\n');
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            throw error;
        }
    }

    /**
     * Get revenue trends
     */
    async getRevenueTrends(months = 12) {
        try {
            const trends = [];
            const now = new Date();

            for (let i = months - 1; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                const summary = await this.getFinancialSummary(monthStart, monthEnd);

                trends.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    revenue: summary.totalRevenue,
                    refunds: summary.totalRefunds,
                    netRevenue: summary.netRevenue,
                    transactions: summary.transactionCount
                });
            }

            return trends;
        } catch (error) {
            console.error('Error getting revenue trends:', error);
            throw error;
        }
    }
}

module.exports = new FinancialService();
