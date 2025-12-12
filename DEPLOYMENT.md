# 🚀 Deployment Guide - Guest Blog Validation Tool

Complete guide for building and deploying the application in production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Build & Deployment](#backend-build--deployment)
4. [Frontend Build & Deployment](#frontend-build--deployment)
5. [Environment Configuration](#environment-configuration)
6. [Production Checklist](#production-checklist)

---

## 🔧 Prerequisites

### Required Software:
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MySQL**: v8.0 or higher
- **Git**: Latest version

### Check Versions:
```bash
node --version
npm --version
mysql --version
git --version
```

---

## 💾 Database Setup

### Step 1: Create Database

```sql
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE guest_blog_validation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, recommended for production)
CREATE USER 'gbvalidation'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON guest_blog_validation.* TO 'gbvalidation'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Step 2: Configure Database Connection

Create `.env` file in `backend/` directory:

```env
# Database
DATABASE_URL="mysql://gbvalidation:your_secure_password@localhost:3306/guest_blog_validation"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=5000
NODE_ENV=production

# Main Project API
MAIN_PROJECT_API_URL="http://localhost:3001/api/guest-sites-api"
MAIN_PROJECT_SERVICE_EMAIL="validation-service@usehypwave.com"
MAIN_PROJECT_SERVICE_PASSWORD="your-main-project-password"
```

### Step 3: Run Database Migrations

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (creates Super Admin)
npm run seed
```

### Step 4: Verify Database Schema

```bash
# Check database tables
npx prisma studio
# Opens browser at http://localhost:5555
```

**Expected Tables:**
- `users`
- `data_management`
- `data_final`
- `_prisma_migrations`

---

## 🔙 Backend Build & Deployment

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Build Backend

```bash
# Compile TypeScript to JavaScript
npm run build
```

This creates a `dist/` folder with compiled JavaScript.

### Step 3: Test Production Build

```bash
# Run production build locally
npm start
```

Backend should start on `http://localhost:5000`

### Step 4: Verify Backend Endpoints

```bash
# Test health check
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

### Backend Build Commands Summary:

```bash
cd backend
npm install              # Install dependencies
npx prisma generate      # Generate Prisma Client
npx prisma migrate deploy # Run migrations
npm run build           # Build TypeScript
npm start               # Start production server
```

---

## 🎨 Frontend Build & Deployment

### Step 1: Configure API URL

Update `frontend/src/config.ts` (or create it):

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

Or update all API calls to use environment variable:

Create `frontend/.env.production`:

```env
REACT_APP_API_URL=http://your-backend-domain.com
```

### Step 2: Update API URLs in Code

Search and replace in frontend:
```
Find: http://localhost:5000
Replace: ${process.env.REACT_APP_API_URL || 'http://localhost:5000'}
```

Or create a centralized API config file.

### Step 3: Install Dependencies

```bash
cd frontend
npm install
```

### Step 4: Build Frontend

```bash
# Create production build
npm run build
```

This creates a `build/` folder with optimized static files.

### Step 5: Test Production Build Locally

```bash
# Install serve globally (if not already installed)
npm install -g serve

# Serve production build
serve -s build -l 3000
```

Frontend should be available at `http://localhost:3000`

### Frontend Build Commands Summary:

```bash
cd frontend
npm install              # Install dependencies
npm run build           # Build for production
serve -s build -l 3000  # Test production build
```

---

## 🌍 Environment Configuration

### Backend `.env` (Production)

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/guest_blog_validation"

# JWT Secret (MUST be changed in production)
JWT_SECRET="generate-a-strong-random-secret-key-here"

# Server
PORT=5000
NODE_ENV=production

# CORS (add your frontend domain)
CORS_ORIGIN="https://your-frontend-domain.com"

# Main Project API
MAIN_PROJECT_API_URL="https://main-project-domain.com/api/guest-sites-api"
MAIN_PROJECT_SERVICE_EMAIL="validation-service@usehypwave.com"
MAIN_PROJECT_SERVICE_PASSWORD="secure-password"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend `.env.production`

```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_ENV=production
```

---

## 📦 Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend Deployment:

```bash
# 1. Clone repository
git clone https://github.com/veer7783/guest-blog-validation-tool.git
cd guest-blog-validation-tool/backend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
nano .env  # Edit with production values

# 4. Setup database
npx prisma generate
npx prisma migrate deploy
npm run seed

# 5. Build
npm run build

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start dist/index.js --name "gb-validation-backend"
pm2 save
pm2 startup
```

#### Frontend Deployment:

```bash
# 1. Build frontend
cd ../frontend
npm install
npm run build

# 2. Serve with Nginx
sudo apt install nginx

# 3. Copy build files
sudo cp -r build/* /var/www/gb-validation/

# 4. Configure Nginx
sudo nano /etc/nginx/sites-available/gb-validation
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gb-validation;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gb-validation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 2: Docker Deployment

#### Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: guest_blog_validation
      MYSQL_USER: gbvalidation
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: mysql://gbvalidation:password@db:3306/guest_blog_validation
      JWT_SECRET: your-jwt-secret
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - db
    command: sh -c "npx prisma migrate deploy && npm start"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

**Deploy with Docker:**

```bash
docker-compose up -d
```

---

## ✅ Production Checklist

### Security:

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Disable Prisma Studio in production
- [ ] Remove console.logs from production code
- [ ] Set secure cookie flags
- [ ] Enable helmet.js security headers

### Database:

- [ ] Database created
- [ ] Migrations applied
- [ ] Initial admin user created
- [ ] Database backups configured
- [ ] Connection pooling configured

### Backend:

- [ ] Environment variables set
- [ ] Build successful
- [ ] Server starts without errors
- [ ] API endpoints accessible
- [ ] Authentication working
- [ ] File uploads working (if applicable)
- [ ] Logs configured
- [ ] Process manager (PM2) configured

### Frontend:

- [ ] API URL configured
- [ ] Build successful
- [ ] Static files served correctly
- [ ] Routing works (SPA)
- [ ] Authentication flow works
- [ ] All pages accessible
- [ ] Assets loading correctly

### Testing:

- [ ] Login/Logout works
- [ ] CSV upload works
- [ ] Data management works
- [ ] Data final operations work
- [ ] Push to main project works
- [ ] Pushed data page shows records
- [ ] User management works (Super Admin)

---

## 🔄 Update/Maintenance

### Update Application:

```bash
# Backend
cd backend
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart gb-validation-backend

# Frontend
cd ../frontend
git pull
npm install
npm run build
sudo cp -r build/* /var/www/gb-validation/
```

### Database Backup:

```bash
# Backup
mysqldump -u gbvalidation -p guest_blog_validation > backup_$(date +%Y%m%d).sql

# Restore
mysql -u gbvalidation -p guest_blog_validation < backup_20241202.sql
```

---

## 📞 Support

For issues or questions:
- GitHub: https://github.com/veer7783/guest-blog-validation-tool
- Create an issue with detailed logs

---

## 📝 Default Credentials

**Super Admin:**
- Email: `admin@example.com`
- Password: `Admin@123`

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

---

**Last Updated:** December 2, 2024
