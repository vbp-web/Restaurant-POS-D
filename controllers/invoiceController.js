const InvoiceService = require('../services/invoiceService');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

// @desc    Create invoice from order
// @route   POST /api/invoices
// @access  Private (Restaurant only)
exports.createInvoice = async (req, res) => {
    try {
        const { orderId, ...invoiceData } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Verify order belongs to restaurant
        const order = await Order.findOne({
            _id: orderId,
            restaurantId: req.restaurantId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Create invoice
        const invoice = await InvoiceService.createInvoice(
            orderId,
            req.restaurantId,
            invoiceData
        );

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Get all invoices for restaurant
// @route   GET /api/invoices
// @access  Private (Restaurant only)
exports.getInvoices = async (req, res) => {
    try {
        const { startDate, endDate, paymentStatus, limit = 50, page = 1 } = req.query;

        const query = { restaurantId: req.restaurantId };

        // Filter by date range
        if (startDate || endDate) {
            query.invoiceDate = {};
            if (startDate) query.invoiceDate.$gte = new Date(startDate);
            if (endDate) query.invoiceDate.$lte = new Date(endDate);
        }

        // Filter by payment status
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const invoices = await Invoice.find(query)
            .sort('-invoiceDate')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Invoice.countDocuments(query);

        res.json({
            success: true,
            count: invoices.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: invoices
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private (Restaurant only)
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private (Restaurant only)
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const {
            customerName,
            customerPhone,
            customerEmail,
            customerGSTIN,
            discount,
            discountPercentage,
            notes,
            termsAndConditions
        } = req.body;

        // Update allowed fields
        if (customerName !== undefined) invoice.customerName = customerName;
        if (customerPhone !== undefined) invoice.customerPhone = customerPhone;
        if (customerEmail !== undefined) invoice.customerEmail = customerEmail;
        if (customerGSTIN !== undefined) invoice.customerGSTIN = customerGSTIN;
        if (notes !== undefined) invoice.notes = notes;
        if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions;

        // Recalculate if discount changed
        if (discount !== undefined || discountPercentage !== undefined) {
            const calculations = InvoiceService.calculateTaxes(
                invoice.subtotal,
                discount !== undefined ? discount : invoice.discount,
                discountPercentage !== undefined ? discountPercentage : invoice.discountPercentage,
                invoice.taxDetails.igst.amount > 0
            );

            Object.assign(invoice, calculations);
        }

        await invoice.save();

        res.json({
            success: true,
            message: 'Invoice updated successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update payment status
// @route   PUT /api/invoices/:id/payment
// @access  Private (Restaurant only)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentMethod, paidAmount } = req.body;

        if (!paymentMethod || paidAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Payment method and paid amount are required'
            });
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const updatedInvoice = await InvoiceService.updatePaymentStatus(
            invoice._id,
            { paymentMethod, paidAmount }
        );

        // Update order status to PAID if invoice is fully paid
        if (updatedInvoice.paymentStatus === 'PAID') {
            await Order.findByIdAndUpdate(updatedInvoice.orderId, {
                status: 'PAID'
            });
        }

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: updatedInvoice
        });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Generate PDF invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private (Restaurant only)
exports.generatePDF = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const pdfBuffer = await InvoiceService.generatePDF(invoice._id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF'
        });
    }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private (Restaurant only)
exports.getInvoiceStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = { restaurantId: req.restaurantId };

        if (startDate || endDate) {
            query.invoiceDate = {};
            if (startDate) query.invoiceDate.$gte = new Date(startDate);
            if (endDate) query.invoiceDate.$lte = new Date(endDate);
        }

        const invoices = await Invoice.find(query);

        const stats = {
            totalInvoices: invoices.length,
            totalRevenue: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
            totalPaid: invoices.filter(inv => inv.paymentStatus === 'PAID')
                .reduce((sum, inv) => sum + inv.paidAmount, 0),
            totalUnpaid: invoices.filter(inv => inv.paymentStatus === 'UNPAID')
                .reduce((sum, inv) => sum + inv.grandTotal, 0),
            totalPartial: invoices.filter(inv => inv.paymentStatus === 'PARTIAL')
                .reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0),
            totalTax: invoices.reduce((sum, inv) => sum + inv.totalTax, 0),
            totalDiscount: invoices.reduce((sum, inv) => sum + inv.discount, 0),
            paymentMethodBreakdown: {
                CASH: invoices.filter(inv => inv.paymentMethod === 'CASH').length,
                CARD: invoices.filter(inv => inv.paymentMethod === 'CARD').length,
                UPI: invoices.filter(inv => inv.paymentMethod === 'UPI').length,
                WALLET: invoices.filter(inv => inv.paymentMethod === 'WALLET').length,
                PENDING: invoices.filter(inv => inv.paymentMethod === 'PENDING').length
            },
            statusBreakdown: {
                PAID: invoices.filter(inv => inv.paymentStatus === 'PAID').length,
                UNPAID: invoices.filter(inv => inv.paymentStatus === 'UNPAID').length,
                PARTIAL: invoices.filter(inv => inv.paymentStatus === 'PARTIAL').length
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get invoice stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Restaurant only)
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            restaurantId: req.restaurantId
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Only allow deletion of unpaid invoices
        if (invoice.paymentStatus === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete paid invoices'
            });
        }

        await invoice.deleteOne();

        res.json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
