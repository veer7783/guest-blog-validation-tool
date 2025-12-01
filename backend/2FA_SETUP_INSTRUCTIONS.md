# 📱 Google Authenticator Setup Instructions

## ✅ Setup Complete!

Your 2FA has been initialized. Follow these steps to complete the setup:

## 📋 Files Generated

1. **QR Code:** `2fa_qrcode.png` - Scan this with Google Authenticator
2. **Backup Codes:** `2fa_backup_codes.txt` - Save these securely!

## 🔐 Your Backup Codes

**IMPORTANT: Save these codes in a secure location!**

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

These codes can be used ONCE each if you lose access to your authenticator app.

## 📱 How to Add to Google Authenticator

### Method 1: Scan QR Code (Recommended)

1. **Open Google Authenticator** on your phone
2. **Tap the "+" button** (bottom right)
3. **Select "Scan a QR code"**
4. **Scan the QR code** from `2fa_qrcode.png`
5. **Account will be added** as "Guest Blog Validation (superadmin@guestblog.com)"

### Method 2: Manual Entry (If QR scan doesn't work)

1. **Open Google Authenticator** on your phone
2. **Tap the "+" button** (bottom right)
3. **Select "Enter a setup key"**
4. **Enter the following details:**
   - **Account:** superadmin@guestblog.com
   - **Key:** `G55F4YRPNZLUIUBRKQSTINZKGZ3GQ5DMOIQSIWCSLZ5D6PBSEF4A`
   - **Type of key:** Time based

## ⏭️ Next Steps

After adding to Google Authenticator:

1. **Get the 6-digit code** from the app (it changes every 30 seconds)
2. **Run the enable command** in PowerShell:
   ```powershell
   # Replace 123456 with the actual code from your app
   $enableBody = @{ code = "123456" } | ConvertTo-Json
   Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/enable" `
       -Method Post -Headers $global:headers `
       -ContentType "application/json" -Body $enableBody
   ```
3. **Test the login** with 2FA enabled

## 🧪 Testing After Enable

### Test 2FA Login
```powershell
# Step 1: Try login without 2FA code (will ask for 2FA)
$loginBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $loginBody

# Should return: requiresTwoFactor: true

# Step 2: Login with 2FA code
$login2faBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
    twoFactorCode = "123456"  # Replace with current code from app
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $login2faBody

# Should return: JWT token
```

### Test Backup Code Login
```powershell
# Use one of your backup codes instead of TOTP code
$loginBackupBody = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
    twoFactorCode = "A6MBTSF0"  # Use one of your backup codes
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post -ContentType "application/json" -Body $loginBackupBody
```

**Note:** Each backup code can only be used ONCE!

## 🔄 Regenerate Backup Codes

If you run out of backup codes or suspect they're compromised:

```powershell
# Login and get token first
$body = @{ email = "superadmin@guestblog.com"; password = "Admin@123"; twoFactorCode = "123456" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $response.data.token
$headers = @{ Authorization = "Bearer $token" }

# Regenerate backup codes
$regenBody = @{ password = "Admin@123" } | ConvertTo-Json
$newCodes = Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/regenerate-backup-codes" `
    -Method Post -Headers $headers -ContentType "application/json" -Body $regenBody

# Display new codes
$newCodes.data.backupCodes
```

## 🚫 Disable 2FA

If you want to disable 2FA:

```powershell
# Login and get token first
$disableBody = @{
    password = "Admin@123"
    code = "123456"  # Current code from authenticator app
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/2fa/disable" `
    -Method Post -Headers $headers `
    -ContentType "application/json" -Body $disableBody
```

## 📱 Recommended Authenticator Apps

- **Google Authenticator** (iOS/Android) - Simple and reliable
- **Microsoft Authenticator** (iOS/Android) - Cloud backup support
- **Authy** (iOS/Android/Desktop) - Multi-device sync
- **1Password** - If you use 1Password password manager
- **Bitwarden** - If you use Bitwarden password manager

## 🔒 Security Tips

1. **Save backup codes** in a secure location (password manager, safe, etc.)
2. **Don't share** your secret key or QR code
3. **Test backup codes** before relying on them
4. **Add to multiple devices** if your authenticator app supports it
5. **Regenerate backup codes** periodically

## ❓ Troubleshooting

### "Invalid verification code" error
- **Cause:** Time sync issue or expired code
- **Solution:** 
  - Ensure your phone's time is set to automatic
  - Wait for the next code (codes change every 30 seconds)
  - Try a backup code if available

### Lost access to authenticator app
- **Solution:** Use one of your backup codes to login
- **Prevention:** Save backup codes securely

### QR code won't scan
- **Solution:** Use manual entry method with the secret key
- **Alternative:** Try a different QR code scanner app

## 📞 Support

If you encounter any issues:
1. Check the activity logs: `GET /api/activity-logs`
2. Review the 2FA status: `GET /api/2fa/status`
3. Check server logs for errors

---

**Setup Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Account:** superadmin@guestblog.com  
**Status:** ⏳ Pending activation (scan QR code and enable)
