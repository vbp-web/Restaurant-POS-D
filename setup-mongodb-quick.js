const fs = require('fs');
const path = require('path');

/**
 * Quick MongoDB Atlas Setup Script
 * 
 * Usage: node setup-mongodb-quick.js "your-mongodb-atlas-connection-string"
 * 
 * Example:
 * node setup-mongodb-quick.js "mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/restaurant-pos?retryWrites=true&w=majority"
 */

const mongoUri = process.argv[2];

if (!mongoUri) {
    console.log('\n❌ Error: MongoDB connection string is required!\n');
    console.log('Usage: node setup-mongodb-quick.js "your-mongodb-atlas-connection-string"\n');
    console.log('Example:');
    console.log('node setup-mongodb-quick.js "mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/restaurant-pos?retryWrites=true&w=majority"\n');
    process.exit(1);
}

if (!mongoUri.includes('mongodb')) {
    console.log('\n❌ Invalid MongoDB connection string. It should start with "mongodb://" or "mongodb+srv://"\n');
    process.exit(1);
}

const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# MongoDB Atlas Connection String
MONGODB_URI=${mongoUri}

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024

# Root Admin Credentials (First-time setup)
ROOT_ADMIN_EMAIL=admin@restaurantpos.com
ROOT_ADMIN_PASSWORD=Admin@123456

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
`;

try {
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\n✅ Successfully created .env file with MongoDB Atlas configuration!');
    console.log('\n📋 Configuration Summary:');
    console.log('   - MongoDB URI: Configured ✓');
    console.log('   - Port: 5000');
    console.log('   - Environment: development');
    console.log('   - Root Admin Email: admin@restaurantpos.com');
    console.log('   - Root Admin Password: Admin@123456');
    console.log('\n🚀 You can now start your backend server with: npm start\n');

} catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
    process.exit(1);
}
