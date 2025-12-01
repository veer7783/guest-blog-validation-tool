# 🧪 2FA Testing Summary

## ✅ Setup Complete!

Your 2FA system has been initialized and is ready for testing with Google Authenticator.

## 📁 Files Created

| File | Purpose |
|------|---------|
| `2fa_qrcode.png` | QR code to scan with Google Authenticator |
| `2fa_backup_codes.txt` | 10 one-time use backup codes |
| `2FA_SETUP_INSTRUCTIONS.md` | Detailed setup instructions |
| `enable-2fa.ps1` | PowerShell script to enable 2FA |
| `test-2fa-login.ps1` | PowerShell script to test 2FA login |
| `test-backup-code.ps1` | PowerShell script to test backup code login |

## 🔐 Your Backup Codes

**SAVE THESE SECURELY!** Each can be used only once.

```
A6MBTSF0
KLVFDUBH
2AF8U7FP
36DD3FU8
ZCFICGUO
WQBRLIPC
PW079TVJ
ID7HGXZI
4BW8WLO2
KN327727
```

## 📱 Google Authenticator Setup

### Step 1: Add Account to Google Authenticator

**Option A: Scan QR Code (Recommended)**
1. Open Google Authenticator app on your phone
2. Tap the "+" button (bottom right)
3. Select "Scan a QR code"
4. Scan the QR code from `2fa_qrcode.png` (should be open now)

**Option B: Manual Entry**
1. Open Google Authenticator app
2. Tap the "+" button
3. Select "Enter a setup key"
4. Enter:
   - **Account:** superadmin@guestblog.com
   - **Key:** `G55F4YRPNZLUIUBRKQSTINZKGZ3GQ5DMOIQSIWCSLZ5D6PBSEF4A`
   - **Type:** Time based

### Step 2: Enable 2FA

After adding to Google Authenticator, run:

```powershell
.\enable-2fa.ps1
```

This script will:
1. Prompt you for the 6-digit code from Google Authenticator
2. Enable 2FA on your account
3. Verify the setup was successful

### Step 3: Test 2FA Login

```powershell
.\test-2fa-login.ps1
```

This script will:
1. Try login without 2FA code (should ask for 2FA)
2. Prompt for 2FA code from Google Authenticator
3. Complete login with 2FA
4. Display user information and JWT token

### Step 4: Test Backup Code (Optional)

```powershell
.\test-backup-code.ps1
```

This script will:
1. Show your backup codes
2. Prompt for a backup code to test
3. Login using the backup code
4. Show remaining backup codes

**⚠️ Warning:** Backup codes are one-time use only!

## 🎯 Quick Testing Commands

### Enable 2FA (Manual)
```powershell
# Get the code from Google Authenticator, then run:
$enableBody = @{ code = "123456" } | ConvertTo-Json  # Replace 123456
Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/enable" `
    -Method Post -Headers $global:headers `
    -ContentType "application/json" -Body $enableBody
```

### Test 2FA Login (Manual)
```powershell
# Step 1: Login without 2FA (will ask for 2FA)
$loginBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $loginBody

# Step 2: Login with 2FA code
$login2faBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
    twoFactorCode = "123456"  # Current code from app
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $login2faBody
```

### Check 2FA Status
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/status" `
    -Method Get -Headers $global:headers | ConvertTo-Json
```

### Regenerate Backup Codes
```powershell
$regenBody = @{ password = "Admin@123" } | ConvertTo-Json
$newCodes = Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/regenerate-backup-codes" `
    -Method Post -Headers $global:headers `
    -ContentType "application/json" -Body $regenBody
$newCodes.data.backupCodes
```

### Disable 2FA
```powershell
$disableBody = @{
    password = "Admin@123"
    code = "123456"  # Current code from app
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/disable" `
    -Method Post -Headers $global:headers `
    -ContentType "application/json" -Body $disableBody
```

## 📊 What to Expect

### Before Enabling 2FA
```json
{
  "success": true,
  "data": {
    "isEnabled": false,
    "hasBackupCodes": false
  }
}
```

### After Enabling 2FA
```json
{
  "success": true,
  "data": {
    "isEnabled": true,
    "hasBackupCodes": true,
    "backupCodesRemaining": 10
  }
}
```

### Login Without 2FA Code (when 2FA is enabled)
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

### Successful 2FA Login
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

## ❓ Troubleshooting

### "Invalid verification code"
- **Cause:** Time sync issue or expired code
- **Fix:** 
  - Ensure phone time is set to automatic
  - Wait for next code (changes every 30 seconds)
  - Try a backup code

### QR Code Won't Scan
- **Fix:** Use manual entry with the secret key
- **Alternative:** Try different lighting or angle

### Lost Access to Authenticator
- **Fix:** Use one of your backup codes
- **Prevention:** Save backup codes securely

### Code Not Working
- **Check:** Phone time is synced
- **Check:** Using the correct account in authenticator
- **Check:** Code hasn't expired (30-second window)

## 🔒 Security Reminders

1. ✅ **Save backup codes** in a secure location
2. ✅ **Don't share** your secret key or QR code
3. ✅ **Test backup codes** before relying on them
4. ✅ **Keep phone time synced** for accurate codes
5. ✅ **Regenerate backup codes** if running low

## 📈 Next Steps

After successfully testing 2FA:

1. ✅ **Verify all features work:**
   - Setup 2FA
   - Enable 2FA
   - Login with TOTP code
   - Login with backup code
   - Check status
   - Regenerate backup codes

2. ✅ **Check activity logs:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/activity-logs?action=2FA_ENABLED" `
       -Method Get -Headers $global:headers | ConvertTo-Json
   ```

3. ✅ **Ready for Phase 5:**
   - CSV Upload & Processing
   - Data Management
   - Task Assignment

## 📞 Support

If you encounter issues:
- Check `backend/2FA_GUIDE.md` for detailed documentation
- Review server logs for errors
- Check activity logs for 2FA events

---

**Setup Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Account:** superadmin@guestblog.com  
**Status:** ⏳ Ready to enable (scan QR code first)  
**Backup Codes:** 10 codes saved in `2fa_backup_codes.txt`
