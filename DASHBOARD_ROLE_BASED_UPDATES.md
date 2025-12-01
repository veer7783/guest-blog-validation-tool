# ✅ Dashboard & User Module - Role-Based Updates

**Date:** November 19, 2025, 11:16 AM IST  
**Status:** ✅ **COMPLETED**

---

## 🎯 Features Implemented

### 1. **Role-Based Dashboard** ✅
- Admin users no longer see total user count
- Only Super Admin sees total users
- Both roles see task statistics

### 2. **Task Statistics** ✅
- Assigned Tasks count
- Completed Tasks count (sites marked as REACHED)
- Pending Tasks count

### 3. **Remaining Tasks in User Module** ✅
- Super Admin sees remaining task count for each user
- Displayed as badge/chip in Users table
- Color-coded (orange for pending, gray for none)

---

## 📊 Dashboard Updates

### Admin Dashboard:
```
┌─────────────────────────────────────────────────┐
│ Welcome back, John!                             │
│ Here's an overview of your assigned tasks       │
├─────────────────────────────────────────────────┤
│                                                  │
│  📤 Assigned Tasks    ✅ Completed Tasks        │
│     5                     3                      │
│                                                  │
│  ⏳ Pending Tasks                               │
│     2                                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Super Admin Dashboard:
```
┌─────────────────────────────────────────────────┐
│ Welcome back, Super Admin!                      │
│ Here's an overview of your guest blog system    │
├─────────────────────────────────────────────────┤
│                                                  │
│  👥 Total Users      📤 Assigned Tasks          │
│     3                    10                      │
│                                                  │
│  ✅ Completed Tasks  ⏳ Pending Tasks           │
│     7                    3                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 👥 User Module Updates

### Super Admin View:
```
| Name       | Email            | Role  | Status | Remaining Tasks | Created At | Actions           |
|------------|------------------|-------|--------|-----------------|------------|-------------------|
| John Doe   | john@example.com | Admin | Active | 2 tasks         | 11/19/2025 | [Edit][Pass][Act] |
| Jane Smith | jane@example.com | Admin | Active | 0 tasks         | 11/18/2025 | [Edit][Pass][Act] |
```

**Remaining Tasks Badge:**
- **Orange Badge** - User has pending tasks (e.g., "2 tasks")
- **Gray Badge** - No pending tasks (e.g., "0 tasks")

---

## 🔧 Backend Implementation

### 1. **Dashboard Service** (`dashboard.service.ts`)

```typescript
static async getDashboardStats(userId: string, userRole: string) {
  const stats: any = {};

  // Only Super Admin sees total users
  if (userRole === 'SUPER_ADMIN') {
    stats.totalUsers = await prisma.user.count();
  }

  // Get task counts based on role
  if (userRole === 'SUPER_ADMIN') {
    // Super Admin sees all tasks
    stats.assignedTasks = await prisma.dataUploadTask.count();
    stats.completedTasks = await prisma.dataFinal.count();
    stats.pendingTasks = await prisma.dataInProcess.count({
      where: { status: { in: ['PENDING', 'VERIFIED'] } }
    });
  } else {
    // Admin sees only their assigned tasks
    stats.assignedTasks = await prisma.dataUploadTask.count({
      where: { assignedTo: userId }
    });
    stats.completedTasks = await prisma.dataFinal.count({
      where: { reachedBy: userId }
    });
    stats.pendingTasks = await prisma.dataInProcess.count({
      where: {
        uploadTask: { assignedTo: userId },
        status: { in: ['PENDING', 'VERIFIED'] }
      }
    });
  }

  return stats;
}
```

### 2. **User Service Update** (`user.service.ts`)

```typescript
// Add remaining tasks count for each user
const usersWithTasks = await Promise.all(
  users.map(async (user) => {
    const remainingTasks = await prisma.dataInProcess.count({
      where: {
        uploadTask: { assignedTo: user.id },
        status: { in: ['PENDING', 'VERIFIED'] }
      }
    });

    return { ...user, remainingTasks };
  })
);
```

### 3. **Dashboard Controller** (`dashboard.controller.ts`)

```typescript
static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const stats = await DashboardService.getDashboardStats(userId, userRole);

  res.status(200).json({
    success: true,
    data: stats
  });
}
```

### 4. **Routes** (`dashboard.routes.ts`)

```typescript
router.get('/stats', DashboardController.getDashboardStats);
```

---

## 🎨 Frontend Implementation

### 1. **Dashboard Component** (`Dashboard.tsx`)

```tsx
const fetchDashboardStats = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.data.success) {
    setStats(response.data.data);
  }
};

// Only Super Admin sees Total Users
if (user?.role === 'SUPER_ADMIN' && stats.totalUsers !== undefined) {
  statCards.push({
    title: 'Total Users',
    value: stats.totalUsers,
    icon: <PeopleIcon />,
    color: '#1976d2'
  });
}

// Both Admin and Super Admin see these
statCards.push(
  { title: 'Assigned Tasks', value: stats.assignedTasks, ... },
  { title: 'Completed Tasks', value: stats.completedTasks, ... },
  { title: 'Pending Tasks', value: stats.pendingTasks, ... }
);
```

### 2. **Users Component** (`Users.tsx`)

```tsx
// Add Remaining Tasks column (Super Admin only)
{currentUser?.role === 'SUPER_ADMIN' && (
  <TableCell><strong>Remaining Tasks</strong></TableCell>
)}

// Display remaining tasks badge
{currentUser?.role === 'SUPER_ADMIN' && (
  <TableCell>
    <Chip
      label={`${user.remainingTasks || 0} tasks`}
      color={user.remainingTasks && user.remainingTasks > 0 ? 'warning' : 'default'}
      size="small"
    />
  </TableCell>
)}
```

---

## 📋 API Endpoints

### Get Dashboard Stats
```
GET /api/dashboard/stats
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: {
    totalUsers?: number,      // Only for Super Admin
    assignedTasks: number,
    completedTasks: number,
    pendingTasks: number
  }
}
```

### Get All Users (with remaining tasks)
```
GET /api/users
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: {
    users: [{
      id: string,
      email: string,
      firstName: string,
      lastName: string,
      role: string,
      isActive: boolean,
      createdAt: string,
      remainingTasks: number    // Added
    }],
    pagination: { ... }
  }
}
```

---

## 🎯 Task Status Definitions

### Pending Tasks:
- Status: `PENDING` or `VERIFIED`
- Not yet marked as REACHED
- Still in DataInProcess table

### Completed Tasks:
- Status: `REACHED`
- Moved to DataFinal table
- Counted as completed

### Assigned Tasks:
- All tasks assigned to the user
- Includes both pending and completed

---

## ✅ Role-Based Visibility

| Feature                | Admin | Super Admin |
|------------------------|-------|-------------|
| Total Users Count      | ❌    | ✅          |
| Assigned Tasks Count   | ✅    | ✅          |
| Completed Tasks Count  | ✅    | ✅          |
| Pending Tasks Count    | ✅    | ✅          |
| User Remaining Tasks   | ❌    | ✅          |

**Admin sees:** Only their own task statistics  
**Super Admin sees:** All users' statistics + individual user remaining tasks

---

## 🧪 Testing

### Test 1: Admin Dashboard
1. Login as Admin user
2. Go to Dashboard
3. **Expected:**
   - No "Total Users" card
   - See "Assigned Tasks" (only their tasks)
   - See "Completed Tasks" (only their completed)
   - See "Pending Tasks" (only their pending)

### Test 2: Super Admin Dashboard
1. Login as Super Admin
2. Go to Dashboard
3. **Expected:**
   - See "Total Users" card
   - See "Assigned Tasks" (all tasks)
   - See "Completed Tasks" (all completed)
   - See "Pending Tasks" (all pending)

### Test 3: User Module - Remaining Tasks
1. Login as Super Admin
2. Go to Users page
3. **Expected:**
   - See "Remaining Tasks" column
   - Each user shows task count
   - Orange badge if tasks > 0
   - Gray badge if tasks = 0

### Test 4: Admin Cannot See Remaining Tasks
1. Login as Admin
2. Go to Users page (if accessible)
3. **Expected:**
   - No "Remaining Tasks" column visible

---

## ✅ Summary

**Complete Implementation:**

✅ **Dashboard Updates:**
- Role-based visibility
- Real-time task statistics
- Admin sees only their tasks
- Super Admin sees all tasks

✅ **User Module Updates:**
- Remaining tasks column (Super Admin only)
- Color-coded badges
- Real-time task counts

✅ **Backend Services:**
- Dashboard stats service
- User service with task counts
- Role-based data filtering

✅ **API Endpoints:**
- `/api/dashboard/stats` - Get dashboard statistics
- `/api/users` - Get users with remaining tasks

**All features are ready to use!** 🚀
