const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAllTasks() {
  try {
    console.log('Starting task reset...');

    // Delete all DataInProcess records first (due to foreign key constraints)
    const deletedDataInProcess = await prisma.dataInProcess.deleteMany({});
    console.log(`✅ Deleted ${deletedDataInProcess.count} DataInProcess records`);

    // Delete all DataFinal records
    const deletedDataFinal = await prisma.dataFinal.deleteMany({});
    console.log(`✅ Deleted ${deletedDataFinal.count} DataFinal records`);

    // Delete all DataUploadTask records
    const deletedTasks = await prisma.dataUploadTask.deleteMany({});
    console.log(`✅ Deleted ${deletedTasks.count} DataUploadTask records`);

    console.log('\n🎉 All tasks have been reset to 0!');
    console.log('Dashboard will now show:');
    console.log('  - Assigned Tasks: 0');
    console.log('  - Completed Tasks: 0');
    console.log('  - Pending Tasks: 0');
    console.log('  - User Remaining Tasks: 0');

  } catch (error) {
    console.error('❌ Error resetting tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllTasks();
