# Production Deployment Guide - January 13, 2026 (Evening Session)

**Deployment Date:** January 13, 2026  
**Time:** Evening (5:30 PM - 6:30 PM IST)  
**Features:** Publisher Sync (5-min) + Editable Publisher Fields  
**Version:** v4.0

---

## 🎯 What We Built This Evening

### **Feature 1: Automatic Publisher Synchronization**
- Background scheduler runs every **5 minutes**
- Syncs publisher information across all sites with same email
- Updates both `data_in_process` and `data_final` tables
- Ensures Pushed Data shows correct publisher info

### **Feature 2: Editable Publisher Fields**
- SUPER_ADMIN can now **edit Publisher Name and Email** in existing edit dialogs
- **Real-time validation** when saving - checks email against main tool
- **Auto-converts to contact** if email doesn't match any publisher
- Works in both Data Management and Data Final pages

---

## 📦 Backend Files to Upload

### **New Files (2):**

```
✅ backend/dist/services/publisherSync.service.js
✅ backend/dist/services/scheduler.service.js
```

### **Modified Files (5):**

```
✅ backend/dist/controllers/dataInProcess.controller.js
✅ backend/dist/controllers/dataFinal.controller.js
✅ backend/dist/services/dataInProcess.service.js
✅ backend/dist/services/dataFinal.service.js
✅ backend/dist/server.js
```

### **Total Backend Files: 7**

---

## 📦 Frontend Files to Upload

### **Modified Files (2):**

```
✅ frontend/build/static/js/main.[hash].js (entire build folder)
   - DataManagement.tsx (Publisher fields now editable)
   - DataFinal.tsx (Publisher fields now editable)
```

### **Note:** Upload entire `frontend/build/` directory after running `npm run build`

---

## 🚀 Quick Deployment Steps

### **Step 1: Build Backend**

```bash
cd d:\guest-blog-validation-tool\backend
npm run build
```

### **Step 2: Build Frontend**

```bash
cd d:\guest-blog-validation-tool\frontend
npm run build
```

### **Step 3: Upload Backend Files to Production**

Upload these 7 files to `/home/datausehypwave/public_html/api/dist/`:

**New Files:**
- `services/publisherSync.service.js`
- `services/scheduler.service.js`

**Modified Files:**
- `controllers/dataInProcess.controller.js`
- `controllers/dataFinal.controller.js`
- `services/dataInProcess.service.js`
- `services/dataFinal.service.js`
- `server.js`

### **Step 4: Upload Frontend Files**

```bash
# Upload entire build directory
scp -r frontend/build/* user@server:/home/datausehypwave/public_html/
```

### **Step 5: Restart Backend Service**

```bash
# SSH to production server
ssh user@server

# Restart service
sudo systemctl restart datamanagement.service

# Check status
sudo systemctl status datamanagement.service

# Monitor logs
sudo journalctl -u datamanagement.service -f
```

---

## ✅ Verify Deployment

### **Check Logs for Scheduler:**

```
[Scheduler] Starting automatic publisher sync (every 5 minutes)...
[Scheduler] Publisher sync scheduler started successfully

========================================
[Scheduler] Running automatic publisher sync...
Time: 2026-01-13T13:00:00.000Z
[PublisherSync] Starting automatic sync for all existing records...
[PublisherSync] Found X unique emails to sync
[Scheduler] ✅ Sync completed: X records updated
========================================
```

### **Test Editable Publisher Fields:**

1. Login as SUPER_ADMIN
2. Go to Data Management or Data Final
3. Click **Edit** on any record
4. Verify **Publisher Name** and **Publisher Email** fields are **editable** (not grayed out)
5. Change email to test validation
6. Save and verify correct behavior

---

## 📋 What Changed in Each File

### **Backend Changes:**

#### **1. publisherSync.service.ts (NEW)**
- `syncPublishersByEmail()` - Fetches publishers from main tool and syncs
- `syncPublishersForRecords()` - Syncs specific records
- `syncAllExistingRecords()` - Syncs all unmatched records (runs every 5 min)

#### **2. scheduler.service.ts (NEW)**
- `startPublisherSync()` - Starts 5-minute interval timer
- `stopPublisherSync()` - Graceful shutdown
- `runPublisherSync()` - Executes sync and logs results

#### **3. dataInProcess.controller.ts (MODIFIED)**
- Added `PublisherSyncService` import
- Added sync call after direct import (line ~413)
- Added sync call after approval submission (line ~430)

#### **4. dataFinal.controller.ts (MODIFIED)**
- Added `PublisherSyncService` import
- Added sync call after direct import (line ~413)
- Added sync call after approval submission (line ~430)

#### **5. dataInProcess.service.ts (MODIFIED)**
- Added email validation in `update()` method (line ~190-218)
- Checks new email against main tool publishers
- Auto-converts to contact if not matched

#### **6. dataFinal.service.ts (MODIFIED)**
- Added email validation in `update()` method (line ~115-143)
- Updated `DataFinalUpdateRequest` interface (added 4 fields)
- Same validation logic as DataInProcess

#### **7. server.ts (MODIFIED)**
- Added `SchedulerService` import (line ~10)
- Starts scheduler on server startup (line ~112-113)
- Added graceful shutdown handlers (line ~116-127)

### **Frontend Changes:**

#### **1. DataManagement.tsx (MODIFIED)**
- Line ~1372: Made Publisher Name editable (removed `readOnly`)
- Line ~1380: Made Publisher Email editable (removed `readOnly`)
- Added `onChange` handlers for both fields

#### **2. DataFinal.tsx (MODIFIED)**
- Line ~1563: Made Publisher Name always editable for SUPER_ADMIN
- Line ~1573: Made Publisher Email always editable for SUPER_ADMIN
- Removed conditional readonly logic

---

## 🧪 Testing Checklist

### **Test 1: Automatic Sync (5 Minutes)**

- [ ] Backend starts successfully
- [ ] Scheduler logs appear in console
- [ ] First sync runs immediately
- [ ] Sync runs again after 5 minutes
- [ ] Check database - records updated

### **Test 2: Manual Sync on Push**

- [ ] Upload CSV with multiple sites (same email)
- [ ] Push one site to main tool
- [ ] Check logs for sync after push
- [ ] Verify all sites with same email synced
- [ ] Check Pushed Data - shows correct publisher

### **Test 3: Edit to Matched Email**

- [ ] Login as SUPER_ADMIN
- [ ] Edit a record
- [ ] Change email to existing publisher (e.g., `mehar@mehar.com`)
- [ ] Save changes
- [ ] Verify shows "Publisher matched from LM Tool"
- [ ] Verify `publisherMatched: true` in database

### **Test 4: Edit to Unmatched Email**

- [ ] Edit a record
- [ ] Change email to non-existent (e.g., `test@unknown.com`)
- [ ] Save changes
- [ ] Verify converts to contact
- [ ] Verify email in Contact Email field
- [ ] Verify `publisherMatched: false` in database

---

## 🗄️ Database Impact

**No migration required** - Uses existing columns:
- `publisherId`
- `publisherMatched`
- `publisherName`
- `publisherEmail`
- `contactEmail`
- `contactName`

---

## 🔧 Troubleshooting

### **Scheduler Not Starting:**

```bash
# Check logs
sudo journalctl -u datamanagement.service -f

# Verify files uploaded
ls -la /home/datausehypwave/public_html/api/dist/services/scheduler.service.js
ls -la /home/datausehypwave/public_html/api/dist/services/publisherSync.service.js

# Restart service
sudo systemctl restart datamanagement.service
```

### **Publisher Fields Not Editable:**

```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R

# Verify frontend build uploaded
ls -la /home/datausehypwave/public_html/static/js/

# Check browser console for errors
```

### **Email Validation Not Working:**

```bash
# Check backend logs
sudo journalctl -u datamanagement.service -f

# Verify service files uploaded
ls -la /home/datausehypwave/public_html/api/dist/services/dataInProcess.service.js
ls -la /home/datausehypwave/public_html/api/dist/services/dataFinal.service.js
```

---

## 🔄 Rollback (If Needed)

```bash
# Stop service
sudo systemctl stop datamanagement.service

# Restore backup files
cp -r /path/to/backup/backend/* /home/datausehypwave/public_html/api/
cp -r /path/to/backup/frontend/* /home/datausehypwave/public_html/

# Restart service
sudo systemctl start datamanagement.service
```

---

## 📊 Summary

### **What's New:**

✅ **Automatic Sync** - Every 5 minutes  
✅ **Manual Sync** - On push operations  
✅ **Editable Fields** - Publisher Name & Email  
✅ **Real-Time Validation** - Instant email check  
✅ **Auto-Conversion** - To contact if not matched  

### **Files Changed:**

- **Backend:** 2 new + 5 modified = **7 files**
- **Frontend:** 2 modified pages = **1 build folder**
- **Database:** 0 migrations

### **Deployment Time:**

- **Build:** 5 minutes
- **Upload:** 5 minutes
- **Restart:** 2 minutes
- **Total:** ~12 minutes

---

## 📝 Deployment Checklist

### **Before Deployment:**

- [ ] Backup database
- [ ] Backup current backend files
- [ ] Backup current frontend files

### **Build:**

- [ ] Build backend (`npm run build`)
- [ ] Build frontend (`npm run build`)

### **Upload Backend (7 files):**

- [ ] `services/publisherSync.service.js` (NEW)
- [ ] `services/scheduler.service.js` (NEW)
- [ ] `controllers/dataInProcess.controller.js`
- [ ] `controllers/dataFinal.controller.js`
- [ ] `services/dataInProcess.service.js`
- [ ] `services/dataFinal.service.js`
- [ ] `server.js`

### **Upload Frontend:**

- [ ] Upload entire `build/` directory

### **Restart:**

- [ ] Restart backend service
- [ ] Check logs for scheduler startup
- [ ] Verify no errors

### **Test:**

- [ ] Test automatic sync (wait 5 minutes)
- [ ] Test editable publisher fields
- [ ] Test email validation (matched)
- [ ] Test email validation (unmatched)
- [ ] Check Pushed Data module

---

## 🎉 Deployment Complete!

**Status:** ☐ Success  ☐ Issues  ☐ Rolled Back

**Deployed By:** _____________  
**Deployment Time:** _____________  
**Verified By:** _____________  

---

**Version:** v4.0 - Publisher Sync & Editable Fields  
**Session:** January 13, 2026 Evening  
**Duration:** 5:30 PM - 6:30 PM IST  
**Status:** Ready for Production ✨
