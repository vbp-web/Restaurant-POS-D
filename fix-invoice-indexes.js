// Script to drop the incorrect global unique index on invoiceNumber
require('dotenv').config();
const mongoose = require('mongoose');

async function fixInvoiceIndexes() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('invoices');

        console.log('🔍 Checking existing indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Find the index that is just { invoiceNumber: 1 } and is unique
        const globalUniqueIndex = indexes.find(idx =>
            idx.key.invoiceNumber === 1 &&
            Object.keys(idx.key).length === 1 &&
            idx.unique === true
        );

        if (globalUniqueIndex) {
            console.log(`🗑️  Dropping global unique index: ${globalUniqueIndex.name}...`);
            await collection.dropIndex(globalUniqueIndex.name);
            console.log('✅ Global unique index dropped successfully!');
        } else {
            console.log('ℹ️  Global unique index not found or already dropped.');
        }

        console.log('✨ Now the database will allow multiple restaurants to have the same invoice numbers!');

        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
        process.exit(1);
    }
}

fixInvoiceIndexes();
