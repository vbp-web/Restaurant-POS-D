const SystemSettings = require('../models/SystemSettings');

// Get all system settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

// Update general platform settings
exports.updatePlatformSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { platformName, platformDescription, defaultTimezone, defaultCurrency, defaultLanguage, supportEmail, supportPhone, termsOfServiceUrl, privacyPolicyUrl } = req.body;

        if (platformName) settings.platformName = platformName;
        if (platformDescription) settings.platformDescription = platformDescription;
        if (defaultTimezone) settings.defaultTimezone = defaultTimezone;
        if (defaultCurrency) settings.defaultCurrency = defaultCurrency;
        if (defaultLanguage) settings.defaultLanguage = defaultLanguage;
        if (supportEmail) settings.supportEmail = supportEmail;
        if (supportPhone) settings.supportPhone = supportPhone;
        if (termsOfServiceUrl) settings.termsOfServiceUrl = termsOfServiceUrl;
        if (privacyPolicyUrl) settings.privacyPolicyUrl = privacyPolicyUrl;

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Platform settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating platform settings:', error);
        res.status(500).json({ message: 'Error updating platform settings', error: error.message });
    }
};

// Get all feature flags
exports.getFeatureFlags = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings.featureFlags);
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({ message: 'Error fetching feature flags', error: error.message });
    }
};

// Create or update a feature flag
exports.updateFeatureFlag = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { name, enabled, description, rolloutPercentage, targetUsers, targetRestaurants, environment } = req.body;

        const existingFlagIndex = settings.featureFlags.findIndex(f => f.name === name);

        const flagData = {
            name,
            enabled: enabled !== undefined ? enabled : false,
            description,
            rolloutPercentage: rolloutPercentage || 100,
            targetUsers: targetUsers || [],
            targetRestaurants: targetRestaurants || [],
            environment: environment || 'all'
        };

        if (existingFlagIndex > -1) {
            settings.featureFlags[existingFlagIndex] = flagData;
        } else {
            settings.featureFlags.push(flagData);
        }

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Feature flag updated successfully', featureFlag: flagData });
    } catch (error) {
        console.error('Error updating feature flag:', error);
        res.status(500).json({ message: 'Error updating feature flag', error: error.message });
    }
};

// Delete a feature flag
exports.deleteFeatureFlag = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { name } = req.params;

        settings.featureFlags = settings.featureFlags.filter(f => f.name !== name);
        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Feature flag deleted successfully' });
    } catch (error) {
        console.error('Error deleting feature flag:', error);
        res.status(500).json({ message: 'Error deleting feature flag', error: error.message });
    }
};

// Get all pricing plans
exports.getPricingPlans = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings.pricingPlans);
    } catch (error) {
        console.error('Error fetching pricing plans:', error);
        res.status(500).json({ message: 'Error fetching pricing plans', error: error.message });
    }
};

// Create a new pricing plan
exports.createPricingPlan = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const planData = req.body;

        settings.pricingPlans.push(planData);
        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Pricing plan created successfully', plan: planData });
    } catch (error) {
        console.error('Error creating pricing plan:', error);
        res.status(500).json({ message: 'Error creating pricing plan', error: error.message });
    }
};

// Update a pricing plan
exports.updatePricingPlan = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { planId } = req.params;
        const planData = req.body;

        const planIndex = settings.pricingPlans.findIndex(p => p._id.toString() === planId);
        if (planIndex === -1) {
            return res.status(404).json({ message: 'Pricing plan not found' });
        }

        settings.pricingPlans[planIndex] = { ...settings.pricingPlans[planIndex].toObject(), ...planData };
        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Pricing plan updated successfully', plan: settings.pricingPlans[planIndex] });
    } catch (error) {
        console.error('Error updating pricing plan:', error);
        res.status(500).json({ message: 'Error updating pricing plan', error: error.message });
    }
};

// Delete a pricing plan
exports.deletePricingPlan = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { planId } = req.params;

        settings.pricingPlans = settings.pricingPlans.filter(p => p._id.toString() !== planId);
        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Pricing plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting pricing plan:', error);
        res.status(500).json({ message: 'Error deleting pricing plan', error: error.message });
    }
};

// Get payment gateway settings
exports.getPaymentGateways = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        // Don't send sensitive keys to frontend
        const sanitized = {
            stripe: {
                enabled: settings.paymentGateways.stripe.enabled,
                testMode: settings.paymentGateways.stripe.testMode,
                hasKeys: !!(settings.paymentGateways.stripe.publicKey && settings.paymentGateways.stripe.secretKey)
            },
            razorpay: {
                enabled: settings.paymentGateways.razorpay.enabled,
                testMode: settings.paymentGateways.razorpay.testMode,
                hasKeys: !!(settings.paymentGateways.razorpay.keyId && settings.paymentGateways.razorpay.keySecret)
            },
            paypal: {
                enabled: settings.paymentGateways.paypal.enabled,
                testMode: settings.paymentGateways.paypal.testMode,
                hasKeys: !!(settings.paymentGateways.paypal.clientId && settings.paymentGateways.paypal.clientSecret)
            }
        };
        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching payment gateways:', error);
        res.status(500).json({ message: 'Error fetching payment gateways', error: error.message });
    }
};

// Update payment gateway settings
exports.updatePaymentGateways = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { stripe, razorpay, paypal } = req.body;

        if (stripe) {
            settings.paymentGateways.stripe = { ...settings.paymentGateways.stripe.toObject(), ...stripe };
        }
        if (razorpay) {
            settings.paymentGateways.razorpay = { ...settings.paymentGateways.razorpay.toObject(), ...razorpay };
        }
        if (paypal) {
            settings.paymentGateways.paypal = { ...settings.paymentGateways.paypal.toObject(), ...paypal };
        }

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Payment gateway settings updated successfully' });
    } catch (error) {
        console.error('Error updating payment gateways:', error);
        res.status(500).json({ message: 'Error updating payment gateways', error: error.message });
    }
};

// Get email configuration
exports.getEmailConfig = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        // Sanitize sensitive data
        const sanitized = {
            provider: settings.emailConfig.provider,
            fromEmail: settings.emailConfig.fromEmail,
            fromName: settings.emailConfig.fromName,
            hasConfig: !!(settings.emailConfig.smtp.host || settings.emailConfig.sendgrid.apiKey)
        };
        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching email config:', error);
        res.status(500).json({ message: 'Error fetching email config', error: error.message });
    }
};

// Update email configuration
exports.updateEmailConfig = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { provider, smtp, sendgrid, awsSes, mailgun, fromEmail, fromName } = req.body;

        if (provider) settings.emailConfig.provider = provider;
        if (smtp) settings.emailConfig.smtp = { ...settings.emailConfig.smtp.toObject(), ...smtp };
        if (sendgrid) settings.emailConfig.sendgrid = { ...settings.emailConfig.sendgrid.toObject(), ...sendgrid };
        if (awsSes) settings.emailConfig.awsSes = { ...settings.emailConfig.awsSes.toObject(), ...awsSes };
        if (mailgun) settings.emailConfig.mailgun = { ...settings.emailConfig.mailgun.toObject(), ...mailgun };
        if (fromEmail) settings.emailConfig.fromEmail = fromEmail;
        if (fromName) settings.emailConfig.fromName = fromName;

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Email configuration updated successfully' });
    } catch (error) {
        console.error('Error updating email config:', error);
        res.status(500).json({ message: 'Error updating email config', error: error.message });
    }
};

// Get security settings
exports.getSecuritySettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings.securitySettings);
    } catch (error) {
        console.error('Error fetching security settings:', error);
        res.status(500).json({ message: 'Error fetching security settings', error: error.message });
    }
};

// Update security settings
exports.updateSecuritySettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { passwordPolicy, sessionTimeout, twoFactorAuth, ipWhitelist, ipBlacklist, rateLimiting, corsOrigins } = req.body;

        if (passwordPolicy) settings.securitySettings.passwordPolicy = { ...settings.securitySettings.passwordPolicy.toObject(), ...passwordPolicy };
        if (sessionTimeout) settings.securitySettings.sessionTimeout = sessionTimeout;
        if (twoFactorAuth) settings.securitySettings.twoFactorAuth = { ...settings.securitySettings.twoFactorAuth.toObject(), ...twoFactorAuth };
        if (ipWhitelist) settings.securitySettings.ipWhitelist = ipWhitelist;
        if (ipBlacklist) settings.securitySettings.ipBlacklist = ipBlacklist;
        if (rateLimiting) settings.securitySettings.rateLimiting = { ...settings.securitySettings.rateLimiting.toObject(), ...rateLimiting };
        if (corsOrigins) settings.securitySettings.corsOrigins = corsOrigins;

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Security settings updated successfully', securitySettings: settings.securitySettings });
    } catch (error) {
        console.error('Error updating security settings:', error);
        res.status(500).json({ message: 'Error updating security settings', error: error.message });
    }
};

// Get integrations
exports.getIntegrations = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings.integrations);
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ message: 'Error fetching integrations', error: error.message });
    }
};

// Update integrations
exports.updateIntegrations = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { googleAnalytics, facebookPixel, cloudStorage, monitoring } = req.body;

        if (googleAnalytics) settings.integrations.googleAnalytics = { ...settings.integrations.googleAnalytics.toObject(), ...googleAnalytics };
        if (facebookPixel) settings.integrations.facebookPixel = { ...settings.integrations.facebookPixel.toObject(), ...facebookPixel };
        if (cloudStorage) settings.integrations.cloudStorage = { ...settings.integrations.cloudStorage.toObject(), ...cloudStorage };
        if (monitoring) settings.integrations.monitoring = { ...settings.integrations.monitoring.toObject(), ...monitoring };

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Integrations updated successfully', integrations: settings.integrations });
    } catch (error) {
        console.error('Error updating integrations:', error);
        res.status(500).json({ message: 'Error updating integrations', error: error.message });
    }
};

// Toggle maintenance mode
exports.toggleMaintenanceMode = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { enabled, message, scheduledStart, scheduledEnd, whitelistedIPs } = req.body;

        if (enabled !== undefined) settings.maintenanceMode.enabled = enabled;
        if (message) settings.maintenanceMode.message = message;
        if (scheduledStart) settings.maintenanceMode.scheduledStart = scheduledStart;
        if (scheduledEnd) settings.maintenanceMode.scheduledEnd = scheduledEnd;
        if (whitelistedIPs) settings.maintenanceMode.whitelistedIPs = whitelistedIPs;

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'Maintenance mode updated successfully', maintenanceMode: settings.maintenanceMode });
    } catch (error) {
        console.error('Error updating maintenance mode:', error);
        res.status(500).json({ message: 'Error updating maintenance mode', error: error.message });
    }
};

// Get system limits
exports.getSystemLimits = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json(settings.systemLimits);
    } catch (error) {
        console.error('Error fetching system limits:', error);
        res.status(500).json({ message: 'Error fetching system limits', error: error.message });
    }
};

// Update system limits
exports.updateSystemLimits = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const { maxRestaurants, maxUsersPerRestaurant, maxStoragePerRestaurant, maxApiCallsPerDay } = req.body;

        if (maxRestaurants) settings.systemLimits.maxRestaurants = maxRestaurants;
        if (maxUsersPerRestaurant) settings.systemLimits.maxUsersPerRestaurant = maxUsersPerRestaurant;
        if (maxStoragePerRestaurant) settings.systemLimits.maxStoragePerRestaurant = maxStoragePerRestaurant;
        if (maxApiCallsPerDay) settings.systemLimits.maxApiCallsPerDay = maxApiCallsPerDay;

        settings.lastModifiedBy = req.user.id;
        await settings.save();

        res.json({ message: 'System limits updated successfully', systemLimits: settings.systemLimits });
    } catch (error) {
        console.error('Error updating system limits:', error);
        res.status(500).json({ message: 'Error updating system limits', error: error.message });
    }
};
