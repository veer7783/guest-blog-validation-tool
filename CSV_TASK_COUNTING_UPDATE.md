# ✅ Task Counting Based on CSV Upload Tasks

**Date:** November 19, 2025, 11:33 AM IST  
**Status:** ✅ **COMPLETED**

---

## 🎯 Important Change

### Task Definition Updated:
- **1 CSV Upload = 1 Task** ✅
- Individual data rows inside CSV are **NOT** counted as separate tasks
- Task counts now reflect the number of CSV files uploaded, not the data rows

---

## 📊 What Changed

### Before (Incorrect):
```
Dashboard showed:
- Assigned Tasks: 150  ← Counting individual data rows
- Pending Tasks: 75    ← Counting individual data rows
- Completed Tasks: 75  ← Counting individual data rows

Users Module showed:
- User A: 50 tasks remaining  ← Counting data rows
- User B: 25 tasks remaining  ← Counting data rows
```

### After (Correct):
```
Dashboard shows:
- Assigned Tasks: 5    ← Counting CSV upload tasks
- Pending Tasks: 2     ← Counting CSV upload tasks
- Completed Tasks: 3   ← Counting CSV upload tasks

Users Module shows:
- User A: 2 tasks remaining  ← Counting CSV upload tasks
- User B: 0 tasks remaining  ← Counting CSV upload tasks
```

---

## 🔧 Implementation Details

### 1. **Dashboard Service** (`dashboard.service.ts`)

#### Super Admin View:
```typescript
// Total CSV upload tasks
assignedTasks = await prisma.dataUploadTask.count();

// CSV tasks marked as completed
completedTasks = await prisma.dataUploadTask.count({
  where: { status: 'COMPLETED' }
});

// CSV tasks still pending
pendingTasks = await prisma.dataUploadTask.count({
  where: { 
    status: { in: ['PENDING', 'IN_PROGRESS'] }
  }
});
```

#### Admin View:
```typescript
// CSV tasks assigned to this admin
assignedTasks = await prisma.dataUploadTask.count({
  where: { assignedTo: userId }
});

// CSV tasks assigned and completed
completedTasks = await prisma.dataUploadTask.count({
  where: { 
    assignedTo: userId,
    status: 'COMPLETED'
  }
});

// CSV tasks assigned and pending
pendingTasks = await prisma.dataUploadTask.count({
  where: { 
    assignedTo: userId,
    status: { in: ['PENDING', 'IN_PROGRESS'] }
  }
});
```

---

### 2. **User Service** (`user.service.ts`)

#### Remaining Tasks for Each User:
```typescript
// Count CSV upload tasks that are not completed
const remainingTasks = await prisma.dataUploadTask.count({
  where: {
    assignedTo: user.id,
    status: { in: ['PENDING', 'IN_PROGRESS'] }
  }
});
```

---

## 📋 Task Status Definitions

### CSV Upload Task Statuses:
- **PENDING** - CSV uploaded, not yet started processing
- **IN_PROGRESS** - Admin is working on the data
- **COMPLETED** - All data in CSV has been processed

### Counting Logic:
- **Assigned Tasks** = All CSV upload tasks
- **Pending Tasks** = CSV tasks with status PENDING or IN_PROGRESS
- **Completed Tasks** = CSV tasks with status COMPLETED
- **Remaining Tasks** = CSV tasks with status PENDING or IN_PROGRESS (per user)

---

## 🎯 Task Hierarchy

```
CSV Upload Task (1 Task)
├── Task ID: abc-123
├── Filename: domains.csv
├── Status: IN_PROGRESS
├── Assigned To: John Doe
└── Data Rows (Reference Only):
    ├── Row 1: example.com
    ├── Row 2: test.com
    ├── Row 3: demo.com
    └── Total: 3 rows (not counted as tasks)
```

**Important:** The 3 data rows are part of the single CSV task, not 3 separate tasks.

---

## 📊 Dashboard Display

### Admin Dashboard:
```
┌─────────────────────────────────────────┐
│ Welcome back, John!                     │
│ Here's an overview of your tasks        │
├─────────────────────────────────────────┤
│                                          │
│  📤 Assigned Tasks: 5 CSV files         │
│  ✅ Completed Tasks: 3 CSV files        │
│  ⏳ Pending Tasks: 2 CSV files          │
│                                          │
└─────────────────────────────────────────┘
```

### Super Admin Dashboard:
```
┌─────────────────────────────────────────┐
│ Welcome back, Super Admin!              │
│ Here's an overview of the system        │
├─────────────────────────────────────────┤
│                                          │
│  👥 Total Users: 3                      │
│  📤 Assigned Tasks: 10 CSV files        │
│  ✅ Completed Tasks: 7 CSV files        │
│  ⏳ Pending Tasks: 3 CSV files          │
│                                          │
└─────────────────────────────────────────┘
```

---

## 👥 User Module Display

### Super Admin View:
```
| Name       | Email            | Role  | Status | Remaining Tasks | Actions |
|------------|------------------|-------|--------|-----------------|---------|
| John Doe   | john@example.com | Admin | Active | 2 CSV files     | [Edit]  |
| Jane Smith | jane@example.com | Admin | Active | 0 CSV files     | [Edit]  |
| Bob Admin  | bob@example.com  | Admin | Active | 1 CSV file      | [Edit]  |
```

**Badge Colors:**
- **Orange** - User has pending CSV tasks
- **Gray** - No pending CSV tasks

---

## 📝 Data Row Count (Reference Only)

### Task Detail Page:
```
┌─────────────────────────────────────────┐
│ Task: domains.csv                       │
│ Status: IN_PROGRESS                     │
│ Assigned To: John Doe                   │
├─────────────────────────────────────────┤
│                                          │
│ Data Rows in this CSV: 150              │
│ ├── Pending: 75 rows                    │
│ ├── Verified: 50 rows                   │
│ └── Reached: 25 rows                    │
│                                          │
│ Note: This is for reference only.       │
│ The task count is 1 (this CSV file).    │
│                                          │
└─────────────────────────────────────────┘
```

---

## ✅ Summary

**Key Changes:**

✅ **Dashboard:**
- Counts CSV upload tasks, not data rows
- Shows number of CSV files assigned/completed/pending

✅ **User Module:**
- Shows remaining CSV upload tasks per user
- Badge displays CSV file count

✅ **Task Definition:**
- 1 CSV upload = 1 task
- Data rows are part of the task, not separate tasks

✅ **Status Tracking:**
- PENDING - CSV not started
- IN_PROGRESS - CSV being processed
- COMPLETED - CSV fully processed

**Task counting now accurately reflects CSV upload tasks!** 🚀
