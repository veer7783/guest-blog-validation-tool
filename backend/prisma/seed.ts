import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@guestblog.com' },
    update: {},
    create: {
      email: 'superadmin@guestblog.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create sample Admin users
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@guestblog.com' },
    update: {},
    create: {
      email: 'admin1@guestblog.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin 1 created:', admin1.email);

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@guestblog.com' },
    update: {},
    create: {
      email: 'admin2@guestblog.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin 2 created:', admin2.email);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: superadmin@guestblog.com');
  console.log('  Password: Admin@123');
  console.log('\nAdmin 1:');
  console.log('  Email: admin1@guestblog.com');
  console.log('  Password: Admin@123');
  console.log('\nAdmin 2:');
  console.log('  Email: admin2@guestblog.com');
  console.log('  Password: Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
