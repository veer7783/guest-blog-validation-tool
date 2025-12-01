/**
 * Reset 2FA for a user when locked out
 * 
 * Usage:
 *   node reset-2fa.js <email>
 * 
 * Example:
 *   node reset-2fa.js superadmin@guestblog.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset2FA() {
  try {
    // Get email from command line argument
    const email = process.argv[2];

    if (!email) {
      console.log('\n❌ Error: Email is required\n');
      console.log('Usage: node reset-2fa.js <email>');
      console.log('Example: node reset-2fa.js superadmin@guestblog.com\n');
      process.exit(1);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { twoFactorAuth: true }
    });

    if (!user) {
      console.log(`\n❌ User not found: ${email}\n`);
      process.exit(1);
    }

    if (!user.twoFactorAuth) {
      console.log(`\n✅ User ${email} does not have 2FA enabled\n`);
      process.exit(0);
    }

    // Delete 2FA
    await prisma.twoFactorAuth.delete({
      where: { userId: user.id }
    });

    console.log('\n✅ 2FA Reset Successful!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log(`User: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('1. Login with email and password (no 2FA required)');
    console.log('2. Go to Users module');
    console.log('3. Click "Setup 2FA" to enable it again');
    console.log('4. Scan the new QR code in your authenticator app\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

reset2FA();
