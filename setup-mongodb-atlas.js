const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔧 MongoDB Atlas Setup for Restaurant POS\n');
console.log('This script will help you configure your MongoDB Atlas connection.\n');

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    try {
        console.log('📝 Please provide your MongoDB Atlas connection details:\n');

        const mongoUri = await question('Enter your MongoDB Atlas connection string: ');

        if (!mongoUri || !mongoUri.includes('mongodb')) {
            console.log('\n❌ Invalid MongoDB connection string. Please try again.\n');
            rl.close();
            return;
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
        console.error('\n❌ Error during setup:', error.message);
    } finally {
        rl.close();
    }
}

setup();
