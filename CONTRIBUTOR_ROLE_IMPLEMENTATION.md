# CONTRIBUTOR Role Implementation - January 12, 2026

## Overview
Added a new CONTRIBUTOR user role that allows users to:
- Upload their own sites via CSV
- View and manage only their own uploaded data
- Push sites to main tool (goes to pending module for approval)
- Cannot access Users or Activity Log pages

---

## Database Changes

### SQL Queries to Run in phpMyAdmin

```sql
-- 1. Add CONTRIBUTOR and USER roles to users table
ALTER TABLE `users` 
MODIFY COLUMN `role` ENUM('ADMIN', 'SUPER_ADMIN', 'USER', 'CONTRIBUTOR') 
NOT NULL DEFAULT 'ADMIN';

-- 2. Add uploadedBy field to data_in_process table
ALTER TABLE `data_in_process` 
ADD COLUMN `uploadedBy` VARCHAR(191) NULL 
AFTER `keywords`;

-- 3. Add uploadedBy field to data_final table
ALTER TABLE `data_final` 
ADD COLUMN `uploadedBy` VARCHAR(191) NULL 
AFTER `keywords`;

-- 4. Add assignedAdminId field to users table (for CONTRIBUTOR auto-assignment)
ALTER TABLE `users` 
ADD COLUMN `assignedAdminId` VARCHAR(191) NULL 
AFTER `isActive`;
```

**Verification Queries:**
```sql
-- Check if role enum updated
SHOW COLUMNS FROM `users` WHERE Field = 'role';

-- Check if uploadedBy columns added
SHOW COLUMNS FROM `data_in_process` WHERE Field = 'uploadedBy';
SHOW COLUMNS FROM `data_final` WHERE Field = 'uploadedBy';

-- Check if assignedAdminId column added
SHOW COLUMNS FROM `users` WHERE Field = 'assignedAdminId';
```

---

## Backend Changes

### Files Modified:

1. **`backend/prisma/schema.prisma`**
   - Added `USER` and `CONTRIBUTOR` to `UserRole` enum
   - Added `uploadedBy String?` field to `DataInProcess` model
   - Added `uploadedBy String?` field to `DataFinal` model
   - Added `assignedAdminId String?` field to `User` model
   - Added self-referencing relation for CONTRIBUTOR → Admin assignment

2. **`backend/src/services/dataInProcess.service.ts`**
   - Added `uploadedBy` parameter to `bulkCreate` method
   - Added CONTRIBUTOR filtering in `getAll` method (line 113-115)
   - Preserve `uploadedBy` when moving to DataFinal (line 404)

3. **`backend/src/services/dataFinal.service.ts`**
   - Added `userId` and `userRole` to `DataFinalFilters` interface
   - Added CONTRIBUTOR filtering in `getAll` method (line 46-49)

4. **`backend/src/controllers/upload.controller.ts`**
   - Added `uploadedBy: req.user?.id` when creating records (line 493)
   - Added auto-assignment logic for CONTRIBUTOR users (line 38-54)
   - Fetches CONTRIBUTOR's assignedAdminId and auto-assigns tasks to that admin
   - Shows error if CONTRIBUTOR has no assigned admin

5. **`backend/src/controllers/user.controller.ts`**
   - Added `assignedAdminId` parameter to createUser method (line 12)

6. **`backend/src/services/user.service.ts`**
   - Added `assignedAdminId` field to user creation (line 17, 39, 49)

5. **`backend/src/controllers/dataFinal.controller.ts`**
   - Updated access control to allow CONTRIBUTOR role (line 16-17)
   - Pass `userId` and `userRole` to service (line 29-30, 37-38)

---

## Frontend Changes

### Files Modified:

1. **`frontend/src/components/layout/Sidebar.tsx`**
   - Added CONTRIBUTOR to allowed roles for:
     - Dashboard
     - Upload CSV
     - Data Management
     - Data Finalization
   - Users and Activity Log remain SUPER_ADMIN only

2. **`frontend/src/pages/Users.tsx`**
   - Added CONTRIBUTOR and USER options to role dropdown (line 623-626)
   - Added conditional "Assigned Admin" dropdown for CONTRIBUTOR role (line 628-649)
   - Dropdown shows all ADMIN and SUPER_ADMIN users for selection
   - Added validation to require assigned admin when creating CONTRIBUTOR
   - Updated role display chip to show all role types with colors (line 395-406)
   - Added `assignedAdminId` to create form data and API call (line 78, 226)

---

## How It Works

### CONTRIBUTOR Workflow:

1. **User Creation**: SUPER_ADMIN creates CONTRIBUTOR user
   - Selects role as "Contributor"
   - **Assigns an Admin** from dropdown (required)
   - This admin will automatically receive all tasks from this contributor

2. **Login**: CONTRIBUTOR user logs into the system

3. **Upload**: Uploads CSV file with sites
   - System automatically sets `uploadedBy = contributor_user_id`
   - **Task is automatically assigned** to their designated admin (no manual selection needed)
   - If no admin assigned to contributor, upload fails with error message

4. **View Data**: Sees only their own uploaded sites in:
   - Data Management page
   - Data Finalization page

5. **Edit**: Can edit and manage their own sites

6. **Push**: Can push sites to main tool
   - All sites go to **Pending Module** in main tool (not direct to Guest Blog Sites)
   - Admin in main tool reviews and approves

7. **Restrictions**: Cannot access:
   - Users page
   - Activity Log page
   - Pushed Data page
   - Other users' data

### Backend Filtering Logic:

```typescript
// In dataInProcess.service.ts and dataFinal.service.ts
if (userId && userRole === 'CONTRIBUTOR') {
  where.uploadedBy = userId;  // Only show their own data
}
```

### Push Workflow (All Roles):

- All sites pushed from validation tool → **Pending Module** in main tool
- Main tool admin reviews and approves/rejects
- No direct import to Guest Blog Sites table

---

## Deployment Steps

### 1. Database Migration
```bash
# Run the SQL queries in phpMyAdmin (see above)
# Verify with verification queries
```

### 2. Backend Deployment
```bash
cd backend

# Generate Prisma client with new schema
npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript
npm run build

# Upload these files to production server:
# - dist/ folder (entire compiled backend)
# - prisma/schema.prisma
# - node_modules/.prisma/ (regenerated Prisma client)

# Restart backend service
pm2 restart guest-blog-validation-backend
```

### 3. Frontend Deployment
```bash
cd frontend

# Build frontend
npm run build

# Upload build/ folder to production server
# Clear browser cache after deployment
```

---

## Testing Checklist

### ✅ Create CONTRIBUTOR User
- [ ] Login as SUPER_ADMIN
- [ ] Go to Users page
- [ ] Create new user with CONTRIBUTOR role
- [ ] Verify user appears in list with "Contributor" badge

### ✅ Test CONTRIBUTOR Login
- [ ] Logout and login as CONTRIBUTOR
- [ ] Verify sidebar shows: Dashboard, Upload CSV, Data Management, Data Finalization
- [ ] Verify sidebar HIDES: Users, Activity Log, Pushed Data

### ✅ Test CSV Upload
- [ ] Upload CSV as CONTRIBUTOR
- [ ] **Verify task is automatically assigned** to the contributor's designated admin (no manual selection)
- [ ] Check database: `SELECT * FROM data_in_process WHERE uploadedBy = 'contributor_id'`
- [ ] Verify uploadedBy field is populated
- [ ] Check upload task: `SELECT assignedTo FROM data_upload_tasks WHERE createdBy = 'contributor_id'`
- [ ] Verify assignedTo matches the contributor's assignedAdminId

### ✅ Test Data Visibility
- [ ] CONTRIBUTOR sees only their own uploaded sites in Data Management
- [ ] CONTRIBUTOR sees only their own sites in Data Finalization
- [ ] Login as SUPER_ADMIN and verify you see ALL sites (no filtering)
- [ ] Login as different CONTRIBUTOR and verify they don't see first CONTRIBUTOR's data

### ✅ Test Push to Main Tool
- [ ] CONTRIBUTOR pushes their site from Data Finalization
- [ ] Verify site goes to **Pending Module** in main tool (not Guest Blog Sites)
- [ ] Check data_final table: `SELECT uploadedBy FROM data_final WHERE websiteUrl = 'test-site.com'`
- [ ] Verify uploadedBy is preserved after push

### ✅ Test Edit/Delete
- [ ] CONTRIBUTOR can edit their own sites
- [ ] CONTRIBUTOR can delete their own sites
- [ ] Verify CONTRIBUTOR cannot see/edit other users' sites

### ✅ Test Access Restrictions
- [ ] Try accessing /users as CONTRIBUTOR → Should be blocked or hidden
- [ ] Try accessing /activity-log as CONTRIBUTOR → Should be blocked or hidden
- [ ] Try accessing /pushed-data as CONTRIBUTOR → Should be blocked or hidden

---

## Rollback Plan

If issues occur:

### Database Rollback:
```sql
-- Remove uploadedBy columns
ALTER TABLE `data_in_process` DROP COLUMN `uploadedBy`;
ALTER TABLE `data_final` DROP COLUMN `uploadedBy`;

-- Revert role enum (if needed)
ALTER TABLE `users` 
MODIFY COLUMN `role` ENUM('ADMIN', 'SUPER_ADMIN') 
NOT NULL DEFAULT 'ADMIN';
```

### Code Rollback:
- Restore previous backend dist/ folder
- Restore previous frontend build/ folder
- Restart services

---

## Notes

- **All push operations** (regardless of role) send sites to Pending Module in main tool
- CONTRIBUTOR role is **read-only** for other users' data (complete isolation)
- Database schema changes are **backward compatible** (uploadedBy is nullable)
- Existing data will have `uploadedBy = NULL` (only new uploads will be tracked)
- SUPER_ADMIN can see all data regardless of uploadedBy field

---

## Summary

**Time to Implement**: ~2-3 hours  
**Database Changes**: 3 SQL queries  
**Backend Files Modified**: 5 files  
**Frontend Files Modified**: 2 files  
**Breaking Changes**: None (backward compatible)  
**Testing Required**: Yes (see checklist above)

**Status**: ✅ Ready for deployment
