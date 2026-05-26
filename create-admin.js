/**
 * Create Admin User - Database Seed
 */

const prisma = require('./src/prismaClient');
const { hashPassword } = require('./src/utils/auth');

async function createAdmin() {
    try {
        console.log('Creating admin user...');

        // Check if admin exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (existingAdmin) {
            console.log(`✅ Admin user already exists: ${existingAdmin.email}`);
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await hashPassword('admin123');

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                email: 'admin@benhvienabc.com',
                password: hashedPassword,
                full_name: 'Administrator',
                phone: '0123456789',
                role: 'ADMIN',
            },
        });

        console.log(`✅ Admin user created successfully!`);
        console.log(`📧 Email: ${admin.email}`);
        console.log(`🔑 Password: admin123`);
        console.log(`👤 ID: ${admin.id}`);

        // Create clinic info
        const clinic = await prisma.clinicInfo.findFirst();
        if (!clinic) {
            await prisma.clinicInfo.create({
                data: {
                    name: 'Pet Hospital ABC',
                    email: 'info@pethosp.com',
                    phone: '0123456789',
                    address: '123 Main Street',
                    city: 'Ho Chi Minh City',
                    country: 'Vietnam',
                    opening_hour: '08:00',
                    closing_hour: '18:00',
                },
            });
            console.log(`✅ Clinic info created`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
