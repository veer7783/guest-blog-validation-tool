# ⚡ Quick Start Guide

Get the Guest Blog Validation Tool running in 5 minutes!

---

## 🚀 Quick Setup (Development)

### 1. Clone Repository
```bash
git clone https://github.com/veer7783/guest-blog-validation-tool.git
cd guest-blog-validation-tool
```

### 2. Setup Database
```sql
-- In MySQL:
CREATE DATABASE guest_blog_validation;
```

### 3. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

**Minimum `.env` configuration:**
```env
DATABASE_URL="mysql://root:password@localhost:3306/guest_blog_validation"
JWT_SECRET="your-secret-key-change-this"
PORT=5000
```

### 4. Setup Backend
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend runs on: `http://localhost:5000`

### 5. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

### 6. Login
```
Email: admin@example.com
Password: Admin@123
```

**✅ Done! You're ready to use the app!**

---

## 🏗️ Production Build

### Option 1: Automated Build (Windows)
```bash
build-all.bat
```

### Option 2: Automated Build (Linux/Mac)
```bash
chmod +x build-all.sh
./build-all.sh
```

### Option 3: Manual Build

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
npx serve -s build
```

---

## 📁 Project Structure

```
guest-blog-validation-tool/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── dist/              # Build output
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── App.tsx
│   ├── build/             # Build output
│   └── package.json
│
├── DEPLOYMENT.md          # Full deployment guide
├── QUICK-START.md         # This file
├── build-all.sh           # Build script (Linux/Mac)
└── build-all.bat          # Build script (Windows)
```

---

## 🔑 Default Users

After running `npm run seed`:

**Super Admin:**
- Email: `admin@example.com`
- Password: `Admin@123`
- Can: Everything

**Admin:**
- Email: `user@example.com`
- Password: `User@123`
- Can: View and manage data (no push, no users)

---

## 🛠️ Common Commands

### Backend:
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Database GUI
npx prisma migrate dev  # Create new migration
```

### Frontend:
```bash
npm start            # Development mode
npm run build        # Build for production
npm test             # Run tests
```

---

## 🔧 Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Fix:** Check MySQL is running and credentials in `.env` are correct

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Fix:** Change PORT in `.env` or kill process using port:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Prisma Client Error
```
Error: @prisma/client did not initialize yet
```
**Fix:** Run `npx prisma generate`

### Build Errors
```
Error: Cannot find module...
```
**Fix:** Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Features

✅ **User Management**
- Super Admin and Admin roles
- 2FA authentication
- Secure JWT tokens

✅ **Data Management**
- CSV upload
- Bulk operations
- Data validation
- Pricing management

✅ **Push to Main Project**
- Bulk import to Link Management Tool
- Transfer tracking
- Success/failure reporting

✅ **Pushed Data**
- View transferred sites
- Transfer history
- Audit trail

---

## 🔗 Useful Links

- **Full Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub Repository:** https://github.com/veer7783/guest-blog-validation-tool
- **Main Project:** Link Management Tool

---

## 📞 Need Help?

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
2. Check troubleshooting section above
3. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)

---

**Happy Coding! 🚀**
