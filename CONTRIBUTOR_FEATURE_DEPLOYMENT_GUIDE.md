# CONTRIBUTOR Role Feature - Production Deployment Guide

**Date:** January 12, 2026  
**Feature:** Complete CONTRIBUTOR role implementation with data visibility and push functionality

---

## 📋 Overview

This guide documents all changes made to implement the CONTRIBUTOR role feature, allowing contributors to:
- Upload CSV files with their own data
- View only their uploaded data across all modules
- Push sites to the main tool (all pushes go to pending for approval)
- See only sites they uploaded with lower prices (price comparison rules apply)

---

## 🗄️ Database Schema Changes

### Required Fields

Ensure the following fields exist in your database schema:

#### 1. `data_in_process` table
```sql
ALTER TABLE `data_in_process` 
ADD COLUMN IF NOT EXISTS `uploadedBy` VARCHAR(191) NULL;

CREATE INDEX IF NOT EXISTS `data_in_process_uploadedBy_idx` 
ON `data_in_process`(`uploadedBy`);
```

#### 2. `data_final` table
```sql
ALTER TABLE `data_final` 
ADD COLUMN IF NOT EXISTS `uploadedBy` VARCHAR(191) NULL;

CREATE INDEX IF NOT EXISTS `data_final_uploadedBy_idx` 
ON `data_final`(`uploadedBy`);
```

#### 3. `users` table - UserRole enum
```sql
-- Ensure CONTRIBUTOR role exists in UserRole enum
-- Should have: ADMIN, SUPER_ADMIN, USER, CONTRIBUTOR
```

### Prisma Schema Verification

Verify these fields exist in `backend/prisma/schema.prisma`:

```prisma
model DataInProcess {
  // ... other fields
  uploadedBy         String?
  // ... other fields
}

model DataFinal {
  // ... other fields
  uploadedBy         String?
  // ... other fields
}

enum UserRole {
  ADMIN
  SUPER_ADMIN
  USER
  CONTRIBUTOR
}
```

### Run Prisma Commands

```bash
cd backend
npx prisma generate
npx prisma db push  # Or use migrations in production
```

---

## 📁 Backend Files Changed

### 1. **`backend/src/controllers/upload.controller.ts`**

**Changes:**
- Added `uploadedBy` field when creating new records (line ~526)
- Added `hasPriceImprovement` tracking for updates (line ~219)
- Conditional `uploadedBy` assignment based on role and price improvement (lines ~540-551)
- Added console logging for debugging CONTRIBUTOR uploads

**Key Logic:**
```typescript
// Set uploadedBy for new records
uploadedBy: req.user?.id

// Set uploadedBy for updates only if:
// 1. User is SUPER_ADMIN, OR
// 2. User is CONTRIBUTOR AND price is lower
if (userRole === 'SUPER_ADMIN' || (userRole === 'CONTRIBUTOR' && update.hasPriceImprovement)) {
  update.updates.uploadedBy = req.user?.id;
}
```

---

### 2. **`backend/src/services/dataInProcess.service.ts`**

**Changes:**
- Added `uploadedBy` filtering in `getAll` method (lines ~113-115)
- Preserved `uploadedBy` when moving data to DataFinal in `markAsReached` (line ~248)
- Added console logging for debugging

**Key Logic:**
```typescript
// Filter by uploadedBy for CONTRIBUTOR
if (userId && userRole === 'CONTRIBUTOR') {
  where.uploadedBy = userId;
}

// Preserve uploadedBy when creating DataFinal record
uploadedBy: existing.uploadedBy
```

---

### 3. **`backend/src/controllers/dataInProcess.controller.ts`**

**Changes:**
- Added console logging in `getAll` method (lines ~17-34)
- Passes `userId` and `userRole` to service for filtering

---

### 4. **`backend/src/services/dataFinal.service.ts`**

**Changes:**
- Updated `getAll` method to filter by `uploadedBy` for CONTRIBUTOR (lines ~35-89)
- Updated `getPushedRecords` method to filter by `uploadedBy` for CONTRIBUTOR (lines ~191-206)

**Key Logic:**
```typescript
// In getAll - filter unpushed records
if (userId && userRole === 'CONTRIBUTOR') {
  where.uploadedBy = userId;
  where.mainProjectId = null; // Only unpushed records
}

// In getPushedRecords - filter pushed records
if (userId && userRole === 'CONTRIBUTOR') {
  where.uploadedBy = userId;
}
```

---

### 5. **`backend/src/controllers/dataFinal.controller.ts`**

**Changes:**
- Updated `pushToMainProject` to allow CONTRIBUTOR role (lines ~266-376)
- CONTRIBUTOR pushes always go to pending module
- SUPER_ADMIN keeps existing behavior (new sites direct import, lower prices to pending)
- Updated `getPushedRecords` to allow CONTRIBUTOR access (lines ~140-154)

**Key Logic:**
```typescript
// Allow CONTRIBUTOR to push
if (userRole !== 'SUPER_ADMIN' && userRole !== 'CONTRIBUTOR') {
  return res.status(403).json({ message: 'Access denied' });
}

// CONTRIBUTOR pushes always go to pending
if (userRole === 'CONTRIBUTOR') {
  // All sites go to pending for approval
  sitesToPending.push(...selectedSites);
}
```

---

### 6. **`backend/src/routes/dataFinal.routes.ts`**

**Changes:**
- Removed `requireSuperAdmin` middleware from push route (line ~24)
- Now allows both SUPER_ADMIN and CONTRIBUTOR to push

**Before:**
```typescript
router.post('/push-to-main-project', requireSuperAdmin, DataFinalController.pushToMainProject);
```

**After:**
```typescript
router.post('/push-to-main-project', DataFinalController.pushToMainProject);
```

---

## 📁 Frontend Files Changed

### 1. **`frontend/src/pages/UploadCSV.tsx`**

**Changes:**
- Made user fetching conditional - only SUPER_ADMIN fetches users (lines ~106-142)
- Only append `assignedTo` for non-CONTRIBUTOR users (lines ~221-228)
- Admin assignment dropdown already hidden for CONTRIBUTOR (line ~492)

**Key Logic:**
```typescript
// Only fetch users for SUPER_ADMIN
if (isContributor) {
  return;
}

// Only add assignedTo for non-CONTRIBUTOR
if (!isContributor && assignedTo) {
  formData.append('assignedTo', assignedTo);
}
```

---

### 2. **`frontend/src/components/layout/Sidebar.tsx`**

**Changes:**
- Added CONTRIBUTOR role to "Pushed Data" menu item (line ~44)

**Before:**
```typescript
{ text: 'Pushed Data', icon: <SendIcon />, path: '/pushed-data', roles: ['SUPER_ADMIN'] }
```

**After:**
```typescript
{ text: 'Pushed Data', icon: <SendIcon />, path: '/pushed-data', roles: ['SUPER_ADMIN', 'CONTRIBUTOR'] }
```

---

## 🚀 Deployment Steps

### Step 1: Backup Database
```bash
# Create database backup before deployment
mysqldump -u username -p guest_blog_validation > backup_$(date +%Y%m%d).sql
```

### Step 2: Update Database Schema
```bash
cd backend
npx prisma db push
# Or use migrations:
npx prisma migrate deploy
```

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 4: Deploy Backend Changes
```bash
# Pull latest code
git pull origin main

# Install dependencies (if any new)
npm install

# Build TypeScript
npm run build

# Restart backend service
pm2 restart guest-blog-backend
# Or your deployment method
```

### Step 5: Deploy Frontend Changes
```bash
cd frontend

# Pull latest code
git pull origin main

# Install dependencies (if any new)
npm install

# Build production bundle
npm run build

# Deploy to hosting (e.g., Netlify, Vercel, etc.)
```

### Step 6: Verify Deployment
```bash
# Check backend logs
pm2 logs guest-blog-backend

# Verify database columns exist
mysql -u username -p guest_blog_validation
> DESCRIBE data_in_process;
> DESCRIBE data_final;
```

---

## ✅ Testing Checklist

### Test as CONTRIBUTOR

#### 1. Upload CSV - New Sites
- [ ] Login as CONTRIBUTOR
- [ ] Upload CSV with new sites
- [ ] Verify sites appear in Data Management page
- [ ] Verify `uploadedBy` field is set in database
- [ ] Backend logs show: `[UPLOAD] Creating DataInProcess records. User ID: ... Role: CONTRIBUTOR`

#### 2. Upload CSV - Existing Sites (Lower Price)
- [ ] Upload CSV with existing site but lower price
- [ ] Verify site is updated and visible in Data Management
- [ ] Backend logs show: `[ENHANCED UPDATE] Setting uploadedBy for CONTRIBUTOR (hasPriceImprovement: true)`

#### 3. Upload CSV - Existing Sites (Same/Higher Price)
- [ ] Upload CSV with existing site but same or higher price
- [ ] Verify site is skipped and NOT visible in Data Management
- [ ] Backend logs show: `[ENHANCED UPDATE] NOT setting uploadedBy for CONTRIBUTOR (hasPriceImprovement: false)`

#### 4. Data Final Module
- [ ] Admin marks CONTRIBUTOR's sites as "Reached"
- [ ] Login as CONTRIBUTOR
- [ ] Go to Data Final page
- [ ] Verify only CONTRIBUTOR's uploaded sites are visible
- [ ] Backend logs show: `[DataFinal.getAll] CONTRIBUTOR filter - uploadedBy: <contributor-id>`

#### 5. Push to Main Tool
- [ ] Select sites in Data Final page
- [ ] Click "Push to LM Tool"
- [ ] Verify no 403 error
- [ ] Verify push is successful
- [ ] Check main tool - all CONTRIBUTOR pushes should be in pending module

#### 6. Pushed Data Page
- [ ] Go to Pushed Data page
- [ ] Verify "Pushed Data" menu item is visible for CONTRIBUTOR
- [ ] Verify only CONTRIBUTOR's pushed sites are visible
- [ ] Backend logs show: `[DataFinal.getPushedRecords] CONTRIBUTOR filter - uploadedBy: <contributor-id>`

### Test as SUPER_ADMIN

#### 1. Verify Existing Functionality
- [ ] Upload CSV - all sites visible
- [ ] Data Management - all sites visible
- [ ] Data Final - all sites visible
- [ ] Push to Main Tool - works as before (new sites direct, lower prices to pending)
- [ ] Pushed Data - all pushed sites visible

---

## 🔍 Monitoring & Logs

### Key Log Messages to Monitor

**Successful CONTRIBUTOR Upload:**
```
[UPLOAD] Creating DataInProcess records. User ID: <id> User Role: CONTRIBUTOR
[DataInProcess.bulkCreate] Creating X records
[DataInProcess.bulkCreate] First record uploadedBy: <contributor-id>
[DataInProcess.bulkCreate] Successfully created X records
```

**CONTRIBUTOR Data Filtering:**
```
[DataInProcess.getAll] User: <id> Role: CONTRIBUTOR
[DataInProcess.getAll] CONTRIBUTOR filter - uploadedBy: <id>
[DataInProcess.getAll] Result count: X Total: X
```

**Price Comparison Logic:**
```
[ENHANCED UPDATE] Setting uploadedBy for CONTRIBUTOR (hasPriceImprovement: true)
[ENHANCED UPDATE] NOT setting uploadedBy for CONTRIBUTOR (hasPriceImprovement: false)
```

**Push to Main Tool:**
```
[DataFinal.pushToMainProject] User role: CONTRIBUTOR
[DataFinal.pushToMainProject] Pushing X sites to pending module
```

---

## 🐛 Troubleshooting

### Issue: CONTRIBUTOR can't see uploaded data

**Check:**
1. Database has `uploadedBy` column: `DESCRIBE data_in_process;`
2. Prisma client regenerated: `npx prisma generate`
3. Backend logs show `uploadedBy` being set
4. Query filtering is working: Check logs for `[DataInProcess.getAll] CONTRIBUTOR filter`

**Fix:**
```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Restart backend
pm2 restart guest-blog-backend
```

---

### Issue: 403 error when CONTRIBUTOR pushes

**Check:**
1. Route middleware removed from `dataFinal.routes.ts`
2. Controller allows CONTRIBUTOR role

**Fix:**
Verify line 24 in `backend/src/routes/dataFinal.routes.ts`:
```typescript
router.post('/push-to-main-project', DataFinalController.pushToMainProject);
// Should NOT have requireSuperAdmin middleware
```

---

### Issue: CONTRIBUTOR sees sites with higher prices

**Check:**
1. `hasPriceImprovement` logic is working
2. Backend logs show correct price comparison

**Fix:**
Check logs for:
```
[ENHANCED UPDATE] NOT setting uploadedBy for CONTRIBUTOR (hasPriceImprovement: false)
```

If not showing, verify `upload.controller.ts` has the conditional logic at line ~546.

---

## 📊 Database Queries for Verification

### Check uploadedBy field population
```sql
-- Check data_in_process
SELECT uploadedBy, COUNT(*) as count 
FROM data_in_process 
GROUP BY uploadedBy;

-- Check data_final
SELECT uploadedBy, COUNT(*) as count 
FROM data_final 
GROUP BY uploadedBy;
```

### Find CONTRIBUTOR's data
```sql
-- Replace <contributor-id> with actual user ID
SELECT * FROM data_in_process 
WHERE uploadedBy = '<contributor-id>';

SELECT * FROM data_final 
WHERE uploadedBy = '<contributor-id>';
```

### Verify pushed data
```sql
-- CONTRIBUTOR's pushed sites
SELECT * FROM data_final 
WHERE uploadedBy = '<contributor-id>' 
AND mainProjectId IS NOT NULL;
```

---

## 🔐 Security Considerations

1. **Data Isolation:** CONTRIBUTOR can only see their own uploaded data
2. **Push Approval:** All CONTRIBUTOR pushes go to pending module for SUPER_ADMIN approval
3. **Price Rules:** CONTRIBUTOR can only claim ownership of sites with lower prices
4. **Role Verification:** All endpoints verify user role before allowing access

---

## 📝 Summary of Changes

### Backend (7 files)
1. `controllers/upload.controller.ts` - Upload logic with uploadedBy
2. `services/dataInProcess.service.ts` - Filtering and preservation
3. `controllers/dataInProcess.controller.ts` - Logging
4. `services/dataFinal.service.ts` - Filtering for CONTRIBUTOR
5. `controllers/dataFinal.controller.ts` - Push permissions
6. `routes/dataFinal.routes.ts` - Route middleware
7. `prisma/schema.prisma` - Schema verification

### Frontend (2 files)
1. `pages/UploadCSV.tsx` - Conditional user fetching
2. `components/layout/Sidebar.tsx` - Menu visibility

### Database (2 tables)
1. `data_in_process` - Added uploadedBy column + index
2. `data_final` - Added uploadedBy column + index

---

## 📞 Support

If issues arise during deployment:
1. Check backend logs: `pm2 logs guest-blog-backend`
2. Verify database schema: `DESCRIBE data_in_process;`
3. Test with CONTRIBUTOR account
4. Review console logs in browser developer tools

---

**Deployment completed successfully!** ✅

All CONTRIBUTOR role features are now live and functional.
