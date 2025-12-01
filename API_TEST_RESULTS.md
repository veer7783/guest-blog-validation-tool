# 🧪 Main Project API Test Results

**Test Date:** November 18, 2025, 11:44 AM IST  
**Endpoint:** `POST /api/guest-sites-api/check-duplicates`  
**API URL:** `http://localhost:3001/api/guest-sites-api`

---

## 📊 Test Results

### Status: ⚠️ PARTIALLY WORKING

| Check | Status | Details |
|-------|--------|---------|
| **Server Running** | ✅ YES | Main project server is running on port 3001 |
| **Endpoint Exists** | ✅ YES | The `/check-duplicates` endpoint exists |
| **Authentication** | ❌ FAILED | Returned 401 Unauthorized |
| **Response** | ❌ N/A | Could not get response due to auth failure |

---

## 🔍 What We Found

### ✅ Good News:
1. **Main project server is running** on `http://localhost:3001`
2. **The endpoint exists** - `/api/guest-sites-api/check-duplicates`
3. **Server is responding** - Not a connection error

### ❌ Issue:
**Authentication Failed (401 Unauthorized)**

This means one of the following:
1. Service account credentials are incorrect
2. Main project doesn't use Basic Auth
3. Main project uses a different authentication method (API Key, JWT, etc.)
4. Service account doesn't have permission

---

## 🔧 How to Fix

### Option 1: Verify Credentials
Check your `backend/.env` file:
```env
MAIN_PROJECT_API_URL=http://localhost:3001/api/guest-sites-api
MAIN_PROJECT_SERVICE_EMAIL=validation-service@usehypwave.com
MAIN_PROJECT_SERVICE_PASSWORD=3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928
```

**Action:** Verify these credentials with the main project admin.

### Option 2: Check Authentication Method
The validation tool currently uses **Basic Authentication**:
```javascript
auth: {
  username: SERVICE_EMAIL,
  password: SERVICE_PASSWORD
}
```

**Question:** Does your main project use Basic Auth or something else?

Common alternatives:
- **API Key in Header:** `X-API-Key: your-api-key`
- **Bearer Token:** `Authorization: Bearer your-token`
- **Custom Auth Header:** `X-Service-Token: your-token`

### Option 3: Check Main Project API Documentation
Look for:
1. How to authenticate service accounts
2. Required headers
3. Example requests

---

## 🧪 Manual Test Commands

### Test 1: Check if server is running
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method Get
```

### Test 2: Test with Basic Auth (current method)
```powershell
$body = @{ websiteUrls = @("example.com") } | ConvertTo-Json
$securePassword = ConvertTo-SecureString "3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential("validation-service@usehypwave.com", $securePassword)
Invoke-RestMethod -Uri "http://localhost:3001/api/guest-sites-api/check-duplicates" -Method Post -Body $body -ContentType "application/json" -Credential $credential
```

### Test 3: Test with API Key (if main project uses this)
```powershell
$body = @{ websiteUrls = @("example.com") } | ConvertTo-Json
$headers = @{ "X-API-Key" = "your-api-key-here" }
Invoke-RestMethod -Uri "http://localhost:3001/api/guest-sites-api/check-duplicates" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

### Test 4: Test with Bearer Token (if main project uses this)
```powershell
$body = @{ websiteUrls = @("example.com") } | ConvertTo-Json
$headers = @{ "Authorization" = "Bearer your-token-here" }
Invoke-RestMethod -Uri "http://localhost:3001/api/guest-sites-api/check-duplicates" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

## 📝 Next Steps

### Step 1: Find Out Authentication Method
**Ask the main project team:**
- What authentication method does `/api/guest-sites-api/check-duplicates` use?
- What are the correct credentials for the validation service?
- Can you provide a working example request?

### Step 2: Update Validation Tool
Once you know the correct auth method, update:
- `backend/src/services/mainProjectAPI.service.ts`
- `backend/.env` (add correct credentials/API keys)

### Step 3: Test Again
Run the test script again:
```powershell
powershell -ExecutionPolicy Bypass -File test-api-simple.ps1
```

---

## 🔍 Current Implementation

### File: `backend/src/services/mainProjectAPI.service.ts`

```typescript
private static getAxiosInstance(): AxiosInstance {
  if (!this.axiosInstance) {
    this.axiosInstance = axios.create({
      baseURL: process.env.MAIN_PROJECT_API_URL || 'http://localhost:3000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      // Add service account credentials
      config.auth = {
        username: process.env.MAIN_PROJECT_SERVICE_EMAIL || 'validation-service@usehypwave.com',
        password: process.env.MAIN_PROJECT_SERVICE_PASSWORD || '3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928'
      };
      return config;
    });
  }

  return this.axiosInstance;
}
```

**This uses Basic Authentication. If main project uses a different method, we need to update this.**

---

## 💡 Temporary Workaround

If you can't fix the authentication right now, the validation tool will still work:

**What happens when auth fails:**
```typescript
catch (error: any) {
  console.error('Main project duplicate check error:', error.message);
  // If main project is down, return all as not duplicate
  return websiteUrls.map(url => ({
    websiteUrl: normalizeDomain(url),
    isDuplicate: false
  }));
}
```

**Result:** All domains will be marked as "new" (not duplicate), which means:
- ✅ You can still upload CSVs
- ✅ All domains will be added to DataInProcess
- ❌ But duplicate checking won't work
- ❌ You might add domains that already exist in main project

---

## 🎯 Summary

| Item | Status |
|------|--------|
| **Main Project Server** | ✅ Running |
| **API Endpoint** | ✅ Exists |
| **Authentication** | ❌ Failed (401) |
| **Duplicate Check** | ❌ Not Working |
| **CSV Upload** | ⚠️ Works but no duplicate check |

**Action Required:** Fix authentication credentials or method to enable duplicate checking.

---

## 📞 Questions to Ask Main Project Team

1. What authentication method does the API use?
2. What are the correct service account credentials?
3. Can you provide a working curl/Postman example?
4. Is there API documentation available?
5. Does the service account have the required permissions?
