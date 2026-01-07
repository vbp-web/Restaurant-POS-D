const fs = require('fs');
const path = require('path');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Current MongoDB URI
const currentUri = 'mongodb+srv://oneverce1011_db_user:Vansh@111@cluster0.xvammvi.mongodb.net/?appName=Cluster0';

// Updated MongoDB URI with database name
const updatedUri = 'mongodb+srv://oneverce1011_db_user:Vansh@111@cluster0.xvammvi.mongodb.net/restaurant-pos?retryWrites=true&w=majority&appName=Cluster0';

// Replace the URI in the .env content
envContent = envContent.replace(currentUri, updatedUri);

// Write back to .env file
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ Updated MongoDB URI with database name "restaurant-pos"');
console.log('\n📋 New URI:');
console.log(updatedUri);
console.log('\n🚀 You can now start the server with: npm start\n');
