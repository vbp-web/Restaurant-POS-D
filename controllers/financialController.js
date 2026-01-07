const financialService = require('../services/financialService');

// Get all transactions with filters
exports.getTransactions = async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            type: req.query.type,
            status: req.query.status,
            restaurant: req.query.restaurant,
            limit: parseInt(req.query.limit) || 50,
            skip: parseInt(req.query.skip) || 0
        };

        const result = await financialService.getTransactions(filters);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message
        });
    }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await financialService.getTransactionById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction',
            error: error.message
        });
    }
};

// Get financial summary
exports.getFinancialSummary = async (req, res) => {
    try {
        const startDate = req.query.startDate
            ? new Date(req.query.startDate)
            : new Date(new Date().getFullYear(), 0, 1);

        const endDate = req.query.endDate
            ? new Date(req.query.endDate)
            : new Date();

        const summary = await financialService.getFinancialSummary(startDate, endDate);

        res.json({
            success: true,
            data: summary,
            period: { startDate, endDate }
        });
    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch financial summary',
            error: error.message
        });
    }
};

// Process refund
exports.processRefund = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { amount, reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Refund reason is required'
            });
        }

        const result = await financialService.processRefund(transactionId, {
            amount,
            reason,
            processedBy: req.user._id
        });

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process refund',
            error: error.message
        });
    }
};

// Export transactions to CSV
exports.exportTransactions = async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            type: req.query.type,
            status: req.query.status,
            restaurant: req.query.restaurant
        };

        const csv = await financialService.exportToCSV(filters);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export transactions',
            error: error.message
        });
    }
};

// Get revenue trends
exports.getRevenueTrends = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const trends = await financialService.getRevenueTrends(months);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Error fetching revenue trends:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue trends',
            error: error.message
        });
    }
};

// Create manual transaction (for admin)
exports.createTransaction = async (req, res) => {
    try {
        const transactionData = {
            ...req.body,
            processedBy: req.user._id
        };

        const transaction = await financialService.createTransaction(transactionData);

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transaction',
            error: error.message
        });
    }
};
