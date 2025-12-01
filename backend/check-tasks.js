const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTasks() {
  try {
    console.log('Checking all DataUploadTask records...\n');

    const tasks = await prisma.dataUploadTask.findMany({
      select: {
        id: true,
        fileName: true,
        status: true,
        assignedTo: true,
        createdAt: true
      }
    });

    console.log(`Total tasks: ${tasks.length}\n`);

    if (tasks.length > 0) {
      console.log('Tasks breakdown:');
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. File: ${task.fileName}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Assigned To: ${task.assignedTo || 'Not assigned'}`);
        console.log(`   Created: ${task.createdAt}`);
        console.log('');
      });

      // Count by status
      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      console.log('Status counts:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    } else {
      console.log('No tasks found in database.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks();
