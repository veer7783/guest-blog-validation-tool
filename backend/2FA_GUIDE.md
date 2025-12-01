# 🔐 Two-Factor Authentication (2FA) Guide

## Overview

This guide explains how to implement and test the Two-Factor Authentication (2FA) system using TOTP (Time-based One-Time Password) with authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator.

## 🎯 Features

- ✅ **TOTP-based 2FA** - Time-based One-Time Passwords
- ✅ **QR Code Generation** - Easy setup with authenticator apps
- ✅ **Backup Codes** - 10 one-time use backup codes
- ✅ **Backup Code Regeneration** - Generate new backup codes anytime
- ✅ **2FA Login Flow** - Secure two-step login process
- ✅ **Activity Logging** - All 2FA actions are logged

## 📋 API Endpoints

### 1. Get 2FA Status
Check if 2FA is enabled for the current user.

```http
GET /api/2fa/status
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isEnabled": false,
    "hasBackupCodes": false,
    "backupCodesRemaining": 0
  }
}
```

---

### 2. Setup 2FA
Initiate 2FA setup - generates secret and QR code.

```http
POST /api/2fa/setup
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "2FA setup initiated. Please scan the QR code and verify with your authenticator app.",
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "backupCodes": [
      "A1B2C3D4",
      "E5F6G7H8",
      "I9J0K1L2",
      "M3N4O5P6",
      "Q7R8S9T0",
      "U1V2W3X4",
      "Y5Z6A7B8",
      "C9D0E1F2",
      "G3H4I5J6",
      "K7L8M9N0"
    ]
  }
}
```

**Important:** 
- Save the backup codes securely
- Scan the QR code with your authenticator app
- The QR code is a base64-encoded PNG image

---

### 3. Enable 2FA
Verify and activate 2FA with a code from your authenticator app.

```http
POST /api/2fa/enable
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

---

### 4. Disable 2FA
Disable 2FA (requires password and 2FA code).

```http
POST /api/2fa/disable
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "password": "Admin@123",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

### 5. Verify Backup Code
Test if a backup code is valid.

```http
POST /api/2fa/verify-backup-code
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "backupCode": "A1B2C3D4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup code verified successfully"
}
```

**Note:** This endpoint consumes the backup code, so it can only be used once.

---

### 6. Regenerate Backup Codes
Generate new backup codes (requires password).

```http
POST /api/2fa/regenerate-backup-codes
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup codes regenerated successfully",
  "data": {
    "backupCodes": [
      "N1O2P3Q4",
      "R5S6T7U8",
      "V9W0X1Y2",
      "Z3A4B5C6",
      "D7E8F9G0",
      "H1I2J3K4",
      "L5M6N7O8",
      "P9Q0R1S2",
      "T3U4V5W6",
      "X7Y8Z9A0"
    ]
  }
}
```

---

## 🔄 2FA Login Flow

### Step 1: Initial Login (without 2FA code)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@guestblog.com",
  "password": "Admin@123"
}
```

**Response (if 2FA is enabled):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "requiresTwoFactor": true,
    "userId": "0486a64d-8183-4baa-b89d-cb032e262e77"
  }
}
```

### Step 2: Login with 2FA Code
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@guestblog.com",
  "password": "Admin@123",
  "twoFactorCode": "123456"
}
```

**Response (successful):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "0486a64d-8183-4baa-b89d-cb032e262e77",
      "email": "superadmin@guestblog.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "isActive": true
    }
  }
}
```

### Alternative: Login with Backup Code
If you don't have access to your authenticator app, use a backup code:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@guestblog.com",
  "password": "Admin@123",
  "twoFactorCode": "A1B2C3D4"
}
```

**Note:** Backup codes can only be used once and are automatically removed after use.

---

## 🧪 Testing 2FA Flow (PowerShell)

### Complete 2FA Setup and Test

```powershell
# 1. Login and get token
$loginBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $loginBody

$token = $loginResponse.data.token
$headers = @{ Authorization = "Bearer $token" }

# 2. Check 2FA status
Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/status" `
    -Method Get -Headers $headers | ConvertTo-Json

# 3. Setup 2FA
$setupResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/setup" `
    -Method Post -Headers $headers

# Display QR code URL and backup codes
Write-Host "QR Code URL (base64): $($setupResponse.data.qrCodeUrl.Substring(0, 50))..."
Write-Host "`nBackup Codes:"
$setupResponse.data.backupCodes | ForEach-Object { Write-Host "  $_" }

# Save backup codes to file
$setupResponse.data.backupCodes | Out-File -FilePath "backup_codes.txt"
Write-Host "`nBackup codes saved to backup_codes.txt"

# 4. Scan QR code with authenticator app and get the 6-digit code
# Then enable 2FA with the code:
$enableBody = @{
    code = "123456"  # Replace with actual code from authenticator app
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/enable" `
    -Method Post -Headers $headers -ContentType "application/json" -Body $enableBody

# 5. Verify 2FA is enabled
Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/status" `
    -Method Get -Headers $headers | ConvertTo-Json

# 6. Test login with 2FA
$login2faBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
    twoFactorCode = "123456"  # Replace with current code from authenticator app
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $login2faBody | ConvertTo-Json
```

---

## 📱 Authenticator Apps

### Recommended Apps:
- **Google Authenticator** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (with TOTP support)
- **Bitwarden** (with TOTP support)

### How to Setup:
1. Open your authenticator app
2. Tap "Add Account" or "+"
3. Scan the QR code from the `/api/2fa/setup` response
4. Enter the 6-digit code to enable 2FA

---

## 🔒 Security Best Practices

### For Users:
1. **Save Backup Codes** - Store them securely offline
2. **Use Multiple Devices** - Add the same account to multiple authenticator apps
3. **Test Before Logging Out** - Verify 2FA works before logging out
4. **Regenerate Backup Codes** - If you suspect they're compromised

### For Developers:
1. **Rate Limiting** - Already implemented on auth endpoints
2. **Activity Logging** - All 2FA actions are logged
3. **Backup Codes** - One-time use, automatically removed
4. **Time Window** - TOTP codes valid for ±2 time steps (60 seconds)

---

## 🐛 Troubleshooting

### "Invalid verification code" Error
- **Cause:** Time sync issue or wrong code
- **Solution:** 
  - Ensure device time is synced
  - Wait for next code (codes change every 30 seconds)
  - Try backup code if available

### "2FA is already enabled" Error
- **Cause:** Trying to setup when already enabled
- **Solution:** Disable 2FA first, then setup again

### Lost Authenticator App
- **Solution:** Use backup codes to login
- **Prevention:** Save backup codes securely

### All Backup Codes Used
- **Solution:** Login with authenticator app and regenerate backup codes
- **Prevention:** Regenerate codes before running out

---

## 📊 Activity Log Actions

All 2FA-related actions are logged:

- `2FA_SETUP_INITIATED` - User started 2FA setup
- `2FA_ENABLED` - User enabled 2FA
- `2FA_DISABLED` - User disabled 2FA
- `2FA_BACKUP_CODE_USED` - User logged in with backup code
- `2FA_BACKUP_CODES_REGENERATED` - User regenerated backup codes
- `LOGIN_WITH_BACKUP_CODE` - User logged in using backup code

View logs:
```http
GET /api/activity-logs?action=2FA_ENABLED
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🎯 Next Steps

After implementing 2FA:
1. **Test thoroughly** - Try all scenarios (setup, enable, disable, login)
2. **Document for users** - Create user-facing documentation
3. **Frontend implementation** - Build UI for 2FA setup and login
4. **Phase 5** - CSV Upload & Processing

---

**2FA Status:** ✅ Fully Implemented  
**Security Level:** High  
**Authenticator Support:** All TOTP-compatible apps  
**Backup System:** 10 one-time use codes
