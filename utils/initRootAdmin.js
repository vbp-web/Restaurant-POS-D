const RootAdmin = require('../models/RootAdmin');

const initRootAdmin = async () => {
    try {
        const existingAdmin = await RootAdmin.findOne({ role: 'root' });

        if (!existingAdmin) {
            const rootAdmin = await RootAdmin.create({
                email: process.env.ROOT_ADMIN_EMAIL || 'admin@restaurantpos.com',
                password: process.env.ROOT_ADMIN_PASSWORD || 'Admin@123456'
            });

            console.log('✅ Root admin created successfully');
            console.log(`   Email: ${rootAdmin.email}`);
            console.log(`   Password: ${process.env.ROOT_ADMIN_PASSWORD || 'Admin@123456'}`);
        }
    } catch (error) {
        console.error('❌ Error creating root admin:', error.message);
    }
};

module.exports = initRootAdmin;
