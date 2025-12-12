# 🏗️ Build Instructions - Quick Reference

Complete build instructions for Guest Blog Validation Tool.

---

## 📋 Prerequisites

- Node.js v18+ 
- MySQL v8.0+
- npm v9+

---

## 🚀 Quick Build (Windows)

```bash
# Run automated build script
build-all.bat
```

## 🚀 Quick Build (Linux/Mac)

```bash
# Make script executable
chmod +x build-all.sh

# Run build
./build-all.sh
```

---

## 📦 Manual Build Steps

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE guest_blog_validation;

-- Create user (optional)
CREATE USER 'gbvalidation'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON guest_blog_validation.* TO 'gbvalidation'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Build

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run seed

# Build TypeScript
npm run build

# Start production server
npm start
```

**Backend Output:** `backend/dist/`  
**Backend Runs On:** `http://localhost:5000`

### 3. Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve production build (optional)
npx serve -s build -l 3000
```

**Frontend Output:** `frontend/build/`  
**Frontend Runs On:** `http://localhost:3000`

---

## 🌍 Environment Variables

### Backend `.env`

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/guest_blog_validation"

# JWT Secret (change in production!)
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=5000
NODE_ENV=production

# Main Project API
MAIN_PROJECT_API_URL="http://localhost:3001/api/guest-sites-api"
MAIN_PROJECT_SERVICE_EMAIL="validation-service@usehypwave.com"
MAIN_PROJECT_SERVICE_PASSWORD="your-password"
```

### Frontend `.env.production`

```env
REACT_APP_API_URL=http://localhost:5000
```

---

## ✅ Verify Build

### Backend:
```bash
# Check if server starts
cd backend
npm start

# Test API
curl http://localhost:5000/health
```

### Frontend:
```bash
# Check build folder exists
ls frontend/build

# Serve and test
cd frontend
npx serve -s build
# Open http://localhost:3000
```

---

## 🐳 Docker Build (Optional)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 📁 Build Output

```
guest-blog-validation-tool/
├── backend/
│   └── dist/              ← Backend build output
│       ├── index.js
│       ├── controllers/
│       ├── services/
│       └── ...
│
└── frontend/
    └── build/             ← Frontend build output
        ├── index.html
        ├── static/
        │   ├── css/
        │   └── js/
        └── ...
```

---

## 🔧 Build Scripts

### Backend `package.json`:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Frontend `package.json`:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

---

## 🚨 Common Issues

### Issue: "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate
```

### Issue: "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue: "Database connection failed"
- Check MySQL is running
- Verify DATABASE_URL in `.env`
- Check user permissions

### Issue: "Build failed - out of memory"
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## 📊 Build Size

### Backend:
- Source: ~50 MB
- Build: ~30 MB
- node_modules: ~200 MB

### Frontend:
- Source: ~20 MB
- Build: ~2 MB (optimized)
- node_modules: ~300 MB

---

## 🔄 Update Build

```bash
# Pull latest changes
git pull

# Rebuild backend
cd backend
npm install
npx prisma migrate deploy
npm run build

# Rebuild frontend
cd ../frontend
npm install
npm run build
```

---

## 📚 Related Documentation

- **Full Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Quick Start:** [QUICK-START.md](QUICK-START.md)
- **Database Schema:** [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md)
- **Main README:** [README.md](README.md)

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET
- [ ] Use strong database password
- [ ] Configure CORS
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure process manager (PM2)
- [ ] Set up monitoring
- [ ] Test all features
- [ ] Change default admin password

---

## 📞 Support

Need help? Check:
1. [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
2. [QUICK-START.md](QUICK-START.md) - Quick setup
3. GitHub Issues - Report problems

---

**Happy Building! 🚀**
