const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Tạo admin user
    const adminEmail = 'admin@benhvienabc.com';

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Tạo admin user
        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                email: adminEmail,
                password: hashedPassword,
                full_name: 'Administrator',
                phone: null,
                role: 'ADMIN'
            }
        });

        console.log('✓ Admin user created successfully');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Password: admin123`);
        console.log(`  Role: ${admin.role}`);
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('✓ Admin user already exists');
        } else {
            throw error;
        }
    }
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
