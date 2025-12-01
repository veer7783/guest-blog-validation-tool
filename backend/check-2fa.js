const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check2FA() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      include: { twoFactorAuth: true }
    });

    console.log('\n=== Super Admin 2FA Status ===\n');
    
    for (const user of users) {
      console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`Has 2FA: ${user.twoFactorAuth ? 'Yes' : 'No'}`);
      
      if (user.twoFactorAuth) {
        console.log(`2FA Enabled: ${user.twoFactorAuth.isEnabled}`);
        console.log(`Secret exists: ${user.twoFactorAuth.secret ? 'Yes' : 'No'}`);
        console.log(`Backup codes: ${user.twoFactorAuth.backupCodes?.length || 0}`);
      }
      console.log('---');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check2FA();
