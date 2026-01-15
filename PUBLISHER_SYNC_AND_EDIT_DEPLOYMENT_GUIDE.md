# Publisher Sync & Editable Publisher Fields - Production Deployment Guide

**Date:** January 13, 2026  
**Features:** Automatic Publisher Synchronization + Editable Publisher Fields  
**Version:** v4.0

---

## 📋 Overview

This deployment includes two major features:

### **1. Automatic Publisher Synchronization (5-Minute Scheduler)**
- Automatically syncs publisher information across all sites with the same email
- Runs every 5 minutes in the background
- Updates both `data_in_process` and `data_final` tables
- Ensures all sites show correct publisher information

### **2. Editable Publisher Fields with Real-Time Validation**
- SUPER_ADMIN can edit Publisher Name and Email in existing edit dialogs
- Real-time validation against main tool publishers when saving
- Auto-converts to contact if email doesn't match any publisher
- Immediate feedback without waiting for scheduled sync

---

## 🎯 Problem Solved

### **Before:**
- When Site A with `john@example.com` was pushed → Publisher created in main tool
- Sites B-J with same email still showed `publisherMatched: false` locally
- Pushed Data module showed "Not set" for Sites B-J
- No automatic sync across sites with same email
- Publisher fields were readonly - couldn't edit to fix mismatches

### **After:**
- When Site A is pushed → Publisher created in main tool
- **Automatic sync runs every 5 minutes** → All sites with `john@example.com` get updated
- All sites show `publisherMatched: true` with correct publisher ID
- Pushed Data shows correct publisher for all sites
- **SUPER_ADMIN can edit publisher email** → Instant validation and sync
- If email doesn't match → Automatically converts to contact

---

## 📦 Files Changed

### **New Files (3):**

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
   - Runs publisher sync every 5 minutes (300000ms)
   - Graceful start/stop
   - Status monitoring

3. **`frontend/src/components/EditPublisherDialog.tsx`** (NEW - Not Used)
   - Created but not integrated (using existing edit dialogs instead)
   - Can be deleted or kept for future use

4. **`frontend/src/api/dataManagement.api.ts`** (NEW - Not Used)
   - API methods for publisher updates
   - Can be deleted or kept for future use

### **Modified Files (8):**

#### **Backend:**

5. **`backend/src/controllers/dataInProcess.controller.ts`**
   - Added import for `PublisherSyncService`
   - Added sync call after direct import (manual push sync)
   - Added sync call after approval submission (manual push sync)

6. **`backend/src/routes/dataInProcess.routes.ts`**
   - No changes needed (using existing update route)

7. **`backend/src/controllers/dataFinal.controller.ts`**
   - Added import for `PublisherSyncService`
   - Added sync call after direct import (manual push sync)
   - Added sync call after approval submission (manual push sync)

8. **`backend/src/routes/dataFinal.routes.ts`**
   - No changes needed (using existing update route)

9. **`backend/src/server.ts`**
   - Added import for `SchedulerService`
   - Starts automatic sync on server startup
   - Added graceful shutdown handlers (SIGTERM, SIGINT)

10. **`backend/src/services/dataInProcess.service.ts`**
    - Added email validation logic in `update()` method
    - Checks new email against main tool publishers
    - Auto-converts to contact if not matched
    - Updates `publisherId`, `publisherMatched`, contact fields

11. **`backend/src/services/dataFinal.service.ts`**
    - Added email validation logic in `update()` method
    - Updated `DataFinalUpdateRequest` interface with missing fields:
      - `publisherId?: string`
      - `publisherMatched?: boolean`
      - `contactName?: string`
      - `contactEmail?: string`
    - Same validation logic as DataInProcess

#### **Frontend:**

12. **`frontend/src/pages/DataManagement.tsx`**
    - Made Publisher Name field editable (removed `readOnly`)
    - Made Publisher Email field editable (removed `readOnly`)
    - Added `onChange` handlers to update state

13. **`frontend/src/pages/DataFinal.tsx`**
    - Made Publisher Name field always editable for SUPER_ADMIN
    - Made Publisher Email field always editable for SUPER_ADMIN
    - Removed conditional readonly logic (was only editable for pending publishers)

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
# Backup production database (RECOMMENDED)
mysqldump -u user -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup current production files
cp -r /path/to/backend /path/to/backup/backend_$(date +%Y%m%d_%H%M%S)
cp -r /path/to/frontend/build /path/to/backup/frontend_$(date +%Y%m%d_%H%M%S)
```

### **Step 2: Build Backend**

```bash
cd /path/to/guest-blog-validation-tool/backend
npm run build
```

### **Step 3: Build Frontend**

```bash
cd /path/to/guest-blog-validation-tool/frontend
npm run build
```

### **Step 4: Upload Backend Files**

Upload these files to production `/api` directory:

#### **New Files:**
```
✅ dist/services/publisherSync.service.js
✅ dist/services/scheduler.service.js
```

#### **Modified Files:**
```
✅ dist/controllers/dataInProcess.controller.js
✅ dist/controllers/dataFinal.controller.js
✅ dist/services/dataInProcess.service.js
✅ dist/services/dataFinal.service.js
✅ dist/server.js
```

### **Step 5: Upload Frontend Files**

```bash
# Upload entire frontend build directory
scp -r frontend/build/* user@server:/path/to/frontend/
```

### **Step 6: Restart Backend Service**

```bash
# On production server
sudo systemctl restart datamanagement.service

# Check service status
sudo systemctl status datamanagement.service

# Monitor logs for scheduler startup
sudo journalctl -u datamanagement.service -f
```

### **Step 7: Verify Scheduler Started**

Look for these logs:
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
- [ ] Mark one site as "Publisher" in Data Final
- [ ] Push the site to the main tool
- [ ] Check logs for sync execution after push
- [ ] Verify all sites with same email are synced
- [ ] Check Pushed Data module - should show correct publisher

### **Test 4: Editable Publisher Fields**

#### **Test 4a: Edit to Matched Email**
- [ ] Login as SUPER_ADMIN
- [ ] Go to Data Management or Data Final
- [ ] Click Edit on a record
- [ ] Verify Publisher Name and Email fields are **editable** (not grayed out)
- [ ] Change email to one that EXISTS in main tool (e.g., `existing@publisher.com`)
- [ ] Click Save Changes
- [ ] Verify record shows as "Publisher matched from LM Tool"
- [ ] Verify `publisherId` is a real ID (not `pending_...`)
- [ ] Verify `publisherMatched: true`

#### **Test 4b: Edit to Unmatched Email**
- [ ] Click Edit on a record
- [ ] Change email to one that does NOT exist in main tool (e.g., `unknown@email.com`)
- [ ] Click Save Changes
- [ ] Verify record no longer shows "Publisher matched from LM Tool"
- [ ] Verify email moved to Contact Email field
- [ ] Verify name moved to Contact Name field
- [ ] Verify `publisherId: null`
- [ ] Verify `publisherMatched: false`

### **Test 5: Database Verification**

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
-- - publisherMatched = true for matched publishers
-- - publisherEmail populated for matched publishers
-- - contactEmail populated for unmatched contacts
```

### **Test 6: Pushed Data Module**

- [ ] Login to frontend
- [ ] Navigate to Pushed Data module
- [ ] Verify all pushed sites show correct publisher
- [ ] No "Not set" entries for sites with publishers

---

## 🔍 Monitoring

### **Check Scheduler Status**

```bash
# View real-time logs
sudo journalctl -u datamanagement.service -f

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
sudo journalctl -u datamanagement.service --since "24 hours ago" | grep "Scheduler"
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
ls -la /path/to/backend/dist/services/scheduler.service.js

# Rebuild and restart
cd /path/to/backend
npm run build
sudo systemctl restart datamanagement.service
```

### **Issue: Sync Not Updating Records**

**Symptoms:**
- Scheduler runs but 0 records synced
- Records still show pending IDs

**Solution:**
```bash
# Check if publishers exist in main tool
# Verify main tool API connection
curl -X GET https://data.usehypwave.com/api/publishers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check backend logs for errors
sudo journalctl -u datamanagement.service --since "1 hour ago" | grep "PublisherSync"

# Manually trigger sync by restarting server
sudo systemctl restart datamanagement.service
```

### **Issue: Publisher Fields Not Editable**

**Symptoms:**
- Publisher Name/Email fields are grayed out
- Cannot type in fields

**Solution:**
```bash
# Verify frontend build includes latest changes
# Check DataManagement.tsx and DataFinal.tsx were rebuilt
ls -la /path/to/frontend/build/static/js/

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Rebuild frontend
cd /path/to/frontend
npm run build
# Upload new build files
```

### **Issue: Email Validation Not Working**

**Symptoms:**
- Changed email but still shows as matched
- Email doesn't convert to contact

**Solution:**
```bash
# Check backend logs for validation errors
sudo journalctl -u datamanagement.service -f

# Verify dataInProcess.service.js and dataFinal.service.js were uploaded
ls -la /path/to/backend/dist/services/data*.service.js

# Restart backend
sudo systemctl restart datamanagement.service
```

---

## 🔄 Rollback Plan

If issues occur, follow these steps:

### **Step 1: Stop Scheduler**

```bash
# Stop backend server
sudo systemctl stop datamanagement.service
```

### **Step 2: Restore Previous Version**

```bash
# Restore backup files
cp -r /path/to/backup/backend_TIMESTAMP/* /path/to/backend/
cp -r /path/to/backup/frontend_TIMESTAMP/* /path/to/frontend/build/

# Or remove new files
rm /path/to/backend/dist/services/publisherSync.service.js
rm /path/to/backend/dist/services/scheduler.service.js

# Restore previous versions of modified files from git
cd /path/to/backend
git checkout HEAD~1 dist/controllers/dataInProcess.controller.js
git checkout HEAD~1 dist/controllers/dataFinal.controller.js
git checkout HEAD~1 dist/services/dataInProcess.service.js
git checkout HEAD~1 dist/services/dataFinal.service.js
git checkout HEAD~1 dist/server.js
```

### **Step 3: Restart Service**

```bash
sudo systemctl start datamanagement.service

# Verify server is running normally
sudo systemctl status datamanagement.service

# Check logs - should NOT see scheduler messages
sudo journalctl -u datamanagement.service -f
```

### **Step 4: Verify Rollback**

```bash
# Verify server is running normally
curl http://localhost:5000/health

# Check that scheduler is not running
# Should NOT see "[Scheduler]" messages in logs
```

---

## 📊 Performance Metrics

### **Expected Performance:**

- **Sync Duration:** 2-10 seconds (depends on number of records)
- **Memory Usage:** +10-20MB during sync
- **CPU Usage:** Minimal spike during sync
- **Database Queries:** 2-4 queries per sync cycle
- **Sync Interval:** Every 5 minutes (300000 milliseconds)

### **Optimization Tips:**

1. **Reduce Sync Frequency** if needed:
   - Change from 5 minutes to 10 minutes
   - Edit `scheduler.service.ts`: `300000` → `600000`

2. **Add Indexes** for better performance:
   ```sql
   CREATE INDEX idx_data_in_process_email ON data_in_process(publisherEmail, contactEmail);
   CREATE INDEX idx_data_final_email ON data_final(publisherEmail, contactEmail);
   CREATE INDEX idx_data_in_process_matched ON data_in_process(publisherMatched);
   CREATE INDEX idx_data_final_matched ON data_final(publisherMatched);
   ```

3. **Monitor Main Tool API**:
   - Ensure main tool API is responsive
   - Check for rate limiting
   - Verify publisher list is up to date

---

## 📝 Summary

### **What This Deployment Adds:**

✅ **Automatic Publisher Sync** - Runs every 5 minutes  
✅ **Manual Sync on Push** - Syncs immediately when sites are pushed  
✅ **Retroactive Sync** - Updates all existing records  
✅ **Email-Based Matching** - Matches publishers by email  
✅ **Graceful Shutdown** - Stops cleanly on server restart  
✅ **Editable Publisher Fields** - SUPER_ADMIN can edit name/email  
✅ **Real-Time Validation** - Validates email against main tool instantly  
✅ **Auto-Conversion** - Converts to contact if email not matched  

### **Files to Deploy:**

#### **Backend:**
- **2 New Files:** `publisherSync.service.js`, `scheduler.service.js`
- **5 Modified Files:** `dataInProcess.controller.js`, `dataFinal.controller.js`, `dataInProcess.service.js`, `dataFinal.service.js`, `server.js`

#### **Frontend:**
- **2 Modified Files:** `DataManagement.tsx`, `DataFinal.tsx`
- **2 New Files (Not Used):** `EditPublisherDialog.tsx`, `dataManagement.api.ts` (can be deleted)

### **Database Changes:**
- **0 Migrations:** Uses existing columns

### **Expected Outcome:**

- All sites with same email show same publisher
- Pushed Data module shows correct publisher info
- No "Not set" issues
- Automatic background sync every 5 minutes
- Manual sync on push operations
- SUPER_ADMIN can edit publisher fields
- Instant validation and conversion

---

## 🎉 Deployment Complete!

After deployment:
1. Monitor logs for first 30 minutes
2. Verify sync is running every 5 minutes
3. Test push operation with multiple sites
4. Test editing publisher fields with match/unmatch scenarios
5. Check Pushed Data module for correct publisher info
6. Monitor database for updated records

**Estimated Deployment Time:** 15-20 minutes  
**Downtime Required:** 2-5 minutes (during backend restart)

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verified By:** _____________  
**Status:** ☐ Success  ☐ Issues  ☐ Rolled Back

---

## 📞 Support

If deployment issues occur:
1. Check service logs: `sudo journalctl -u datamanagement.service -f`
2. Check database connection
3. Verify all files uploaded correctly
4. Ensure scheduler is starting properly
5. Test email validation logic
6. Monitor sync performance

---

**Version:** v4.0 - Publisher Sync & Editable Fields  
**Release Date:** January 13, 2026  
**Status:** Ready for Production ✨
