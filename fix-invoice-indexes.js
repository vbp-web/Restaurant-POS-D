// Nuclear Fix - Wipes all indexes to clear hidden rules
require('dotenv').config();
const mongoose = require('mongoose');

async function nuclearFix() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        console.log('✅ Connected to Database:', mongoose.connection.name);

        const colName = 'invoices';
        const collection = db.collection(colName);

        console.log(`\n🧹 Wiping all indexes from "${colName}"...`);

        // This drops everything except the default _id index
        try {
            await collection.dropIndexes();
            console.log('✅ ALL INDEXES DROPPED!');
        } catch (e) {
            console.log('❌ Error dropping indexes:', e.message);
        }

        console.log('\n✨ Database is now clean.');
        console.log('🚀 IMPORTANT: Now go to Render and RESTART the server.');
        console.log('Mongoose will automatically create the correct NEW rules.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Critical Error:', error);
        process.exit(1);
    }
}

nuclearFix();
