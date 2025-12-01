# 🚀 Start Application - Quick Guide

## Current Status

✅ **Backend:** Running on http://localhost:5000  
⏳ **Frontend:** Installing dependencies (will run on http://localhost:4000)

---

## Step 1: Wait for npm install to complete

The frontend is currently running:
```bash
npm install
```

This will take 2-3 more minutes. You'll know it's done when you see:
```
added XXX packages in XXs
```

---

## Step 2: Start the Frontend

Once npm install completes, run:

```bash
cd frontend
npm start
```

The app will automatically open at **http://localhost:4000**

---

## Step 3: Login

Use these credentials:

**Super Admin:**
- Email: `superadmin@guestblog.com`
- Password: `Admin@123`

**Admin:**
- Email: `admin1@guestblog.com`
- Password: `Admin@123`

---

## What You'll See

### 1. Login Page
- Beautiful purple gradient background
- Email and password fields
- 2FA code input (if you've enabled 2FA)

### 2. Dashboard
- Welcome message with your name
- 4 statistics cards
- Quick actions

### 3. Navigation
- **Sidebar** (left) - Main menu
- **Header** (top) - User info and logout

### 4. Pages Available

**For Super Admin:**
- Dashboard
- Upload CSV
- Data Management
- User Management

**For Admin:**
- Dashboard
- Data Management

---

## Troubleshooting

### If frontend doesn't start:
```bash
# Clear cache and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm start
```

### If port 4000 is in use:
Edit `frontend/.env` and change:
```
PORT=4001
```

### If you see TypeScript errors:
These will disappear once npm install completes. If they persist:
1. Restart VS Code
2. Close and reopen the files

---

## Quick Commands

### Backend
```bash
cd backend
npm run dev          # Start server
npm run build        # Build for production
npx prisma studio    # Open database GUI
```

### Frontend
```bash
cd frontend
npm start            # Start dev server (port 4000)
npm run build        # Build for production
npm test             # Run tests
```

---

## URLs

- **Backend API:** http://localhost:5000
- **Frontend App:** http://localhost:4000
- **API Docs:** See BACKEND_COMPLETE.md

---

## 🎉 You're Almost There!

Just wait for npm install to finish, then run `npm start` and you're good to go!

**Estimated Time:** 2-3 minutes
