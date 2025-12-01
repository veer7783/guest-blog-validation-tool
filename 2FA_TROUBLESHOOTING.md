# 🔐 2FA Troubleshooting Guide

## 🚨 Problem: Can't Login - Invalid 2FA Code

### Quick Solutions (Try in order):

---

## ✅ Solution 1: Reset 2FA via Backend Script

**When to use:** You can't login and need to disable 2FA

### Steps:

1. **Open terminal in backend folder:**
   ```bash
   cd d:\guest-blog-validation-tool\backend
   ```

2. **Run reset script with your email:**
   ```bash
   node reset-2fa.js superadmin@guestblog.com
   ```

3. **Login without 2FA:**
   - Go to http://localhost:4000
   - Enter email and password
   - No 2FA code required now ✅

4. **Setup 2FA again:**
   - Go to Users module
   - Click "Setup 2FA" button
   - Scan new QR code
   - Save the secret safely

---

## ✅ Solution 2: Check Current Valid Code

**When to use:** Want to see what code should work right now

### Steps:

1. **Run test script:**
   ```bash
   cd d:\guest-blog-validation-tool\backend
   node test-2fa-code.js
   ```

2. **Use the displayed code immediately** (expires in 30 seconds)

3. **Re-scan QR code if needed** (URL will be shown in output)

---

## ✅ Solution 3: Check 2FA Status

**When to use:** Want to verify if 2FA is enabled

### Steps:

```bash
cd d:\guest-blog-validation-tool\backend
node check-2fa.js
```

This shows:
- Which users have 2FA enabled
- If secret exists
- Number of backup codes

---

## 🔧 Common Issues & Fixes

### Issue 1: Time Sync Problem
**Symptom:** Code always invalid even after re-scanning

**Fix:**
1. Check your computer/phone time is correct
2. Enable automatic time sync
3. TOTP codes are time-based (30-second window)

---

### Issue 2: Wrong Secret in Authenticator
**Symptom:** Code doesn't match

**Fix:**
1. Delete old entry from authenticator app
2. Run `node test-2fa-code.js`
3. Scan the QR code URL shown
4. Or manually enter the secret

---

### Issue 3: Multiple Entries in Authenticator
**Symptom:** Confused which code to use

**Fix:**
1. Delete ALL "Guest Blog" entries from authenticator
2. Reset 2FA: `node reset-2fa.js <email>`
3. Setup fresh 2FA from Users module
4. Add only ONE entry to authenticator

---

## 📋 Available Scripts

### `reset-2fa.js` - Reset 2FA for any user
```bash
node reset-2fa.js <email>

Example:
node reset-2fa.js superadmin@guestblog.com
```

### `test-2fa-code.js` - Get current valid code
```bash
node test-2fa-code.js
```
Shows:
- Current valid code
- Secret for manual entry
- QR code URL for re-scanning

### `check-2fa.js` - Check 2FA status
```bash
node check-2fa.js
```
Shows all Super Admins and their 2FA status

---

## 🎯 Best Practices

### ✅ DO:
- Save the secret key when setting up 2FA
- Use a reliable authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
- Keep your device time synced
- Test 2FA immediately after setup

### ❌ DON'T:
- Don't have multiple entries for same account
- Don't ignore time sync warnings
- Don't delete authenticator app without disabling 2FA first
- Don't share your secret key

---

## 🆘 Emergency Access

### If completely locked out:

1. **Access server/database directly:**
   ```bash
   cd d:\guest-blog-validation-tool\backend
   node reset-2fa.js <your-email>
   ```

2. **Or via database:**
   ```sql
   DELETE FROM two_factor_auth WHERE userId = '<user-id>';
   ```

3. **Login and setup 2FA again**

---

## 📞 Quick Reference

| Problem | Solution | Command |
|---------|----------|---------|
| Can't login | Reset 2FA | `node reset-2fa.js <email>` |
| Need current code | Test 2FA | `node test-2fa-code.js` |
| Check status | Check 2FA | `node check-2fa.js` |
| Re-scan QR | Test 2FA | Shows QR URL |

---

## 💡 Pro Tips

1. **Save your secret key** when setting up 2FA (shown during setup)
2. **Take screenshot of QR code** for backup
3. **Use backup codes** if available (future feature)
4. **Keep reset script handy** for emergencies

---

## 🔄 Setup 2FA Properly

1. Login to application
2. Go to **Users** module
3. Click **Setup 2FA** for your user
4. **Save the secret key** shown
5. Scan QR code in authenticator app
6. Enter code to verify
7. Test immediately by logging out and in

---

## ✅ Verification Checklist

After setting up 2FA:

- [ ] Secret saved safely
- [ ] QR code screenshot taken
- [ ] Code verified successfully
- [ ] Tested login with 2FA
- [ ] Only ONE entry in authenticator app
- [ ] Device time is synced

---

**Keep this guide handy for future reference!** 🚀
