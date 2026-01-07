const fs = require('fs');
const path = require('path');

console.log('\n🔧 Fixing MongoDB URI - Encoding Special Characters\n');

// The password contains @ which needs to be URL encoded
// @ should be encoded as %40

const username = 'oneverce1011_db_user';
const password = 'Vansh@111';
const cluster = 'cluster0.xvammvi.mongodb.net';
const database = 'restaurant-pos';

// URL encode the password
const encodedPassword = encodeURIComponent(password);

console.log('Original password:', password);
console.log('Encoded password:', encodedPassword);
console.log('');

// Build the correct URI
const correctUri = `mongodb+srv://${username}:${encodedPassword}@${cluster}/${database}?retryWrites=true&w=majority&appName=Cluster0`;

console.log('✅ Corrected MongoDB URI:');
console.log(correctUri);
console.log('');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Find and replace the MONGODB_URI line
const lines = envContent.split('\n');
const updatedLines = lines.map(line => {
    if (line.startsWith('MONGODB_URI=')) {
        return `MONGODB_URI=${correctUri}`;
    }
    return line;
});

// Write back to .env file
fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');

console.log('✅ Updated .env file with properly encoded MongoDB URI');
console.log('\n🚀 You can now start the server with: npm start\n');
