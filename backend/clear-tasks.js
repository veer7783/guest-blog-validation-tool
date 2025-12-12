const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTasks() {
  try {
    console.log('=== CLEARING ALL TASKS ===\n');

    // Get counts before deletion
    const completedTasks = await prisma.dataUploadTask.count({
      where: { status: 'COMPLETED' }
    });
    const pendingTasks = await prisma.dataUploadTask.count({
      where: { status: 'PENDING' }
    });
    const inProgressTasks = await prisma.dataUploadTask.count({
      where: { status: 'IN_PROGRESS' }
    });

    console.log('Current task counts:');
    console.log(`  - Completed Tasks: ${completedTasks}`);
    console.log(`  - Pending Tasks: ${pendingTasks}`);
    console.log(`  - In Progress Tasks: ${inProgressTasks}`);
    console.log('');

    // Delete all DataInProcess records first (foreign key constraint)
    const deletedDataInProcess = await prisma.dataInProcess.deleteMany({});
    console.log(`✅ Deleted ${deletedDataInProcess.count} DataInProcess records`);

    // Delete all upload tasks
    const deletedTasks = await prisma.dataUploadTask.deleteMany({});
    console.log(`✅ Deleted ${deletedTasks.count} DataUploadTask records`);

    console.log('\n🎉 All tasks have been cleared!');
    console.log('Dashboard will now show:');
    console.log('  - Completed Tasks: 0');
    console.log('  - Pending Tasks: 0');
    console.log('  - In Progress Tasks: 0');

  } catch (error) {
    console.error('❌ Error clearing tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTasks();
