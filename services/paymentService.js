const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'demo_secret_key'
    });
};

/**
 * Create a payment order
 * @param {Number} amount - Amount in rupees
 * @param {String} currency - Currency code (default: INR)
 * @param {Object} notes - Additional notes
 * @returns {Object} Razorpay order object
 */
exports.createOrder = async (amount, currency = 'INR', notes = {}) => {
    try {
        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            notes: notes
        };

        const order = await razorpay.orders.create(options);
        console.log('💳 Payment order created:', order.id);
        return order;
    } catch (error) {
        console.error('❌ Payment order creation failed:', error);
        throw new Error('Failed to create payment order');
    }
};

/**
 * Verify payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID
 * @param {String} signature - Razorpay signature
 * @returns {Boolean} True if signature is valid
 */
exports.verifyPayment = (orderId, paymentId, signature) => {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'demo_secret_key';
        const text = orderId + '|' + paymentId;

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(text)
            .digest('hex');

        const isValid = generated_signature === signature;

        if (isValid) {
            console.log('✅ Payment verified successfully');
        } else {
            console.log('❌ Payment verification failed');
        }

        return isValid;
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        return false;
    }
};

/**
 * Fetch payment details
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Object} Payment details
 */
exports.getPaymentDetails = async (paymentId) => {
    try {
        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('❌ Failed to fetch payment details:', error);
        throw new Error('Failed to fetch payment details');
    }
};

/**
 * Create refund
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund (optional, full refund if not specified)
 * @returns {Object} Refund object
 */
exports.createRefund = async (paymentId, amount = null) => {
    try {
        const razorpay = getRazorpayInstance();

        const options = {};
        if (amount) {
            options.amount = Math.round(amount * 100); // Convert to paise
        }

        const refund = await razorpay.payments.refund(paymentId, options);
        console.log('💰 Refund created:', refund.id);
        return refund;
    } catch (error) {
        console.error('❌ Refund creation failed:', error);
        throw new Error('Failed to create refund');
    }
};

module.exports = exports;
