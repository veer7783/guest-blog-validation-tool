/**
 * 2FA Manager - Interactive tool for managing 2FA
 * 
 * Usage: node 2fa-manager.js
 */

const { PrismaClient } = require('@prisma/client');
const speakeasy = require('speakeasy');
const readline = require('readline');
const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function showMenu() {
  console.clear();
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║              🔐 2FA Manager Tool 🔐                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log('1. Check 2FA Status (All Users)');
  console.log('2. Get Current Valid Code');
  console.log('3. Reset 2FA for User');
  console.log('4. Show QR Code for Re-scanning');
  console.log('5. Exit\n');
  
  const choice = await question('Select option (1-5): ');
  return choice.trim();
}

async function checkStatus() {
  console.log('\n═══ 2FA Status ═══\n');
  
  const users = await prisma.user.findMany({
    include: { twoFactorAuth: true },
    orderBy: { role: 'desc' }
  });

  for (const user of users) {
    console.log(`📧 ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   2FA: ${user.twoFactorAuth?.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log('');
  }
  
  await question('\nPress Enter to continue...');
}

async function getCurrentCode() {
  const email = await question('\nEnter user email: ');
  
  const user = await prisma.user.findUnique({
    where: { email: email.trim() },
    include: { twoFactorAuth: true }
  });

  if (!user || !user.twoFactorAuth) {
    console.log('\n❌ User not found or 2FA not enabled\n');
    await question('Press Enter to continue...');
    return;
  }

  const code = speakeasy.totp({
    secret: user.twoFactorAuth.secret,
    encoding: 'base32'
  });

  console.log('\n═══ Current Valid Code ═══\n');
  console.log(`User: ${user.email}`);
  console.log(`Code: ${code}`);
  console.log('\n⏰ This code expires in 30 seconds!\n');
  
  await question('Press Enter to continue...');
}

async function resetUser2FA() {
  const email = await question('\nEnter user email to reset 2FA: ');
  
  const user = await prisma.user.findUnique({
    where: { email: email.trim() },
    include: { twoFactorAuth: true }
  });

  if (!user) {
    console.log('\n❌ User not found\n');
    await question('Press Enter to continue...');
    return;
  }

  if (!user.twoFactorAuth) {
    console.log('\n✅ User does not have 2FA enabled\n');
    await question('Press Enter to continue...');
    return;
  }

  const confirm = await question(`\n⚠️  Reset 2FA for ${user.email}? (yes/no): `);
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Cancelled\n');
    await question('Press Enter to continue...');
    return;
  }

  await prisma.twoFactorAuth.delete({
    where: { userId: user.id }
  });

  console.log('\n✅ 2FA Reset Successfully!\n');
  console.log(`User ${user.email} can now login without 2FA`);
  console.log('They can setup 2FA again from the Users module\n');
  
  await question('Press Enter to continue...');
}

async function showQRCode() {
  const email = await question('\nEnter user email: ');
  
  const user = await prisma.user.findUnique({
    where: { email: email.trim() },
    include: { twoFactorAuth: true }
  });

  if (!user || !user.twoFactorAuth) {
    console.log('\n❌ User not found or 2FA not enabled\n');
    await question('Press Enter to continue...');
    return;
  }

  const otpauthUrl = speakeasy.otpauthURL({
    secret: user.twoFactorAuth.secret,
    label: `Guest Blog (${user.email})`,
    issuer: 'Guest Blog Validation',
    encoding: 'base32'
  });

  console.log('\n═══ QR Code & Secret ═══\n');
  console.log(`User: ${user.email}\n`);
  console.log('Secret (for manual entry):');
  console.log(user.twoFactorAuth.secret);
  console.log('\nQR Code URL (open in browser):');
  console.log('https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' + encodeURIComponent(otpauthUrl));
  console.log('\n');
  
  await question('Press Enter to continue...');
}

async function main() {
  try {
    while (true) {
      const choice = await showMenu();
      
      switch (choice) {
        case '1':
          await checkStatus();
          break;
        case '2':
          await getCurrentCode();
          break;
        case '3':
          await resetUser2FA();
          break;
        case '4':
          await showQRCode();
          break;
        case '5':
          console.log('\n👋 Goodbye!\n');
          rl.close();
          await prisma.$disconnect();
          process.exit(0);
        default:
          console.log('\n❌ Invalid option\n');
          await question('Press Enter to continue...');
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    await prisma.$disconnect();
  }
}

main();
