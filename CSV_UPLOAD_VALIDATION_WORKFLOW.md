# ✅ CSV Upload Validation Workflow

**Date:** November 18, 2025, 4:26 PM IST  
**Status:** ✅ **COMPLETED**

---

## 🎯 Complete Validation Sequence

The CSV upload process now follows a comprehensive validation workflow with multiple steps to ensure clean and accurate data.

---

## 📋 Validation Steps (In Order)

### Step 1: Domain Format Validation ✅
**What it does:**
- Validates each domain URL format
- Checks for proper URL structure
- Identifies invalid domains

**Result:**
- ✅ Valid domains → Proceed to next step
- ❌ Invalid domains → Marked as invalid, shown in error report

---

### Step 2: CSV Internal Duplicate Check ✅
**What it does:**
- Scans the uploaded CSV file for duplicate domains
- If the same domain appears multiple times in the file, keeps only the first occurrence

**Result:**
- ✅ Unique domains → Proceed to next step
- ⏭️ Duplicates within CSV → Skipped and reported

**Example:**
```
CSV contains:
1. example.com ✅ (kept)
2. test.com ✅ (kept)
3. example.com ⏭️ (skipped - duplicate in CSV)
4. demo.com ✅ (kept)
```

---

### Step 3: Main Project API Check ✅
**What it does:**
- Connects to Link Management App via API
- Checks if domain already exists in the main project database

**Possible Outcomes:**

#### ✅ API Connection Successful
- Domains found in main project → Skipped
- New domains → Proceed to next step

#### ❌ API Connection Failed
**Error Message:**
```
"Connection issue with Link Management App."
"Unable to verify duplicates against the main project. Please try again later or contact support."
```

**HTTP Status:** 503 Service Unavailable

**What happens:**
- Upload is **stopped**
- User must retry later
- No partial uploads allowed

---

### Step 4: Current Project Database Check ✅
**What it does:**
- Checks if domain exists in current project's database
- Searches in:
  - Data In Process table
  - Data Final table

**Result:**
- ✅ New domains → Proceed to next step
- ⏭️ Existing domains → Skipped and reported

---

### Step 5: User Assignment Requirement ✅
**What it does:**
- **REQUIRED:** Super Admin must assign the task to an Admin user before upload
- Cannot proceed without assignment

**UI:**
```
┌──────────────────────────────────────────────┐
│ Assign To Admin User *                       │
│ ┌──────────────────────────────────────────┐ │
│ │ -- Select an admin user --            ▼ │ │
│ └──────────────────────────────────────────┘ │
│ * Required: You must assign this task to an  │
│   admin user before uploading.               │
└──────────────────────────────────────────────┘
```

**Validation:**
- If no user selected → Error: "Please assign the task to an admin user before uploading"
- Upload button disabled until assignment is made

---

### Step 6: Final Upload ✅
**What it does:**
- Only after ALL validation steps pass
- Only after user assignment is complete
- Creates upload task
- Inserts valid, unique domains into Data In Process
- Generates comprehensive report

---

## 📊 Validation Results Display

### Success Summary
```
╔════════════════════════════════════════════╗
║         Upload Complete!                   ║
╠════════════════════════════════════════════╣
║ 📊 Total Domains: 100                      ║
║ ✅ New Domains: 75                         ║
║ ⏭️ Skipped (Duplicates): 20               ║
║    • 5 duplicate(s) within CSV file        ║
║    • 15 already exist in system/main       ║
║      project                               ║
║ ❌ Invalid Records: 5                      ║
╚════════════════════════════════════════════╝
```

### Detailed Error Display

#### Invalid Domains
```
❌ Invalid Records: 5
   invalid-url (Invalid URL format)
   not-a-domain (Missing protocol)
   bad@domain.com (Invalid characters)
   ...
```

#### Duplicate Domains
```
⏭️ Skipped (Duplicates): 20
   example.com (Links Management App)
   test.com (Current System - In Process)
   demo.com (Current System - Final)
   ...
```

#### CSV Internal Duplicates
```
• 5 duplicate(s) within CSV file
  duplicate1.com
  duplicate2.com
  ...
```

---

## 🔧 Technical Implementation

### Backend Changes

#### 1. User Assignment Validation (`upload.controller.ts`)
```typescript
// Validate that assignedTo is provided (required for Super Admin)
if (!req.body.assignedTo) {
  cleanupFile(filePath);
  res.status(400).json({
    success: false,
    error: { message: 'User assignment is required before uploading' }
  });
  return;
}
```

#### 2. Main Project API Error Handling
```typescript
try {
  duplicateCheck = await DuplicateCheckService.checkBulk(websiteUrls);
} catch (error: any) {
  // If Main Project API fails, return specific error
  if (error.message && error.message.includes('Main Project API')) {
    cleanupFile(filePath);
    res.status(503).json({
      success: false,
      error: { 
        message: 'Connection issue with Link Management App.',
        details: 'Unable to verify duplicates against the main project. Please try again later or contact support.'
      }
    });
    return;
  }
  throw error;
}
```

#### 3. CSV Internal Duplicate Detection
```typescript
// First, remove duplicates within the CSV file itself
const seenUrls = new Set<string>();
const uniqueRowsInCSV: typeof parsedData.validRows = [];
const duplicatesInCSV: string[] = [];

for (const row of parsedData.validRows) {
  const normalizedUrl = row.websiteUrl.toLowerCase();
  if (seenUrls.has(normalizedUrl)) {
    duplicatesInCSV.push(row.websiteUrl);
  } else {
    seenUrls.add(normalizedUrl);
    uniqueRowsInCSV.push(row);
  }
}
```

#### 4. Comprehensive Response
```typescript
res.status(201).json({
  success: true,
  message: 'CSV uploaded and processed successfully',
  data: {
    uploadTask,
    summary: {
      totalRows: parsedData.totalRows,
      validRows: parsedData.validCount,
      invalidRows: parsedData.invalidCount,
      uniqueRows: uniqueRows.length,
      duplicateRows: totalDuplicates,
      duplicatesInCSV: duplicatesInCSV.length,
      duplicatesInSystem: duplicateCheck.duplicateCount
    },
    invalidRows: parsedData.invalidRows,
    duplicateDomains: duplicateDomainsWithSource.map(d => d.domain),
    duplicateDetails: duplicateDomainsWithSource,
    csvDuplicates: duplicatesInCSV
  }
});
```

### Frontend Changes

#### 1. Required User Assignment (`UploadCSV.tsx`)
```typescript
const handleUpload = async () => {
  if (!selectedFile) {
    setError('Please select a file first');
    return;
  }

  if (!assignedTo) {
    setError('Please assign the task to an admin user before uploading');
    return;
  }
  
  // ... proceed with upload
};
```

#### 2. Enhanced Error Display
```typescript
catch (err: any) {
  const errorData = err.response?.data?.error;
  let errorMessage = 'Failed to upload file. Please try again.';
  
  if (errorData) {
    errorMessage = errorData.message;
    if (errorData.details) {
      errorMessage += ` ${errorData.details}`;
    }
  }
  
  setError(errorMessage);
}
```

#### 3. Detailed Results Display
```tsx
{uploadResult.summary.duplicatesInCSV && uploadResult.summary.duplicatesInCSV > 0 && (
  <Typography variant="caption">
    • {uploadResult.summary.duplicatesInCSV} duplicate(s) within CSV file
  </Typography>
)}

{uploadResult.summary.duplicatesInSystem && uploadResult.summary.duplicatesInSystem > 0 && (
  <Typography variant="caption">
    • {uploadResult.summary.duplicatesInSystem} already exist in system/main project
  </Typography>
)}
```

---

## 🔄 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Super Admin selects CSV file                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Super Admin assigns task to Admin user (REQUIRED)        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Click Upload → Backend receives file                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Validate domain formats                                   │
│    ✅ Valid → Continue                                       │
│    ❌ Invalid → Mark as error                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Check for duplicates within CSV                          │
│    ✅ Unique → Continue                                      │
│    ⏭️ Duplicate → Skip                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Check Main Project API                                    │
│    ✅ API OK + Not found → Continue                          │
│    ⏭️ API OK + Found → Skip                                  │
│    ❌ API Failed → STOP & Show error                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Check current project database                           │
│    ✅ Not found → Continue                                   │
│    ⏭️ Found → Skip                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Create upload task & insert valid domains                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Show comprehensive results                               │
│    • Total domains                                           │
│    • New domains (inserted)                                  │
│    • Duplicates (CSV + System)                              │
│    • Invalid records                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test 1: Valid Upload with Assignment
1. Select CSV with 100 domains
2. Assign to Admin user "John Doe"
3. Click Upload
4. **Expected:** Success with breakdown of results

### Test 2: Upload Without Assignment
1. Select CSV file
2. Don't select any admin user
3. Click Upload
4. **Expected:** Error "Please assign the task to an admin user before uploading"

### Test 3: CSV with Internal Duplicates
```csv
example.com
test.com
example.com  ← duplicate
demo.com
test.com     ← duplicate
```
**Expected:**
- Total: 5
- Unique: 3
- Duplicates in CSV: 2

### Test 4: Main Project API Failure
1. Stop Main Project API server
2. Upload CSV
3. **Expected:** Error "Connection issue with Link Management App."

### Test 5: Mixed Validation Results
```csv
valid-domain.com          ✅ New
existing-domain.com       ⏭️ Duplicate (Main Project)
invalid@url               ❌ Invalid format
another-valid.com         ✅ New
duplicate-in-csv.com      ✅ First occurrence
duplicate-in-csv.com      ⏭️ Duplicate in CSV
```

**Expected Summary:**
- Total: 6
- New: 2
- Duplicates: 2 (1 in CSV, 1 in system)
- Invalid: 1

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| **Domain Format Validation** | ✅ Implemented |
| **CSV Internal Duplicate Check** | ✅ Implemented |
| **Main Project API Check** | ✅ Implemented |
| **API Failure Handling** | ✅ Implemented |
| **Current DB Check** | ✅ Implemented |
| **User Assignment Required** | ✅ Implemented |
| **Comprehensive Error Display** | ✅ Implemented |
| **Detailed Results Breakdown** | ✅ Implemented |

---

## 🎉 Result

**Complete CSV upload validation workflow is now fully functional!**

✅ 6-step validation process  
✅ User assignment required  
✅ Main Project API error handling  
✅ CSV internal duplicate detection  
✅ Comprehensive error reporting  
✅ Detailed results display  
✅ All skipped/duplicate/invalid records visible  

**Ready to use!** 🚀
