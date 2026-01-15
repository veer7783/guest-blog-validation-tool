# Publisher Sync Feature - Production Deployment Guide

**Date:** January 13, 2026  
**Feature:** Automatic Publisher Synchronization  
**Sync Interval:** Every 5 minutes

---

## 📋 Overview

This deployment adds automatic publisher synchronization functionality that:
- Syncs publisher information across all sites with the same email
- Runs automatically every 5 minutes in the background
- Syncs on push operations (manual trigger)
- Updates both `data_in_process` and `data_final` tables
- Ensures all sites show correct publisher information in Pushed Data module

---

## 🎯 Problem Solved

**Before:**
- When Site A with `john@example.com` was pushed → Publisher created in main tool
- Sites B-J with same email still showed `publisherMatched: false` locally
- Pushed Data module showed "Not set" for Sites B-J
- No automatic sync across sites with same email

**After:**
- When Site A is pushed → Publisher created in main tool
- **Automatic sync runs** → All sites with `john@example.com` get updated
- All sites show `publisherMatched: true` with correct publisher ID
- Pushed Data shows correct publisher for all sites
- Background sync runs every 5 minutes to catch any missed updates

---

## 📦 Files to Deploy

### **New Files (2 files):**

1. **`backend/src/services/publisherSync.service.ts`** (NEW)
   - Core publisher sync logic
   - Email-based publisher matching
   - Bulk update for both tables
   - Methods:
     - `syncPublishersByEmail()` - Sync specific emails
     - `syncPublishersForRecords()` - Sync for specific records
     - `syncAllExistingRecords()` - Sync all unmatched records

2. **`backend/src/services/scheduler.service.ts`** (NEW)
   - Scheduler for periodic background jobs
   - Runs publisher sync every 5 minutes
   - Graceful start/stop
   - Status monitoring

### **Modified Files (2 files):**

3. **`backend/src/controllers/dataFinal.controller.ts`**
   - Added import for `PublisherSyncService`
   - Added sync call after direct import (line 413-416)
   - Added sync call after approval submission (line 430-433)

4. **`backend/src/server.ts`**
   - Added import for `SchedulerService`
   - Starts automatic sync on server startup (line 112-113)
   - Added graceful shutdown handlers (line 116-127)

---

## 🗄️ Database Changes

**No database migration required** - Uses existing columns:
- `publisherId`
- `publisherMatched`
- `publisherName`
- `publisherEmail`
- `contactEmail`
- `contactName`

The sync updates these existing fields.

---

## 🚀 Deployment Steps

### **Step 1: Backup**

```bash
# Backup production database
mysqldump -u user -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup current production files
cp -r /path/to/backend /path/to/backup/backend_$(date +%Y%m%d_%H%M%S)
```

### **Step 2: Deploy Backend Files**

#### **Option A: Deploy All Backend Files**

```bash
# Stop backend server
pm2 stop guest-blog-backend

# Upload entire backend/dist folder
scp -r backend/dist/* user@server:/path/to/backend/dist/

# Or upload source files and rebuild on server
scp -r backend/src/* user@server:/path/to/backend/src/
cd /path/to/backend
npm install
npm run build

# Restart backend server
pm2 start guest-blog-backend
pm2 logs guest-blog-backend
```

#### **Option B: Deploy Only Changed Files**

Upload these 4 files to production:

```bash
# New files
backend/src/services/publisherSync.service.ts
backend/src/services/scheduler.service.ts

# Modified files
backend/src/controllers/dataFinal.controller.ts
backend/src/server.ts
```

Then rebuild on server:
```bash
cd /path/to/backend
npm run build
pm2 restart guest-blog-backend
```

### **Step 3: Verify Deployment**

Check backend logs for scheduler startup:

```bash
pm2 logs guest-blog-backend --lines 50
```

**Expected logs:**
```
╔════════════════════════════════════════════════════════════╗
║  Guest Blog Validation Tool - Backend Server              ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: 5000                                                ║
╚════════════════════════════════════════════════════════════╝

[Scheduler] Starting automatic publisher sync (every 5 minutes)...
[Scheduler] Publisher sync scheduler started successfully

========================================
[Scheduler] Running automatic publisher sync...
Time: 2026-01-13T12:00:00.000Z
[PublisherSync] Starting automatic sync for all existing records...
[PublisherSync] Found X unique emails to sync
[Scheduler] ✅ Sync completed: X records updated
========================================
```

---

## 🧪 Testing Checklist

### **Test 1: Automatic Sync on Server Start**

- [ ] Backend server starts successfully
- [ ] Scheduler logs show "Starting automatic publisher sync (every 5 minutes)..."
- [ ] First sync runs immediately
- [ ] Check database for updated records

### **Test 2: Periodic Sync (Every 5 Minutes)**

- [ ] Wait 5 minutes
- [ ] Check logs for sync execution
- [ ] Verify records are being synced
- [ ] Monitor for any errors

### **Test 3: Manual Sync on Push**

- [ ] Upload CSV with multiple sites using same email
- [ ] Mark one site as "Publisher" and push
- [ ] Check logs for sync execution after push
- [ ] Verify all sites with same email are synced
- [ ] Check Pushed Data module - should show correct publisher

### **Test 4: Database Verification**

```sql
-- Check synced records
SELECT 
  websiteUrl, 
  publisherId, 
  publisherMatched, 
  publisherEmail, 
  contactEmail 
FROM data_final 
WHERE publisherEmail IS NOT NULL 
  OR contactEmail IS NOT NULL
ORDER BY publisherEmail;

-- Should show:
-- - publisherId with real IDs (not pending_...)
-- - publisherMatched = true
-- - publisherEmail populated
-- - contactEmail = null (cleared after sync)
```

### **Test 5: Pushed Data Module**

- [ ] Login to frontend
- [ ] Navigate to Pushed Data module
- [ ] Verify all pushed sites show correct publisher
- [ ] No "Not set" entries for sites with publishers

---

## 🔍 Monitoring

### **Check Scheduler Status**

```bash
# View real-time logs
pm2 logs guest-blog-backend --lines 100

# Look for these patterns every 5 minutes:
[Scheduler] Running automatic publisher sync...
[PublisherSync] Found X unique emails to sync
[PublisherSync] Updated X records in data_in_process
[PublisherSync] Updated X records in data_final
[Scheduler] ✅ Sync completed: X records updated
```

### **Monitor Sync Performance**

```sql
-- Check how many records need syncing
SELECT COUNT(*) as unsynced_records
FROM (
  SELECT id FROM data_in_process 
  WHERE (publisherEmail IS NOT NULL OR contactEmail IS NOT NULL)
    AND (publisherId IS NULL OR publisherId LIKE 'pending_%' OR publisherMatched = false)
  UNION ALL
  SELECT id FROM data_final 
  WHERE (publisherEmail IS NOT NULL OR contactEmail IS NOT NULL)
    AND (publisherId IS NULL OR publisherId LIKE 'pending_%' OR publisherMatched = false)
) as unsynced;
```

### **Check Sync History**

```bash
# View last 24 hours of sync logs
pm2 logs guest-blog-backend --lines 1000 | grep "Scheduler"
```

---

## 🔧 Troubleshooting

### **Issue: Scheduler Not Starting**

**Symptoms:**
- No scheduler logs on server start
- No automatic sync running

**Solution:**
```bash
# Check if SchedulerService is imported in server.ts
grep "SchedulerService" /path/to/backend/src/server.ts

# Verify scheduler.service.ts exists
ls -la /path/to/backend/src/services/scheduler.service.ts

# Rebuild and restart
cd /path/to/backend
npm run build
pm2 restart guest-blog-backend
```

### **Issue: Sync Not Updating Records**

**Symptoms:**
- Scheduler runs but 0 records synced
- Records still show pending IDs

**Solution:**
```bash
# Check if publishers exist in main tool
# Verify main tool API connection
curl -X GET https://your-main-tool.com/api/publishers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check backend logs for errors
pm2 logs guest-blog-backend --err

# Manually trigger sync by restarting server
pm2 restart guest-blog-backend
```

### **Issue: High Memory Usage**

**Symptoms:**
- Server memory increasing over time
- Sync taking longer

**Solution:**
```bash
# Check memory usage
pm2 monit

# If needed, increase sync interval to 10 minutes
# Edit scheduler.service.ts: change 300000 to 600000

# Or restart server periodically
pm2 restart guest-blog-backend
```

---

## 📊 Performance Metrics

### **Expected Performance:**

- **Sync Duration:** 2-10 seconds (depends on number of records)
- **Memory Usage:** +10-20MB during sync
- **CPU Usage:** Minimal spike during sync
- **Database Queries:** 2-4 queries per sync cycle

### **Optimization Tips:**

1. **Reduce Sync Frequency** if needed:
   - Change from 5 minutes to 10 minutes
   - Edit `scheduler.service.ts`: `300000` → `600000`

2. **Add Indexes** for better performance:
   ```sql
   CREATE INDEX idx_data_in_process_email ON data_in_process(publisherEmail, contactEmail);
   CREATE INDEX idx_data_final_email ON data_final(publisherEmail, contactEmail);
   ```

3. **Monitor Main Tool API**:
   - Ensure main tool API is responsive
   - Check for rate limiting
   - Verify publisher list is up to date

---

## 🔄 Rollback Plan

If issues occur, follow these steps:

### **Step 1: Stop Scheduler**

```bash
# Stop backend server
pm2 stop guest-blog-backend
```

### **Step 2: Restore Previous Version**

```bash
# Restore backup files
cp -r /path/to/backup/backend_TIMESTAMP/* /path/to/backend/

# Or remove new files
rm /path/to/backend/src/services/publisherSync.service.ts
rm /path/to/backend/src/services/scheduler.service.ts

# Restore previous versions of modified files
git checkout HEAD~1 backend/src/controllers/dataFinal.controller.ts
git checkout HEAD~1 backend/src/server.ts
```

### **Step 3: Rebuild and Restart**

```bash
cd /path/to/backend
npm run build
pm2 start guest-blog-backend
```

### **Step 4: Verify Rollback**

```bash
# Check logs - should NOT see scheduler messages
pm2 logs guest-blog-backend --lines 50

# Verify server is running normally
curl http://localhost:5000/health
```

---

## 📝 Summary

### **What This Deployment Adds:**

✅ **Automatic Publisher Sync** - Runs every 5 minutes  
✅ **Manual Sync on Push** - Syncs immediately when sites are pushed  
✅ **Retroactive Sync** - Updates all existing records  
✅ **Email-Based Matching** - Matches publishers by email  
✅ **Graceful Shutdown** - Stops cleanly on server restart  

### **Files to Deploy:**

- **2 New Files:** `publisherSync.service.ts`, `scheduler.service.ts`
- **2 Modified Files:** `dataFinal.controller.ts`, `server.ts`
- **0 Database Migrations:** Uses existing columns

### **Expected Outcome:**

- All sites with same email show same publisher
- Pushed Data module shows correct publisher info
- No "Not set" issues
- Automatic background sync every 5 minutes
- Manual sync on push operations

---

## 🎉 Deployment Complete!

After deployment:
1. Monitor logs for first 30 minutes
2. Verify sync is running every 5 minutes
3. Test push operation with multiple sites
4. Check Pushed Data module for correct publisher info
5. Monitor database for updated records

**Estimated Deployment Time:** 15-20 minutes  
**Downtime Required:** 2-5 minutes (during backend restart)

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verified By:** _____________  
**Status:** ☐ Success  ☐ Issues  ☐ Rolled Back
