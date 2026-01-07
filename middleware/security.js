const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

/**
 * Security Middleware Configuration for Production
 * 
 * This module provides comprehensive security middleware
 * to protect against common vulnerabilities.
 */

/**
 * Helmet - Sets various HTTP headers for security
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.FRONTEND_URL],
            frameSrc: ["https://api.razorpay.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});

/**
 * Rate Limiting - Prevents brute force attacks
 */
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter rate limiting for authentication endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true,
});

/**
 * Rate limiting for payment endpoints
 */
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 payment requests per hour
    message: 'Too many payment requests, please try again later.',
});

/**
 * MongoDB Sanitization - Prevents NoSQL injection
 */
const mongoSanitizeConfig = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized request from ${req.ip}: ${key}`);
    },
});

/**
 * XSS Protection - Prevents cross-site scripting attacks
 */
const xssConfig = xss();

/**
 * CORS Configuration
 */
const getCorsConfig = () => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3000'];

    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn(`Blocked CORS request from origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };
};

/**
 * Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
};

/**
 * Request Logging Middleware (for security auditing)
 */
const securityLogger = (req, res, next) => {
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
    };

    // Log authentication attempts
    if (req.path.includes('/login') || req.path.includes('/register')) {
        console.log('Auth attempt:', logData);
    }

    // Log payment attempts
    if (req.path.includes('/payment')) {
        console.log('Payment attempt:', logData);
    }

    next();
};

/**
 * Input Validation Middleware
 */
const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type must be application/json',
            });
        }
    }

    next();
};

/**
 * Apply all security middleware to Express app
 */
const applySecurityMiddleware = (app) => {
    // Basic security headers
    app.use(helmetConfig);
    app.use(securityHeaders);

    // Data sanitization
    app.use(mongoSanitizeConfig);
    app.use(xssConfig);

    // Content type validation
    app.use(validateContentType);

    // Security logging
    if (process.env.NODE_ENV === 'production') {
        app.use(securityLogger);
    }

    // General rate limiting
    app.use('/api/', generalLimiter);

    console.log('✅ Security middleware applied');
};

module.exports = {
    applySecurityMiddleware,
    authLimiter,
    paymentLimiter,
    getCorsConfig,
    helmetConfig,
    generalLimiter,
    mongoSanitizeConfig,
    xssConfig,
};
