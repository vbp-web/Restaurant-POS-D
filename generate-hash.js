const bcrypt = require('bcryptjs');

async function generateHashes() {
    const adminHash = await bcrypt.hash('Admin@123456', 12);
    const demoHash = await bcrypt.hash('Demo@123456', 12);

    console.log('\n=== Password Hashes ===\n');
    console.log('Admin@123456:', adminHash);
    console.log('Demo@123456:', demoHash);
    console.log('\n');
}

generateHashes();
