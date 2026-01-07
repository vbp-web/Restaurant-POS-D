const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: String,
    rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 },
    targetUsers: [String],
    targetRestaurants: [String],
    environment: { type: String, enum: ['development', 'staging', 'production', 'all'], default: 'all' }
});

const pricingPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    price: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    trialDays: { type: Number, default: 0 },
    features: {
        maxUsers: { type: Number, default: 5 },
        maxTables: { type: Number, default: 10 },
        maxMenuItems: { type: Number, default: 50 },
        maxOrders: { type: Number, default: 1000 },
        analytics: { type: Boolean, default: false },
        kitchenDisplay: { type: Boolean, default: false },
        tableManagement: { type: Boolean, default: false },
        staffManagement: { type: Boolean, default: false },
        invoicing: { type: Boolean, default: false },
        customBranding: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
});

const paymentGatewaySchema = new mongoose.Schema({
    stripe: {
        enabled: { type: Boolean, default: false },
        publicKey: String,
        secretKey: String,
        webhookSecret: String,
        testMode: { type: Boolean, default: true }
    },
    razorpay: {
        enabled: { type: Boolean, default: false },
        keyId: String,
        keySecret: String,
        webhookSecret: String,
        testMode: { type: Boolean, default: true }
    },
    paypal: {
        enabled: { type: Boolean, default: false },
        clientId: String,
        clientSecret: String,
        testMode: { type: Boolean, default: true }
    }
});

const emailConfigSchema = new mongoose.Schema({
    provider: { type: String, enum: ['smtp', 'sendgrid', 'aws-ses', 'mailgun'], default: 'smtp' },
    smtp: {
        host: String,
        port: { type: Number, default: 587 },
        secure: { type: Boolean, default: false },
        username: String,
        password: String
    },
    sendgrid: {
        apiKey: String
    },
    awsSes: {
        accessKeyId: String,
        secretAccessKey: String,
        region: String
    },
    mailgun: {
        apiKey: String,
        domain: String
    },
    fromEmail: String,
    fromName: String
});

const smsConfigSchema = new mongoose.Schema({
    provider: { type: String, enum: ['twilio', 'aws-sns', 'msg91'], default: 'twilio' },
    twilio: {
        accountSid: String,
        authToken: String,
        phoneNumber: String
    },
    awsSns: {
        accessKeyId: String,
        secretAccessKey: String,
        region: String
    },
    msg91: {
        authKey: String,
        senderId: String
    },
    enabled: { type: Boolean, default: false }
});

const securitySettingsSchema = new mongoose.Schema({
    passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireUppercase: { type: Boolean, default: true },
        requireLowercase: { type: Boolean, default: true },
        requireNumbers: { type: Boolean, default: true },
        requireSpecialChars: { type: Boolean, default: true },
        expiryDays: { type: Number, default: 90 }
    },
    sessionTimeout: { type: Number, default: 3600 }, // in seconds
    twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false }
    },
    ipWhitelist: [String],
    ipBlacklist: [String],
    rateLimiting: {
        enabled: { type: Boolean, default: true },
        maxRequests: { type: Number, default: 100 },
        windowMs: { type: Number, default: 900000 } // 15 minutes
    },
    corsOrigins: [String]
});

const integrationSchema = new mongoose.Schema({
    googleAnalytics: {
        enabled: { type: Boolean, default: false },
        trackingId: String
    },
    facebookPixel: {
        enabled: { type: Boolean, default: false },
        pixelId: String
    },
    cloudStorage: {
        provider: { type: String, enum: ['aws-s3', 'cloudinary', 'local'], default: 'local' },
        awsS3: {
            accessKeyId: String,
            secretAccessKey: String,
            bucket: String,
            region: String
        },
        cloudinary: {
            cloudName: String,
            apiKey: String,
            apiSecret: String
        }
    },
    monitoring: {
        sentry: {
            enabled: { type: Boolean, default: false },
            dsn: String
        },
        logRocket: {
            enabled: { type: Boolean, default: false },
            appId: String
        }
    }
});

const systemSettingsSchema = new mongoose.Schema({
    // General Platform Settings
    platformName: { type: String, default: 'Restaurant POS' },
    platformDescription: String,
    defaultTimezone: { type: String, default: 'Asia/Kolkata' },
    defaultCurrency: { type: String, default: 'INR' },
    defaultLanguage: { type: String, default: 'en' },
    supportEmail: String,
    supportPhone: String,
    termsOfServiceUrl: String,
    privacyPolicyUrl: String,

    // Feature Flags
    featureFlags: [featureFlagSchema],

    // Pricing Plans
    pricingPlans: [pricingPlanSchema],

    // Payment Gateways
    paymentGateways: paymentGatewaySchema,

    // Email Configuration
    emailConfig: emailConfigSchema,

    // SMS Configuration
    smsConfig: smsConfigSchema,

    // Security Settings
    securitySettings: securitySettingsSchema,

    // Integrations
    integrations: integrationSchema,

    // System Limits
    systemLimits: {
        maxRestaurants: { type: Number, default: 1000 },
        maxUsersPerRestaurant: { type: Number, default: 50 },
        maxStoragePerRestaurant: { type: Number, default: 5368709120 }, // 5GB in bytes
        maxApiCallsPerDay: { type: Number, default: 10000 }
    },

    // Maintenance Mode
    maintenanceMode: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: 'System is under maintenance. Please check back later.' },
        scheduledStart: Date,
        scheduledEnd: Date,
        whitelistedIPs: [String]
    },

    // Backup Settings
    backupSettings: {
        autoBackup: { type: Boolean, default: true },
        backupFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
        retentionDays: { type: Number, default: 30 },
        cloudBackup: { type: Boolean, default: false }
    },

    // Version Control
    version: { type: Number, default: 1 },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'RootAdmin' },
    lastModifiedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Middleware to increment version on update
systemSettingsSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.version += 1;
        this.lastModifiedAt = new Date();
    }
    next();
});

// Static method to get or create settings
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
