const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const users = await prisma.user.findMany();
        console.log(`Total users: ${users.length}`);
        for (const u of users) {
            console.log(`  - ${u.username} (${u.email}) - Role: ${u.role}`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
})();
