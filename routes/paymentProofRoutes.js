const express = require('express');
const router = express.Router();
const paymentProofController = require('../controllers/paymentProofController');
const { protect, restaurantOnly, ensureOwnRestaurant } = require('../middleware/auth');

// Restaurant routes
router.post('/submit', protect, restaurantOnly, ensureOwnRestaurant, paymentProofController.submitPaymentProof);
router.get('/my-proofs', protect, restaurantOnly, ensureOwnRestaurant, paymentProofController.getPaymentProofs);
router.get('/my-proofs/:proofId', protect, restaurantOnly, ensureOwnRestaurant, paymentProofController.getPaymentProofById);

module.exports = router;
