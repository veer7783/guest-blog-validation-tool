const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset2FA() {
  try {
    const user = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!user) {
      console.log('No super admin found');
      return;
    }

    // Delete 2FA
    await prisma.twoFactorAuth.deleteMany({
      where: { userId: user.id }
    });

    console.log('\n✅ 2FA has been reset for:', user.email);
    console.log('You can now login without 2FA and set it up again from the Users module.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reset2FA();
