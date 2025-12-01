# 🐛 Main Project API Duplicate Check Issue

**Date:** November 18, 2025, 4:52 PM IST  
**Status:** ⚠️ **CRITICAL BUG FOUND IN MAIN PROJECT API**

---

## 🔍 Issue Summary

The Main Project's `/api/guest-sites-api/check-duplicates` endpoint is **NOT working correctly**. It fails to detect existing domains in the database, returning all domains as "new" even when they already exist.

---

## 📊 Evidence

### Database State
```
Table: guest_blog_sites
Record exists: https://techcrunch.com/
ID: cmnssckd0001klcupqhf
Status: ACTIVE
```

### API Response (WRONG)
```json
{
  "success": true,
  "data": {
    "total": 5,
    "existing": 0,           ❌ Should be 1 or more
    "new": 5,                ❌ Should be less
    "existingDomains": [],   ❌ Should include techcrunch.com
    "newDomains": [
      "https://techcrunch.com",
      "https://techcrunch.com",
      ...
    ],
    "existingSites": []      ❌ Should include the existing site
  }
}
```

### Test Results
All URL variations tested:
- ❌ `techcrunch.com` → NOT FOUND
- ❌ `https://techcrunch.com` → NOT FOUND
- ❌ `https://techcrunch.com/` → NOT FOUND
- ❌ `http://techcrunch.com` → NOT FOUND
- ❌ `www.techcrunch.com` → NOT FOUND

**All variations returned as NEW, even though the domain EXISTS in the database!**

---

## 🎯 Root Cause

The Main Project API's duplicate check logic is broken. Possible causes:
1. **URL normalization not working** - Not properly removing protocols, www, trailing slashes
2. **Database query issue** - Not querying the correct table or using wrong WHERE clause
3. **Case sensitivity** - Not doing case-insensitive comparison
4. **Missing logic** - The endpoint might not be fully implemented

---

## ✅ Workarounds Implemented

### Workaround 1: Send Multiple URL Variations
**File:** `backend/src/services/mainProjectAPI.service.ts`

```typescript
// Send multiple variations of each URL to increase chance of match
const urlVariations: string[] = [];
for (const url of normalizedUrls) {
  urlVariations.push(url);                    // techcrunch.com
  urlVariations.push(`https://${url}`);       // https://techcrunch.com
  urlVariations.push(`https://${url}/`);      // https://techcrunch.com/
  urlVariations.push(`http://${url}`);        // http://techcrunch.com
  urlVariations.push(`www.${url}`);           // www.techcrunch.com
}
```

**Status:** ⚠️ **Still doesn't work** - API returns all as new

### Workaround 2: Direct Database Check (Recommended)
**File:** `backend/src/services/mainProjectDB.service.ts` (Created)

Direct MySQL connection to Main Project database to check duplicates, bypassing the broken API.

**Status:** ✅ **Ready to implement** - Requires:
1. Install `mysql2` package
2. Configure database credentials in `.env`
3. Update `duplicateCheck.service.ts` to use DB fallback

---

## 🔧 Solution Options

### Option A: Fix Main Project API (Best Long-term)
**Recommended for Main Project team**

Fix the `/api/guest-sites-api/check-duplicates` endpoint to:
1. Properly normalize URLs before comparison
2. Use case-insensitive matching
3. Check all URL variations
4. Return correct `existingDomains` and `existingSites`

**Example fix in Main Project:**
```typescript
// Normalize URL function
function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

// In duplicate check endpoint
const normalizedInput = domains.map(normalizeUrl);
const existingSites = await db.query(`
  SELECT * FROM guest_blog_sites 
  WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(site_url, 'https://', ''), 'http://', ''), 'www.', ''), '/', ''))
  IN (${normalizedInput.map(() => '?').join(',')})
`, normalizedInput);
```

### Option B: Use Direct Database Check (Quick Fix)
**Implemented in Validation Tool**

1. Install mysql2:
```bash
cd backend
npm install mysql2
```

2. Add to `.env`:
```env
# Main Project Database (for direct duplicate check)
MAIN_PROJECT_DB_HOST=localhost
MAIN_PROJECT_DB_PORT=3306
MAIN_PROJECT_DB_USER=root
MAIN_PROJECT_DB_PASSWORD=your_password
MAIN_PROJECT_DB_NAME=links_guest_blog_sites
```

3. Update `duplicateCheck.service.ts`:
```typescript
// Try API first, fallback to direct DB check
try {
  return await MainProjectAPIService.checkDuplicates(urls);
} catch (apiError) {
  console.warn('Main Project API failed, using direct DB check');
  return await MainProjectDBService.checkDuplicates(urls);
}
```

---

## 🧪 Testing After Fix

### Test 1: Upload techcrunch.com
```csv
site,category
techcrunch.com,Technology
```

**Expected Result:**
```
⏭️ Skipped (Duplicates): 1
   • 1 already exist in system/main project
   
Duplicate: techcrunch.com (Links Management App)
```

### Test 2: Check API Response
```bash
powershell -File test-techcrunch.ps1
```

**Expected:**
```
✅ techcrunch.com EXISTS - Should be SKIPPED
Existing Domains: techcrunch.com
Existing Sites: [{ id: '...', site_url: 'https://techcrunch.com/' }]
```

---

## 📋 Action Items

### For Main Project Team:
- [ ] Fix `/api/guest-sites-api/check-duplicates` endpoint
- [ ] Add proper URL normalization
- [ ] Add unit tests for duplicate detection
- [ ] Test with various URL formats

### For Validation Tool:
- [x] Identify the issue
- [x] Create workaround (send multiple variations)
- [x] Create direct DB check service
- [ ] Install mysql2 package
- [ ] Configure DB credentials
- [ ] Implement DB fallback
- [ ] Test with real data

---

## 🎯 Impact

### Current State (Broken):
- ❌ Duplicate domains can be added to system
- ❌ Data integrity compromised
- ❌ techcrunch.com (and others) can be added multiple times
- ❌ Validation workflow not working as intended

### After Fix:
- ✅ Duplicates properly detected
- ✅ Data integrity maintained
- ✅ techcrunch.com correctly identified as duplicate
- ✅ Validation workflow works correctly

---

## 📞 Next Steps

**Immediate (Validation Tool):**
1. Install mysql2: `npm install mysql2`
2. Configure Main Project DB credentials
3. Enable direct DB check fallback
4. Test with techcrunch.com

**Long-term (Main Project):**
1. Fix the API endpoint
2. Add comprehensive tests
3. Document URL normalization logic
4. Remove need for direct DB access

---

## ✅ Conclusion

**The issue is in the Main Project API, not the Validation Tool.**

The Validation Tool is correctly:
- ✅ Calling the API
- ✅ Sending proper requests
- ✅ Handling responses

But the Main Project API is incorrectly:
- ❌ Not detecting existing domains
- ❌ Returning all domains as "new"
- ❌ Not normalizing URLs properly

**Workaround:** Direct database check bypasses the broken API and provides accurate duplicate detection.
