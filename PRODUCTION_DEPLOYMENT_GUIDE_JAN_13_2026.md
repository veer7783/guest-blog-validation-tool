# Production Deployment Guide - January 13, 2026

## 🚀 Latest Changes Summary (Jan 12-13, 2026)

This deployment includes:
- **CONTRIBUTOR Role Features** - Role-based access control with uploadedBy tracking
- **Upload Summary Double-Counting Fix** - Accurate skip count display
- **LI Base Price Field Support** - Full CSV upload and database support
- **Simplified CSV Template** - Single "Data CSV Template" button
- **Clean Production Code** - All debug logs removed

---

## 📋 All Changes Included

### **Day 1: CONTRIBUTOR Role Features (Jan 12, 2026)**

#### 1. **Role-Based Access Control**
- ✅ CONTRIBUTOR users can view GB Base Price and LI Base Price columns
- ✅ CONTRIBUTOR users can push data to pending module
- ✅ CONTRIBUTOR users can only see their own uploaded data
- ✅ Added `uploadedBy` field tracking across all modules

#### 2. **Price Comparison Logic**
- ✅ Main project price takes precedence for skipping
- ✅ If main project has lower price, CSV upload is skipped
- ✅ Enhanced price-based skip tracking with detailed reasons

#### 3. **Upload Summary Improvements**
- ✅ Display all skipped domains with specific reasons
- ✅ Show price comparison details (Current vs CSV price)
- ✅ Track duplicates without price

### **Day 2: Bug Fixes & Enhancements (Jan 13, 2026)**

#### 1. **Upload Summary Double-Counting Fix**
- ✅ Fixed issue where domains were counted in both "already in LM Tool" and "skipped due to price"
- ✅ Proper source mapping for `guest_blog_sites` and `pending_sites_pending`
- ✅ Exclude price-skipped domains from duplicate counts

#### 2. **LI Base Price Field Support**
- ✅ Added LI Base Price column to CSV upload
- ✅ Column mapping: `li_base_price`, `libaseprice`, `li_price`
- ✅ Database storage in `data_in_process` and `data_final` tables
- ✅ Updated CSV template with LI Base Price column

#### 3. **UI Simplification**
- ✅ Removed "Basic Template" and "With Price" buttons
- ✅ Single "Data CSV Template" button with all fields
- ✅ Removed Pro Tip message

---

## 📦 Files Changed

### **Backend (7 files)**

1. **`backend/src/controllers/upload.controller.ts`**
   - Added CONTRIBUTOR role support with uploadedBy tracking
   - Fixed double-counting in upload summary
   - Added main project price precedence logic
   - Added LI Base Price field support
   - Removed debug logs

2. **`backend/src/controllers/dataFinal.controller.ts`**
   - Added role-based filtering for CONTRIBUTOR users
   - Filter by uploadedBy field

3. **`backend/src/services/dataInProcess.service.ts`**
   - Added role-based filtering for CONTRIBUTOR users
   - Added liBasePrice field to bulkCreate method
   - Filter by uploadedBy field

4. **`backend/src/services/dataFinal.service.ts`**
   - Added role-based filtering for CONTRIBUTOR users
   - Filter by uploadedBy field

5. **`backend/src/routes/dataFinal.routes.ts`**
   - Updated push endpoint to allow CONTRIBUTOR role
   - Changed from `requireSuperAdmin` to `authenticate` middleware

6. **`backend/src/services/csvParser.service.ts`**
   - Added LI Base Price column mapping
   - Updated CSV template generation with LI Base Price
   - Parse and validate LI Base Price values

7. **`backend/src/types/upload.types.ts`**
   - Added `liBasePrice?: string` to CSVRow interface

### **Frontend (4 files)**

1. **`frontend/src/pages/UploadCSV.tsx`**
   - Display skipped domains with detailed reasons
   - Show price comparison details
   - Simplified template download (single button)
   - Removed Pro Tip message
   - Added LI Base Price to supported fields documentation

2. **`frontend/src/pages/DataManagement.tsx`**
   - Added GB Base Price and LI Base Price columns for CONTRIBUTOR role
   - Role-based column visibility

3. **`frontend/src/pages/DataFinal.tsx`**
   - Added GB Base Price and LI Base Price columns for CONTRIBUTOR role
   - Updated push functionality for CONTRIBUTOR role

4. **`frontend/src/components/Sidebar.tsx`**
   - Added "Pushed Data" menu item for CONTRIBUTOR role

---

## 🗄️ Database Changes

### **Required SQL Migration**

```sql
-- Add uploadedBy field to track who uploaded each record
ALTER TABLE `data_in_process` ADD COLUMN `uploadedBy` VARCHAR(191) NULL;
ALTER TABLE `data_final` ADD COLUMN `uploadedBy` VARCHAR(191) NULL;

-- Add indexes for better query performance
CREATE INDEX `idx_data_in_process_uploadedBy` ON `data_in_process`(`uploadedBy`);
CREATE INDEX `idx_data_final_uploadedBy` ON `data_final`(`uploadedBy`);
```

**Note:** The `liBasePrice` column already exists in the database schema, no migration needed.

---

## 🛠️ Production Build Instructions

### **Step 1: Build Backend**

```bash
cd backend
npm install
npm run build
```

**Output:** `backend/dist/` folder with compiled JavaScript

### **Step 2: Build Frontend**

```bash
cd frontend
npm install
npm run build
```

**Output:** `frontend/build/` folder with optimized production files

---

## 🚀 Production Deployment Steps

### **Pre-Deployment Checklist**

- [ ] Backup production database
- [ ] Backup current production files
- [ ] Review all file changes
- [ ] Test builds locally
- [ ] Verify environment variables

### **Step 1: Database Migration**

```bash
# Connect to production database
mysql -u your_username -p your_database_name

# Run the SQL migration
ALTER TABLE `data_in_process` ADD COLUMN `uploadedBy` VARCHAR(191) NULL;
ALTER TABLE `data_final` ADD COLUMN `uploadedBy` VARCHAR(191) NULL;
CREATE INDEX `idx_data_in_process_uploadedBy` ON `data_in_process`(`uploadedBy`);
CREATE INDEX `idx_data_final_uploadedBy` ON `data_final`(`uploadedBy`);

# Verify columns were added
DESCRIBE data_in_process;
DESCRIBE data_final;
```

### **Step 2: Deploy Backend**

```bash
# Stop backend server
pm2 stop guest-blog-backend  # or your process manager command

# Upload backend files to production server
# Option A: Upload entire backend/dist folder
# Option B: Upload only changed files (7 files listed above)

# If uploading specific files, upload to these locations:
backend/src/controllers/upload.controller.ts
backend/src/controllers/dataFinal.controller.ts
backend/src/services/dataInProcess.service.ts
backend/src/services/dataFinal.service.ts
backend/src/routes/dataFinal.routes.ts
backend/src/services/csvParser.service.ts
backend/src/types/upload.types.ts

# Rebuild on production server
cd /path/to/backend
npm install
npm run build

# Start backend server
pm2 start guest-blog-backend  # or your process manager command
pm2 logs guest-blog-backend   # Check logs for errors
```

### **Step 3: Deploy Frontend**

```bash
# Upload frontend build files to production server
# Upload the entire frontend/build folder

# If using specific files, upload to these locations:
frontend/src/pages/UploadCSV.tsx
frontend/src/pages/DataManagement.tsx
frontend/src/pages/DataFinal.tsx
frontend/src/components/Sidebar.tsx

# Rebuild on production server (if uploading source files)
cd /path/to/frontend
npm install
npm run build

# Copy build files to web server directory
cp -r build/* /var/www/html/guest-blog-validation/
# OR
cp -r build/* /path/to/your/web/root/

# If using Nginx, reload configuration
sudo nginx -t
sudo systemctl reload nginx

# If using Apache, restart service
sudo systemctl restart apache2
```

### **Step 4: Environment Variables**

Ensure these environment variables are set on production:

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://user:password@localhost:3306/guest_blog_validation"
JWT_SECRET=your_jwt_secret_here
MAIN_PROJECT_API_URL=https://your-main-project-url.com
MAIN_PROJECT_API_KEY=your_api_key_here
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

### **Step 5: Clear Cache**

```bash
# Clear browser cache
# Ask users to hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Clear server cache (if using Redis/Memcached)
redis-cli FLUSHALL  # if using Redis

# Clear PM2 logs
pm2 flush
```

---

## ✅ Post-Deployment Testing

### **Test 1: Database Migration**

```sql
-- Verify uploadedBy columns exist
SELECT uploadedBy FROM data_in_process LIMIT 1;
SELECT uploadedBy FROM data_final LIMIT 1;

-- Verify liBasePrice columns exist (should already exist)
SELECT liBasePrice FROM data_in_process LIMIT 1;
SELECT liBasePrice FROM data_final LIMIT 1;
```

### **Test 2: Backend API**

```bash
# Test health endpoint
curl https://your-backend-url.com/api/health

# Test authentication
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### **Test 3: CSV Upload**

1. **Login as SUPER_ADMIN**
2. **Download CSV Template** - Should show single "Data CSV Template" button
3. **Verify Template** - Should include columns:
   - Site
   - GB Base Price
   - LI Base Price (NEW)
   - Publisher
   - DA, DR, Traffic, SS, Keywords
   - Category, Country, Language, TAT

4. **Upload CSV with LI Base Price**
   ```csv
   Site,GB Base Price,LI Base Price,Publisher
   example.com,50,45,john@publisher.com
   example2.com,75,70,jane@publisher.com
   ```

5. **Verify Upload Summary**
   - Should show correct skip count (no double-counting)
   - Should display skipped domains with reasons
   - Should show price comparison details

6. **Check Database**
   ```sql
   SELECT websiteUrl, price, liBasePrice, uploadedBy 
   FROM data_in_process 
   ORDER BY createdAt DESC 
   LIMIT 5;
   ```

### **Test 4: CONTRIBUTOR Role**

1. **Login as CONTRIBUTOR user**
2. **Data Management Page**
   - Should see GB Base Price column
   - Should see LI Base Price column
   - Should only see own uploaded data

3. **Data Final Page**
   - Should see GB Base Price column
   - Should see LI Base Price column
   - Should see "Push" button

4. **Upload CSV as CONTRIBUTOR**
   - Upload should track uploadedBy field
   - Should only see own uploaded sites

5. **Push to Pending**
   - Should be able to push sites to pending module
   - Verify sites appear in Pushed Data page

### **Test 5: Upload Summary Double-Counting**

1. **Upload 4 domains** (all duplicates)
2. **Verify Summary Shows:**
   - Total Domains: 4
   - Skipped: 4 (NOT 5!)
   - Breakdown:
     - 3 already in current tool
     - 1 skipped due to price (example.com)

3. **Verify example.com is NOT counted twice**

---

## 🔍 Troubleshooting

### **Issue: Backend won't start**

```bash
# Check logs
pm2 logs guest-blog-backend

# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Port already in use - check PORT in .env
# 3. Missing dependencies - run npm install
```

### **Issue: Frontend shows old version**

```bash
# Hard refresh browser: Ctrl+Shift+R
# Clear browser cache
# Verify build files were copied correctly
ls -la /var/www/html/guest-blog-validation/
```

### **Issue: LI Base Price not saving**

```bash
# Verify database column exists
mysql -u user -p database_name
DESCRIBE data_in_process;

# Check backend logs for errors
pm2 logs guest-blog-backend

# Verify csvParser.service.ts was deployed
```

### **Issue: Double-counting still occurring**

```bash
# Verify upload.controller.ts was deployed with latest changes
# Check backend logs for duplicate count calculation
# Ensure source mapping includes guest_blog_sites and pending_sites_pending
```

### **Issue: CONTRIBUTOR can't see prices**

```bash
# Verify user role in database
SELECT id, email, role FROM users WHERE email = 'contributor@example.com';

# Verify DataManagement.tsx and DataFinal.tsx were deployed
# Check if columns are conditionally rendered based on role
```

---

## 📊 Monitoring

### **Key Metrics to Monitor**

1. **Upload Success Rate**
   ```sql
   SELECT 
     COUNT(*) as total_uploads,
     SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful,
     SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
   FROM data_upload_tasks
   WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
   ```

2. **CONTRIBUTOR Activity**
   ```sql
   SELECT 
     uploadedBy,
     COUNT(*) as records_uploaded
   FROM data_in_process
   WHERE uploadedBy IS NOT NULL
   GROUP BY uploadedBy;
   ```

3. **LI Base Price Usage**
   ```sql
   SELECT 
     COUNT(*) as total_records,
     SUM(CASE WHEN liBasePrice IS NOT NULL THEN 1 ELSE 0 END) as with_li_price,
     AVG(liBasePrice) as avg_li_price
   FROM data_in_process;
   ```

---

## 🔐 Security Notes

1. **uploadedBy Field**
   - Automatically populated from JWT token
   - Cannot be manipulated by users
   - Used for role-based filtering

2. **Role-Based Access**
   - CONTRIBUTOR can only see own data
   - SUPER_ADMIN and ADMIN see all data
   - Enforced at both backend and frontend levels

3. **API Endpoints**
   - Push endpoint now uses `authenticate` middleware
   - Validates user role before allowing push
   - Tracks who pushed which records

---

## 📝 Rollback Plan

If issues occur, follow these steps:

### **Step 1: Restore Database**

```bash
# Restore from backup
mysql -u user -p database_name < backup_file.sql

# Or remove new columns
ALTER TABLE data_in_process DROP COLUMN uploadedBy;
ALTER TABLE data_final DROP COLUMN uploadedBy;
```

### **Step 2: Restore Backend**

```bash
# Stop current version
pm2 stop guest-blog-backend

# Restore previous version files
cp -r /backup/backend/* /path/to/backend/

# Restart
pm2 start guest-blog-backend
```

### **Step 3: Restore Frontend**

```bash
# Restore previous build
cp -r /backup/frontend/build/* /var/www/html/guest-blog-validation/

# Reload web server
sudo systemctl reload nginx
```

---

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs guest-blog-backend`
- Review error messages in browser console (F12)
- Verify database schema matches requirements
- Ensure all environment variables are set correctly

---

## ✅ Deployment Checklist

- [ ] Database backup completed
- [ ] SQL migration executed successfully
- [ ] Backend files uploaded and built
- [ ] Frontend files uploaded and built
- [ ] Environment variables verified
- [ ] Backend server restarted
- [ ] Web server reloaded
- [ ] Cache cleared
- [ ] CSV template download tested
- [ ] CSV upload with LI Base Price tested
- [ ] Upload summary double-counting verified fixed
- [ ] CONTRIBUTOR role access tested
- [ ] Database records verified
- [ ] Monitoring metrics checked
- [ ] All tests passed

---

**Deployment Date:** January 13, 2026  
**Total Files Changed:** 11 files + 1 database migration  
**Estimated Deployment Time:** 30-45 minutes  
**Downtime Required:** 2-5 minutes (during backend restart)
