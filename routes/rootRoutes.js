const express = require('express');
const router = express.Router();
const { protect, rootOnly } = require('../middleware/auth');
const {
    login,
    getAllRestaurants,
    approveRestaurant,
    blockRestaurant
} = require('../controllers/rootController');
const paymentProofController = require('../controllers/paymentProofController');
const analyticsController = require('../controllers/rootAnalyticsController');
const financialController = require('../controllers/financialController');
const subscriptionAnalyticsController = require('../controllers/subscriptionAnalyticsController');
const settingsController = require('../controllers/settingsController');

// Root admin routes
router.post('/login', login);
router.get('/restaurants', protect, rootOnly, getAllRestaurants);
router.put('/restaurants/:id/approve', protect, rootOnly, approveRestaurant);
router.put('/restaurants/:id/block', protect, rootOnly, blockRestaurant);

// Payment proof verification routes
router.get('/payment-proofs', protect, rootOnly, paymentProofController.getAllPaymentProofs);
router.get('/payment-proofs/pending', protect, rootOnly, paymentProofController.getAllPendingProofs);
router.put('/payment-proofs/:proofId/verify', protect, rootOnly, paymentProofController.verifyPaymentProof);
router.put('/payment-proofs/:proofId/reject', protect, rootOnly, paymentProofController.rejectPaymentProof);

// Analytics routes
router.get('/analytics/dashboard', protect, rootOnly, analyticsController.getDashboardAnalytics);
router.get('/analytics/revenue', protect, rootOnly, analyticsController.getRevenueAnalytics);
router.get('/analytics/subscriptions', protect, rootOnly, analyticsController.getSubscriptionAnalytics);
router.get('/analytics/growth', protect, rootOnly, analyticsController.getGrowthMetrics);
router.get('/analytics/top-restaurants', protect, rootOnly, analyticsController.getTopRestaurants);
router.get('/analytics/payments', protect, rootOnly, analyticsController.getPaymentStats);

// Financial Management routes
router.get('/financial/transactions', protect, rootOnly, financialController.getTransactions);
router.get('/financial/transactions/:id', protect, rootOnly, financialController.getTransactionById);
router.get('/financial/summary', protect, rootOnly, financialController.getFinancialSummary);
router.get('/financial/trends', protect, rootOnly, financialController.getRevenueTrends);
router.get('/financial/export', protect, rootOnly, financialController.exportTransactions);
router.post('/financial/transactions', protect, rootOnly, financialController.createTransaction);
router.post('/financial/refund/:transactionId', protect, rootOnly, financialController.processRefund);

// Subscription Analytics routes
router.get('/subscription-analytics/dashboard', protect, rootOnly, subscriptionAnalyticsController.getDashboard);
router.get('/subscription-analytics/lifecycle', protect, rootOnly, subscriptionAnalyticsController.getLifecycle);
router.get('/subscription-analytics/conversion', protect, rootOnly, subscriptionAnalyticsController.getConversion);
router.get('/subscription-analytics/trends', protect, rootOnly, subscriptionAnalyticsController.getTrends);
router.get('/subscription-analytics/popularity', protect, rootOnly, subscriptionAnalyticsController.getPlanPopularity);
router.get('/subscription-analytics/clv', protect, rootOnly, subscriptionAnalyticsController.getCLV);
router.get('/subscription-analytics/renewal', protect, rootOnly, subscriptionAnalyticsController.getRenewal);

// System Settings routes
router.get('/settings', protect, rootOnly, settingsController.getSettings);
router.put('/settings/platform', protect, rootOnly, settingsController.updatePlatformSettings);

// Feature Flags
router.get('/settings/features', protect, rootOnly, settingsController.getFeatureFlags);
router.put('/settings/features', protect, rootOnly, settingsController.updateFeatureFlag);
router.delete('/settings/features/:name', protect, rootOnly, settingsController.deleteFeatureFlag);

// Pricing Plans
router.get('/settings/pricing-plans', protect, rootOnly, settingsController.getPricingPlans);
router.post('/settings/pricing-plans', protect, rootOnly, settingsController.createPricingPlan);
router.put('/settings/pricing-plans/:planId', protect, rootOnly, settingsController.updatePricingPlan);
router.delete('/settings/pricing-plans/:planId', protect, rootOnly, settingsController.deletePricingPlan);

// Payment Gateways
router.get('/settings/payment-gateways', protect, rootOnly, settingsController.getPaymentGateways);
router.put('/settings/payment-gateways', protect, rootOnly, settingsController.updatePaymentGateways);

// Email Configuration
router.get('/settings/email-config', protect, rootOnly, settingsController.getEmailConfig);
router.put('/settings/email-config', protect, rootOnly, settingsController.updateEmailConfig);

// Security Settings
router.get('/settings/security', protect, rootOnly, settingsController.getSecuritySettings);
router.put('/settings/security', protect, rootOnly, settingsController.updateSecuritySettings);

// Integrations
router.get('/settings/integrations', protect, rootOnly, settingsController.getIntegrations);
router.put('/settings/integrations', protect, rootOnly, settingsController.updateIntegrations);

// Maintenance Mode
router.post('/settings/maintenance-mode', protect, rootOnly, settingsController.toggleMaintenanceMode);

// System Limits
router.get('/settings/system-limits', protect, rootOnly, settingsController.getSystemLimits);
router.put('/settings/system-limits', protect, rootOnly, settingsController.updateSystemLimits);

module.exports = router;
