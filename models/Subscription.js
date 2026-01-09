const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['free_trial', 'basic', 'professional', 'enterprise'],
        default: 'free_trial'
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'suspended', 'past_due'],
        default: 'active'
    },
    // Trial Information
    trialStartDate: {
        type: Date,
        default: Date.now
    },
    trialEndDate: {
        type: Date,
        default: function () {
            const date = new Date();
            date.setDate(date.getDate() + 5); // 5 days trial
            return date;
        }
    },
    isTrialActive: {
        type: Boolean,
        default: true
    },
    // Subscription Dates
    currentPeriodStart: {
        type: Date,
        default: Date.now
    },
    currentPeriodEnd: {
        type: Date,
        default: function () {
            const date = new Date();
            date.setMonth(date.getMonth() + 1); // 1 month
            return date;
        }
    },
    // Billing
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    amount: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    // Payment Information
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'none'],
        default: 'none'
    },
    lastPaymentDate: Date,
    nextBillingDate: Date,
    // Usage Tracking
    usage: {
        restaurantsCount: {
            type: Number,
            default: 0
        },
        ordersThisMonth: {
            type: Number,
            default: 0
        },
        staffCount: {
            type: Number,
            default: 0
        },
        tablesCount: {
            type: Number,
            default: 0
        },
        menuItemsCount: {
            type: Number,
            default: 0
        }
    },
    // Plan Limits
    limits: {
        maxRestaurants: {
            type: Number,
            default: 1
        },
        maxOrders: {
            type: Number,
            default: 50
        },
        maxStaff: {
            type: Number,
            default: 5
        },
        maxTables: {
            type: Number,
            default: 10
        },
        maxMenuItems: {
            type: Number,
            default: 50
        }
    },
    // Features Access
    features: {
        basicFeatures: {
            type: Boolean,
            default: true
        },
        kitchenDisplay: {
            type: Boolean,
            default: false
        },
        analytics: {
            type: Boolean,
            default: false
        },
        tableManagement: {
            type: Boolean,
            default: false
        },
        staffManagement: {
            type: Boolean,
            default: false
        },
        paymentIntegration: {
            type: Boolean,
            default: false
        },
        customBranding: {
            type: Boolean,
            default: false
        },
        apiAccess: {
            type: Boolean,
            default: false
        },
        prioritySupport: {
            type: Boolean,
            default: false
        },
        dedicatedManager: {
            type: Boolean,
            default: false
        }
    },
    // Cancellation
    cancelledAt: Date,
    cancelReason: String,
    // Auto-renewal
    autoRenew: {
        type: Boolean,
        default: true
    },
    // Notifications
    notifications: [{
        type: {
            type: String,
            enum: ['payment_due', 'payment_failed', 'trial_ending', 'subscription_renewed', 'subscription_cancelled', 'limit_reached']
        },
        message: String,
        sentAt: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    // Payment History
    paymentHistory: [{
        amount: Number,
        currency: String,
        status: {
            type: String,
            enum: ['success', 'failed', 'pending', 'refunded']
        },
        paymentMethod: String,
        transactionId: String,
        paidAt: Date,
        invoiceUrl: String
    }]
}, {
    timestamps: true
});

// Indexes
subscriptionSchema.index({ restaurant: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
    return this.status === 'active' && new Date() < this.currentPeriodEnd;
});

// Virtual for checking if trial is active
subscriptionSchema.virtual('isTrialValid').get(function () {
    return this.isTrialActive && new Date() < this.trialEndDate;
});

// Virtual for days remaining in trial
subscriptionSchema.virtual('trialDaysRemaining').get(function () {
    if (!this.isTrialActive) return 0;
    const now = new Date();
    const diff = this.trialEndDate - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to set plan limits and features
subscriptionSchema.methods.setPlanDetails = function () {
    const planDetails = {
        free_trial: {
            amount: 0,
            limits: {
                maxRestaurants: 1,
                maxOrders: 50,
                maxStaff: 5,
                maxTables: 10,
                maxMenuItems: 50
            },
            features: {
                basicFeatures: true,
                kitchenDisplay: false,
                analytics: false,
                tableManagement: false,
                staffManagement: false,
                paymentIntegration: false,
                customBranding: false,
                apiAccess: false,
                prioritySupport: false,
                dedicatedManager: false
            }
        },
        basic: {
            amount: 999,
            limits: {
                maxRestaurants: 1,
                maxOrders: 500,
                maxStaff: 10,
                maxTables: 20,
                maxMenuItems: 100
            },
            features: {
                basicFeatures: true,
                kitchenDisplay: true,
                analytics: false,
                tableManagement: false,
                staffManagement: false,
                paymentIntegration: true,
                customBranding: false,
                apiAccess: false,
                prioritySupport: false,
                dedicatedManager: false
            }
        },
        professional: {
            amount: 2999,
            limits: {
                maxRestaurants: 3,
                maxOrders: -1, // unlimited
                maxStaff: 50,
                maxTables: 100,
                maxMenuItems: 500
            },
            features: {
                basicFeatures: true,
                kitchenDisplay: true,
                analytics: true,
                tableManagement: true,
                staffManagement: true,
                paymentIntegration: true,
                customBranding: true,
                apiAccess: false,
                prioritySupport: true,
                dedicatedManager: false
            }
        },
        enterprise: {
            amount: 9999,
            limits: {
                maxRestaurants: -1, // unlimited
                maxOrders: -1, // unlimited
                maxStaff: -1, // unlimited
                maxTables: -1, // unlimited
                maxMenuItems: -1 // unlimited
            },
            features: {
                basicFeatures: true,
                kitchenDisplay: true,
                analytics: true,
                tableManagement: true,
                staffManagement: true,
                paymentIntegration: true,
                customBranding: true,
                apiAccess: true,
                prioritySupport: true,
                dedicatedManager: true
            }
        }
    };

    const details = planDetails[this.plan];
    if (details) {
        this.amount = details.amount;
        this.limits = details.limits;
        this.features = details.features;
    }
};

// Method to check if feature is available
subscriptionSchema.methods.hasFeature = function (featureName) {
    return this.features[featureName] === true;
};

// Method to check usage limit
subscriptionSchema.methods.checkLimit = function (limitType) {
    const limit = this.limits[limitType];
    const usage = this.usage[limitType.replace('max', '').toLowerCase() + 'Count'];

    // -1 means unlimited
    if (limit === -1) return { allowed: true, remaining: -1 };

    return {
        allowed: usage < limit,
        remaining: Math.max(0, limit - usage),
        limit: limit,
        current: usage
    };
};

// Method to increment usage
subscriptionSchema.methods.incrementUsage = function (usageType) {
    const field = `usage.${usageType}`;
    this.set(field, (this.get(field) || 0) + 1);
    return this.save();
};

// Method to reset monthly usage
subscriptionSchema.methods.resetMonthlyUsage = function () {
    this.usage.ordersThisMonth = 0;
    return this.save();
};

// Method to upgrade plan
subscriptionSchema.methods.upgradePlan = function (newPlan) {
    this.plan = newPlan;
    this.setPlanDetails();

    // Handle free_trial specially
    if (newPlan === 'free_trial') {
        this.isTrialActive = true;
        this.trialStartDate = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 5); // 5 days trial
        this.trialEndDate = trialEnd;
        this.currentPeriodStart = new Date();
        this.currentPeriodEnd = trialEnd;
    } else {
        // For paid plans, ensure subscription is active
        this.status = 'active';
        this.isTrialActive = false;
        this.currentPeriodStart = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        this.currentPeriodEnd = endDate;
        this.nextBillingDate = endDate;
    }

    return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancelSubscription = function (reason) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancelReason = reason;
    this.autoRenew = false;
    return this.save();
};

// Method to add payment
subscriptionSchema.methods.addPayment = function (paymentData) {
    this.paymentHistory.push(paymentData);
    if (paymentData.status === 'success') {
        this.lastPaymentDate = paymentData.paidAt;
        this.status = 'active';

        // Extend subscription period
        const endDate = new Date(this.currentPeriodEnd);
        endDate.setMonth(endDate.getMonth() + 1);
        this.currentPeriodEnd = endDate;
        this.nextBillingDate = endDate;
    }
    return this.save();
};

// Method to add notification
subscriptionSchema.methods.addNotification = function (type, message) {
    this.notifications.push({ type, message });
    return this.save();
};

// Static method to check expired subscriptions
subscriptionSchema.statics.checkExpiredSubscriptions = async function () {
    const now = new Date();
    const expired = await this.find({
        status: 'active',
        currentPeriodEnd: { $lt: now }
    });

    for (const sub of expired) {
        sub.status = 'expired';
        await sub.save();
        await sub.addNotification('subscription_cancelled', 'Your subscription has expired');
    }

    return expired;
};

// Static method to check trial ending soon
subscriptionSchema.statics.checkTrialsEndingSoon = async function (daysThreshold = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    return this.find({
        isTrialActive: true,
        trialEndDate: { $lte: futureDate, $gt: new Date() }
    });
};

// Ensure virtuals are included in JSON
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
