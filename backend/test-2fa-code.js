const { PrismaClient } = require('@prisma/client');
const speakeasy = require('speakeasy');
const prisma = new PrismaClient();

async function test2FA() {
  try {
    const user = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      include: { twoFactorAuth: true }
    });

    if (!user || !user.twoFactorAuth) {
      console.log('No 2FA setup found');
      return;
    }

    console.log('\n=== 2FA Test ===\n');
    console.log(`User: ${user.email}`);
    console.log(`Secret: ${user.twoFactorAuth.secret.substring(0, 10)}...`);
    console.log(`\nCurrent valid codes (30-second window):`);
    
    // Generate current valid code
    const currentCode = speakeasy.totp({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32'
    });
    
    console.log(`Current code: ${currentCode}`);
    
    // Test with window
    console.log('\nTesting verification with window=2:');
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: currentCode,
      window: 2
    });
    
    console.log(`Verification result: ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);
    
    // Show QR code URL for re-scanning
    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.twoFactorAuth.secret,
      label: `Guest Blog (${user.email})`,
      issuer: 'Guest Blog Validation',
      encoding: 'base32'
    });
    
    console.log('\n=== Re-scan this in your authenticator app ===');
    console.log('Secret (manual entry):', user.twoFactorAuth.secret);
    console.log('\nOr scan QR code at:');
    console.log('https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' + encodeURIComponent(otpauthUrl));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test2FA();
