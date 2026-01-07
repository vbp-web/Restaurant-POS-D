const express = require('express');
const router = express.Router();
const {
    getMenuByQR,
    createOrder
} = require('../controllers/publicController');
const paymentService = require('../services/paymentService');

// Public routes (No authentication required)
router.get('/menu/:qrCode', getMenuByQR);
router.post('/orders', createOrder);

// Payment routes
router.post('/create-payment-order', async (req, res) => {
    try {
        const { amount, orderId, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const order = await paymentService.createOrder(amount, 'INR', {
            orderId: orderId,
            ...notes
        });

        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error('Payment order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order'
        });
    }
});

router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment details'
            });
        }

        const isValid = paymentService.verifyPayment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (isValid) {
            res.json({
                success: true,
                message: 'Payment verified successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification error'
        });
    }
});

module.exports = router;
