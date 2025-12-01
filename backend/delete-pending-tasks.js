const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deletePendingTasks() {
  try {
    console.log('Deleting pending tasks...\n');

    // First, delete related data in DataInProcess for these tasks
    const pendingTasks = await prisma.dataUploadTask.findMany({
      where: { status: 'PENDING' },
      select: { id: true, fileName: true }
    });

    console.log(`Found ${pendingTasks.length} pending tasks:`);
    pendingTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.fileName}`);
    });
    console.log('');

    // Delete related DataInProcess records
    const deletedDataInProcess = await prisma.dataInProcess.deleteMany({
      where: {
        uploadTaskId: {
          in: pendingTasks.map(t => t.id)
        }
      }
    });
    console.log(`✅ Deleted ${deletedDataInProcess.count} DataInProcess records`);

    // Delete the pending tasks
    const deletedTasks = await prisma.dataUploadTask.deleteMany({
      where: { status: 'PENDING' }
    });
    console.log(`✅ Deleted ${deletedTasks.count} pending DataUploadTask records`);

    console.log('\n🎉 All pending tasks have been deleted!');
    console.log('Dashboard will now show:');
    console.log('  - Pending Tasks: 0');

  } catch (error) {
    console.error('❌ Error deleting tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePendingTasks();
