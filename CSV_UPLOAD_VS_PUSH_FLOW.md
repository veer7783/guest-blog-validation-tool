# 📋 CSV Upload vs Push to Main Project - Clear Explanation

## 🔍 Two Separate Operations

### 1. CSV Upload (CHECK ONLY) ✅
**What it does:** ONLY checks if domain exists  
**What it does NOT do:** Does NOT insert into main project

### 2. Push to Main Project (INSERT) ⏳
**What it does:** Actually inserts data into main project  
**When:** Later, after Admin fills all details and Super Admin adds pricing

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: CSV UPLOAD (CHECK ONLY - NO INSERT)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
    Super Admin uploads CSV with domains
                            ↓
    System calls Main Project API:
    POST /api/guest-sites-api/check-duplicates
    Body: { websiteUrls: ["example.com", "test.com"] }
                            ↓
    Main Project API responds:
    [
      { websiteUrl: "example.com", isDuplicate: true },
      { websiteUrl: "test.com", isDuplicate: false }
    ]
                            ↓
    System ONLY stores NEW domains in local "DataInProcess" table
    (Does NOT insert into main project database)
                            ↓
    Shows results:
    ✅ New Domains: 1 (test.com added to DataInProcess)
    ⏭️  Skipped: 1 (example.com already exists in main project)

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: ADMIN FILLS DETAILS (LOCAL ONLY)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
    Admin goes to "Data Management" page
                            ↓
    Fills in details for each domain:
    - Publisher Email
    - Publisher Name
    - Publisher Contact
    - DA (Domain Authority)
    - DR (Domain Rating)
    - Traffic
    - SS (Spam Score)
    - Category, Country, Language
    - TAT (Turnaround Time)
                            ↓
    Marks status as "REACHED"
                            ↓
    System auto-moves to "DataFinal" table (still local)
    (Still NOT in main project database)

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: SUPER ADMIN ADDS PRICING (LOCAL ONLY)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
    Super Admin goes to "Data Final" page
                            ↓
    Sees all domains with status = "REACHED"
                            ↓
    Adds pricing:
    - GB Base Price (Guest Blog)
    - LI Base Price (LinkedIn)
                            ↓
    Still in local "DataFinal" table
    (Still NOT in main project database)

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: PUSH TO MAIN PROJECT (ACTUAL INSERT)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
    Super Admin selects domains to push
                            ↓
    Clicks "Push to Main Project" button
                            ↓
    System calls Main Project API:
    POST /api/guest-sites-api/bulk-import
    Body: {
      sites: [
        {
          websiteUrl: "test.com",
          publisherEmail: "publisher@test.com",
          publisherName: "Test Publisher",
          da: 50,
          dr: 45,
          traffic: 10000,
          ss: 5,
          gbBasePrice: 100,
          liBasePrice: 150,
          category: "TECHNOLOGY",
          ...
        }
      ]
    }
                            ↓
    Main Project API inserts into guest_blog_sites table
                            ↓
    Returns results:
    {
      successCount: 1,
      failedCount: 0,
      results: [
        { success: true, mainProjectId: "xyz123" }
      ]
    }
                            ↓
    System moves successful records to "CompletedProcessData"
    (Now finally in main project database!)
```

---

## 🔍 CSV Upload - Detailed API Call

### What Happens During CSV Upload:

**Step 1: Upload CSV**
```
User uploads: domains.csv
Content:
Site
example.com
test.com
newsite.com
```

**Step 2: System Calls Main Project API (CHECK ONLY)**
```javascript
POST http://your-main-project.com/api/guest-sites-api/check-duplicates

Headers:
  Authorization: Basic <service-account-credentials>

Body:
{
  "websiteUrls": [
    "example.com",
    "test.com", 
    "newsite.com"
  ]
}
```

**Step 3: Main Project API Response**
```javascript
{
  "success": true,
  "data": [
    {
      "websiteUrl": "example.com",
      "isDuplicate": true,        // EXISTS in main project
      "existingId": "abc123"
    },
    {
      "websiteUrl": "test.com",
      "isDuplicate": true,        // EXISTS in main project
      "existingId": "def456"
    },
    {
      "websiteUrl": "newsite.com",
      "isDuplicate": false        // DOES NOT EXIST
    }
  ]
}
```

**Step 4: System Stores ONLY New Domains Locally**
```sql
-- Inserts into LOCAL database (validation tool)
INSERT INTO data_in_process (websiteUrl, uploadTaskId, status)
VALUES ('newsite.com', 'task123', 'PENDING');

-- Does NOT insert into main project database
-- example.com and test.com are skipped
```

**Step 5: Shows Results**
```
✅ Upload Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Domains:     3
✅ New Domains:       1  (newsite.com added to DataInProcess)
⏭️  Skipped (Exist):  2  (example.com, test.com already in main project)
```

---

## 🚀 Push to Main Project - Detailed API Call

### What Happens During Push:

**Step 1: Super Admin Selects Domains**
```
User selects domains in "Data Final" page
Clicks "Push to Main Project"
```

**Step 2: System Calls Main Project API (ACTUAL INSERT)**
```javascript
POST http://your-main-project.com/api/guest-sites-api/bulk-import

Headers:
  Authorization: Basic <service-account-credentials>

Body:
{
  "sites": [
    {
      "websiteUrl": "newsite.com",
      "category": "TECHNOLOGY",
      "language": "ENGLISH",
      "country": "USA",
      "daRange": "50-60",
      "linkType": "DOFOLLOW",
      "tat": "3-5 days",
      "publisherName": "John Doe",
      "publisherEmail": "john@newsite.com",
      "publisherContact": "+1234567890",
      "da": 55,
      "dr": 50,
      "traffic": 50000,
      "ss": 3,
      "gbBasePrice": 150,
      "liBasePrice": 200,
      "notes": "High quality tech blog"
    }
  ]
}
```

**Step 3: Main Project API Inserts into Database**
```sql
-- Main project database
INSERT INTO guest_blog_sites (
  website_url, category, language, country, 
  da, dr, traffic, spam_score,
  gb_base_price, li_base_price,
  publisher_name, publisher_email, publisher_contact,
  ...
) VALUES (
  'newsite.com', 'TECHNOLOGY', 'ENGLISH', 'USA',
  55, 50, 50000, 3,
  150, 200,
  'John Doe', 'john@newsite.com', '+1234567890',
  ...
);
```

**Step 4: Main Project API Response**
```javascript
{
  "success": true,
  "data": {
    "successCount": 1,
    "failedCount": 0,
    "results": [
      {
        "websiteUrl": "newsite.com",
        "success": true,
        "mainProjectId": "xyz789"  // ID in main project database
      }
    ]
  }
}
```

**Step 5: System Moves to CompletedProcessData**
```sql
-- Validation tool database
INSERT INTO completed_process_data (
  websiteUrl, mainProjectId, completedAt, completedBy, ...
) VALUES (
  'newsite.com', 'xyz789', NOW(), 'superadmin-id', ...
);

-- Delete from data_final
DELETE FROM data_final WHERE websiteUrl = 'newsite.com';
```

---

## 📊 Summary Table

| Stage | Action | Main Project DB | Local DB |
|-------|--------|-----------------|----------|
| **CSV Upload** | Check duplicates | ❌ NO INSERT<br>✅ Only READ | ✅ Insert new domains into DataInProcess |
| **Admin Fills Details** | Add publisher info, DA, DR, etc. | ❌ NO INSERT | ✅ Update DataInProcess |
| **Mark as Reached** | Change status | ❌ NO INSERT | ✅ Move to DataFinal |
| **Add Pricing** | Add GB/LI prices | ❌ NO INSERT | ✅ Update DataFinal |
| **Push to Main** | Bulk import | ✅ **INSERT HERE** | ✅ Move to CompletedProcessData |

---

## 🎯 Key Points

### CSV Upload (Step 1):
- ✅ **ONLY checks** if domain exists in main project
- ✅ Calls `/api/guest-sites-api/check-duplicates`
- ✅ **READ ONLY** operation on main project
- ✅ **NO INSERT** into main project database
- ✅ Only stores NEW domains in local DataInProcess table

### Push to Main Project (Step 4):
- ✅ **ACTUALLY inserts** data into main project
- ✅ Calls `/api/guest-sites-api/bulk-import`
- ✅ **WRITE** operation on main project
- ✅ **INSERTS** into main project guest_blog_sites table
- ✅ Happens ONLY when Super Admin clicks "Push to Main Project"

---

## 🔍 How to Verify

### After CSV Upload:
```sql
-- Check validation tool database
SELECT * FROM data_in_process WHERE websiteUrl = 'newsite.com';
-- Result: ✅ Found (stored locally)

-- Check main project database
SELECT * FROM guest_blog_sites WHERE website_url = 'newsite.com';
-- Result: ❌ Not Found (not inserted yet)
```

### After Push to Main Project:
```sql
-- Check validation tool database
SELECT * FROM completed_process_data WHERE websiteUrl = 'newsite.com';
-- Result: ✅ Found (moved from DataFinal)

-- Check main project database
SELECT * FROM guest_blog_sites WHERE website_url = 'newsite.com';
-- Result: ✅ Found (NOW inserted!)
```

---

## 🎉 Conclusion

**CSV Upload = CHECK ONLY (No Insert)**
- Just verifies if domain already exists
- Stores new domains locally for processing
- Does NOT touch main project database

**Push to Main Project = ACTUAL INSERT**
- Happens later after all details are filled
- Actually inserts into main project database
- Only when Super Admin explicitly clicks "Push"

**Your understanding is correct! CSV upload ONLY checks, does NOT insert into main project.** ✅
