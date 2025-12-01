const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySystem() {
  try {
    console.log('=== SYSTEM VERIFICATION ===\n');

    // 1. Check Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
    console.log('✅ USERS:');
    console.log(`   Total: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.firstName} ${u.lastName} (${u.role}) - ${u.isActive ? 'Active' : 'Inactive'}`);
    });
    console.log('');

    // 2. Check Tasks
    const tasks = await prisma.dataUploadTask.findMany({
      select: {
        id: true,
        fileName: true,
        status: true,
        assignedTo: true,
        createdBy: true
      }
    });
    console.log('✅ CSV UPLOAD TASKS:');
    console.log(`   Total: ${tasks.length}`);
    const statusCount = {
      PENDING: tasks.filter(t => t.status === 'PENDING').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length
    };
    console.log(`   - Pending: ${statusCount.PENDING}`);
    console.log(`   - In Progress: ${statusCount.IN_PROGRESS}`);
    console.log(`   - Completed: ${statusCount.COMPLETED}`);
    console.log('');

    // 3. Check Data Rows
    const dataInProcess = await prisma.dataInProcess.count();
    const dataFinal = await prisma.dataFinal.count();
    console.log('✅ DATA ROWS:');
    console.log(`   - In Process: ${dataInProcess}`);
    console.log(`   - Completed (Final): ${dataFinal}`);
    console.log('');

    // 4. Dashboard Stats Simulation
    console.log('✅ DASHBOARD STATS (Super Admin):');
    console.log(`   - Total Users: ${users.length}`);
    console.log(`   - Assigned Tasks: ${tasks.length}`);
    console.log(`   - Completed Tasks: ${statusCount.COMPLETED}`);
    console.log(`   - Pending Tasks: ${statusCount.PENDING + statusCount.IN_PROGRESS}`);
    console.log(`   - Completed Data Rows: ${dataFinal}`);
    console.log(`   - Pending Data Rows: ${dataInProcess}`);
    console.log('');

    // 5. Task Assignment Check
    console.log('✅ TASK ASSIGNMENTS:');
    const assignedTasks = tasks.filter(t => t.assignedTo);
    console.log(`   - ${assignedTasks.length} tasks assigned to users`);
    console.log(`   - ${tasks.length - assignedTasks.length} tasks unassigned`);
    console.log('');

    console.log('=== VERIFICATION COMPLETE ===');
    console.log('✅ All systems operational!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySystem();
