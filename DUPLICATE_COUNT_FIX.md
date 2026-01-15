# Fix for Duplicate Count Issue

## Problem
Showing "Skipped: 5" when only 4 sites uploaded.
Breakdown: 3 in current tool + 1 in LM Tool + 1 same/higher price = 5 (wrong!)

## Root Cause
Backend is excluding `priceSkippedUrls` from both `duplicatesInCurrentSystem` and `duplicatesInMainProject`, then frontend adds `priceSkipped` as separate category, causing double-counting.

## Solution
Remove the exclusion of `priceSkippedUrls` from duplicate counts. Price-skipped domains should be included in their source counts (current tool or main project).

## Files to Change

### File: backend/src/controllers/upload.controller.ts

**Location 1: Around line 278-294**
Change:
```typescript
// Count duplicates by source - EXCLUDE price-skipped domains to avoid double counting
const priceUpdateUrls = new Set(priceUpdatedDomains.map(d => d.domain.toLowerCase()));
const priceSkippedUrls = new Set(priceSkippedDomains.map(d => d.domain.toLowerCase()));

// Main project duplicates: only count those NOT in priceSkipped (to avoid double counting)
const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => 
  d.source === 'Links Management App' && 
  !priceSkippedUrls.has(d.domain.toLowerCase()) &&
  !priceUpdateUrls.has(d.domain.toLowerCase())
).length;

// Current system duplicates: exclude price updates AND price-skipped
const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => 
  d.source.startsWith('Current System') && 
  !priceUpdateUrls.has(d.domain.toLowerCase()) &&
  !priceSkippedUrls.has(d.domain.toLowerCase())
).length;
```

To:
```typescript
// Count duplicates by source - EXCLUDE only price-updated domains
// Price-skipped domains should be included in their source counts
const priceUpdateUrls = new Set(priceUpdatedDomains.map(d => d.domain.toLowerCase()));

// Main project duplicates: exclude only price updates (include price-skipped)
const duplicatesInMainProject = duplicateDomainsWithSource.filter(d => 
  d.source === 'Links Management App' && 
  !priceUpdateUrls.has(d.domain.toLowerCase())
).length;

// Current system duplicates: exclude only price updates (include price-skipped)
const duplicatesInCurrentSystem = duplicateDomainsWithSource.filter(d => 
  d.source.startsWith('Current System') && 
  !priceUpdateUrls.has(d.domain.toLowerCase())
).length;
```

**There are 3 locations with this same pattern - search for "EXCLUDE price-skipped" and fix all 3:**
1. Line ~278-294 (first occurrence)
2. Line ~365-372 (second occurrence)
3. Line ~593-609 (third occurrence)

## Manual Fix Instructions
1. Open: `backend/src/controllers/upload.controller.ts`
2. Search for: `EXCLUDE price-skipped`
3. For each occurrence (3 total):
   - Remove line: `const priceSkippedUrls = new Set(...)`
   - Remove: `!priceSkippedUrls.has(d.domain.toLowerCase()) &&` from both filters
4. Save file
5. Restart backend: `npm run dev`
6. Test upload - should show "Skipped: 4" not "Skipped: 5"
