require('dotenv').config();

console.log('\n🔍 MongoDB URI Validation\n');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.log('❌ MONGODB_URI is not set in .env file\n');
    console.log('Please add your MongoDB Atlas connection string to the .env file:\n');
    console.log('MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurant-pos?retryWrites=true&w=majority\n');
    process.exit(1);
}

console.log('📋 Current MONGODB_URI:');
console.log(mongoUri);
console.log('');

// Validation checks
const checks = {
    'Starts with mongodb:// or mongodb+srv://': mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://'),
    'Contains @ symbol': mongoUri.includes('@'),
    'Contains database name': mongoUri.split('/').length >= 4,
    'Not using placeholder values': !mongoUri.includes('username:password') && !mongoUri.includes('xxxxx'),
    'Has proper format': /mongodb(\+srv)?:\/\/.+@.+\..+\/.+/.test(mongoUri)
};

console.log('✅ Validation Results:\n');
let allPassed = true;
for (const [check, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
}

console.log('');

if (allPassed) {
    console.log('🎉 MongoDB URI looks valid!\n');
    console.log('You can now start the server with: npm start\n');
} else {
    console.log('❌ MongoDB URI has issues. Please fix them.\n');
    console.log('📝 Correct format:\n');
    console.log('mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/restaurant-pos?retryWrites=true&w=majority\n');
    console.log('Make sure to:');
    console.log('1. Replace YOUR_USERNAME with your MongoDB Atlas username');
    console.log('2. Replace YOUR_PASSWORD with your MongoDB Atlas password');
    console.log('3. Replace cluster0.xxxxx.mongodb.net with your actual cluster URL');
    console.log('4. Keep "restaurant-pos" as the database name (or change if needed)\n');
}
