const PaymentProof = require('../models/PaymentProof');
const SubscriptionService = require('../services/subscriptionService');
const financialService = require('../services/financialService');

// Submit payment proof
exports.submitPaymentProof = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { plan, amount, transactionId, paymentScreenshot } = req.body;

        // Debug logging
        console.log('📤 Payment Proof Submission:');
        console.log('Restaurant ID:', restaurantId);
        console.log('Plan:', plan);
        console.log('Amount:', amount);
        console.log('Transaction ID:', transactionId);
        console.log('Screenshot present:', !!paymentScreenshot);
        console.log('Screenshot length:', paymentScreenshot ? paymentScreenshot.length : 0);

        // Validate required fields
        if (!plan || !amount || !transactionId || !paymentScreenshot) {
            const missingFields = [];
            if (!plan) missingFields.push('plan');
            if (!amount) missingFields.push('amount');
            if (!transactionId) missingFields.push('transactionId');
            if (!paymentScreenshot) missingFields.push('paymentScreenshot');

            console.log('❌ Missing fields:', missingFields);

            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Check if transaction ID already exists
        const existingProof = await PaymentProof.findOne({ transactionId });
        if (existingProof) {
            return res.status(400).json({
                success: false,
                message: 'This transaction ID has already been submitted'
            });
        }

        // Create payment proof
        const paymentProof = new PaymentProof({
            restaurant: restaurantId,
            plan,
            amount,
            transactionId,
            paymentScreenshot,
            status: 'pending'
        });

        await paymentProof.save();

        res.status(201).json({
            success: true,
            message: 'Payment proof submitted successfully. We will verify it within 24 hours.',
            data: {
                id: paymentProof._id,
                status: paymentProof.status,
                submittedAt: paymentProof.submittedAt
            }
        });
    } catch (error) {
        console.error('Error submitting payment proof:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit payment proof',
            error: error.message
        });
    }
};

// Get payment proofs for a restaurant
exports.getPaymentProofs = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const proofs = await PaymentProof.find({ restaurant: restaurantId })
            .sort({ submittedAt: -1 })
            .select('-paymentScreenshot'); // Don't send screenshot in list

        res.json({
            success: true,
            data: proofs
        });
    } catch (error) {
        console.error('Error fetching payment proofs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment proofs',
            error: error.message
        });
    }
};

// Get single payment proof with screenshot
exports.getPaymentProofById = async (req, res) => {
    try {
        const { proofId } = req.params;
        const restaurantId = req.restaurantId;

        const proof = await PaymentProof.findOne({
            _id: proofId,
            restaurant: restaurantId
        });

        if (!proof) {
            return res.status(404).json({
                success: false,
                message: 'Payment proof not found'
            });
        }

        res.json({
            success: true,
            data: proof
        });
    } catch (error) {
        console.error('Error fetching payment proof:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment proof',
            error: error.message
        });
    }
};

// Admin: Get all pending payment proofs
exports.getAllPendingProofs = async (req, res) => {
    try {
        const proofs = await PaymentProof.find({ status: 'pending' })
            .populate('restaurant', 'name email phone')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            data: proofs
        });
    } catch (error) {
        console.error('Error fetching pending proofs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending proofs',
            error: error.message
        });
    }
};

// Admin: Verify payment proof
exports.verifyPaymentProof = async (req, res) => {
    try {
        const { proofId } = req.params;
        const { notes } = req.body;
        const adminId = req.user._id;

        const proof = await PaymentProof.findById(proofId);

        if (!proof) {
            return res.status(404).json({
                success: false,
                message: 'Payment proof not found'
            });
        }

        if (proof.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This payment proof has already been processed'
            });
        }

        // Update payment proof status
        proof.status = 'verified';
        proof.verifiedBy = adminId;
        proof.verifiedAt = new Date();
        if (notes) proof.notes = notes;
        await proof.save();

        // Upgrade the restaurant's subscription
        try {
            await SubscriptionService.upgradePlan(
                proof.restaurant,
                proof.plan,
                {
                    amount: proof.amount,
                    transactionId: proof.transactionId,
                    method: 'UPI',
                    status: 'success'
                }
            );

            // Create transaction record
            await financialService.createTransaction({
                restaurant: proof.restaurant,
                type: 'SUBSCRIPTION',
                amount: proof.amount,
                status: 'COMPLETED',
                paymentMethod: 'UPI',
                transactionId: proof.transactionId,
                paymentProof: proof._id,
                plan: proof.plan,
                description: `Subscription upgrade to ${proof.plan} plan`,
                processedBy: adminId
            });
        } catch (upgradeError) {
            console.error('Error upgrading plan:', upgradeError);
            // Revert proof status if upgrade fails
            proof.status = 'pending';
            proof.verifiedBy = null;
            proof.verifiedAt = null;
            await proof.save();

            return res.status(500).json({
                success: false,
                message: 'Failed to upgrade subscription plan',
                error: upgradeError.message
            });
        }

        res.json({
            success: true,
            message: 'Payment verified and subscription upgraded successfully',
            data: proof
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

// Admin: Reject payment proof
exports.rejectPaymentProof = async (req, res) => {
    try {
        const { proofId } = req.params;
        const { reason } = req.body;
        const adminId = req.user._id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const proof = await PaymentProof.findById(proofId);

        if (!proof) {
            return res.status(404).json({
                success: false,
                message: 'Payment proof not found'
            });
        }

        if (proof.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This payment proof has already been processed'
            });
        }

        proof.status = 'rejected';
        proof.verifiedBy = adminId;
        proof.verifiedAt = new Date();
        proof.rejectionReason = reason;
        await proof.save();

        res.json({
            success: true,
            message: 'Payment proof rejected',
            data: proof
        });
    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject payment',
            error: error.message
        });
    }
};

// Admin: Get all payment proofs (with filters)
exports.getAllPaymentProofs = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const query = {};
        if (status) query.status = status;
        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) query.submittedAt.$gte = new Date(startDate);
            if (endDate) query.submittedAt.$lte = new Date(endDate);
        }

        const proofs = await PaymentProof.find(query)
            .populate('restaurant', 'name email phone')
            .populate('verifiedBy', 'email')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            data: proofs,
            count: proofs.length
        });
    } catch (error) {
        console.error('Error fetching payment proofs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment proofs',
            error: error.message
        });
    }
};
