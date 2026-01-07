const express = require('express');
const router = express.Router();
const { protect, restaurantOnly, ensureOwnRestaurant } = require('../middleware/auth');
const {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    updatePaymentStatus,
    generatePDF,
    getInvoiceStats,
    deleteInvoice
} = require('../controllers/invoiceController');

// All routes require authentication
router.use(protect, restaurantOnly, ensureOwnRestaurant);

// Invoice CRUD
router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/stats', getInvoiceStats);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

// Payment operations
router.put('/:id/payment', updatePaymentStatus);

// PDF generation
router.get('/:id/pdf', generatePDF);

module.exports = router;
