require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const rootRoutes = require('./routes/rootRoutes');
const businessRoutes = require('./routes/businessRoutes');
const publicRoutes = require('./routes/publicRoutes');
const tableRoutes = require('./routes/tableRoutes');
const staffRoutes = require('./routes/staffRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentProofRoutes = require('./routes/paymentProofRoutes');

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to database
connectDB();

// Initialize root admin on first run
const initRootAdmin = require('./utils/initRootAdmin');
initRootAdmin();

// Routes
app.use('/api/root', rootRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payment-proofs', paymentProofRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}`);
    console.log(`\n📋 Available Routes:`);
    console.log(`   Root Admin:  /api/root`);
    console.log(`   Business:    /api/business`);
    console.log(`   Public:      /api/public`);
    console.log(`\n✅ Server ready for connections\n`);
});
