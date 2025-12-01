# Guest Blog Validation Tool - Complete Setup Guide

## 📋 Overview

This guide will help you set up the Guest Blog Validation Tool from scratch.

## 🔧 Prerequisites

Before starting, ensure you have:

- ✅ Node.js v18+ installed
- ✅ MySQL v8+ installed and running
- ✅ npm or yarn package manager
- ✅ Git (optional, for version control)

## 🚀 Phase 1: Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install all required packages including:
- Express.js (Web framework)
- Prisma (ORM)
- TypeScript
- JWT & bcrypt (Authentication)
- And many more...

### Step 2: Configure Environment

The `.env` file has been created with default values. **Update these settings:**

```env
# Database - Update with your MySQL credentials
DATABASE_URL="mysql://YOUR_USERNAME:YOUR_PASSWORD@localhost:3306/guest_blog_validation"

# JWT Secret - Change this to a secure random string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Main Project API - Verify these are correct
MAIN_PROJECT_API_URL=http://localhost:3001/api/guest-sites-api
MAIN_PROJECT_SERVICE_EMAIL=validation-service@usehypwave.com
MAIN_PROJECT_SERVICE_PASSWORD=3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928
```

### Step 3: Create Database

Open MySQL and create the database:

```sql
CREATE DATABASE guest_blog_validation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or use command line:

```bash
mysql -u root -p -e "CREATE DATABASE guest_blog_validation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 4: Run Prisma Migrations

Generate Prisma Client and create database tables:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# When prompted, enter a migration name (e.g., "initial_setup")
```

### Step 5: Seed Initial Data

Create default users (Super Admin and Admin users):

```bash
npm run seed
```

This creates:
- **Super Admin**: superadmin@guestblog.com / Admin@123
- **Admin 1**: admin1@guestblog.com / Admin@123
- **Admin 2**: admin2@guestblog.com / Admin@123

### Step 6: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:5000`

### Step 7: Verify Backend

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Guest Blog Validation Tool API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Phase 2: Frontend Setup (Coming Soon)

The frontend will be built with:
- React 18 + TypeScript
- Material-UI (MUI)
- React Query
- React Router

## 🗄️ Database Schema

The following tables will be created:

1. **users** - User accounts (Super Admin & Admin)
2. **two_factor_auth** - 2FA settings
3. **data_upload_tasks** - CSV upload tracking
4. **data_in_process** - Sites being validated
5. **data_final** - Validated sites ready to push
6. **completed_process_data** - Successfully pushed sites
7. **activity_logs** - Audit trail

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ 2FA with TOTP
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Activity logging

## 📊 Prisma Studio (Database GUI)

To view and manage your database visually:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555`

## 🛠️ Useful Commands

### Database Management

```bash
# View database in browser
npm run prisma:studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Push schema changes without migration
npm run prisma:push

# Generate Prisma Client after schema changes
npm run prisma:generate
```

### Development

```bash
# Start dev server with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database seed
npm run seed
```

## 🐛 Troubleshooting

### Issue: Cannot connect to database

**Solution:**
1. Verify MySQL is running
2. Check DATABASE_URL in `.env`
3. Ensure database exists
4. Verify credentials

### Issue: Prisma Client not found

**Solution:**
```bash
npm run prisma:generate
```

### Issue: Migration failed

**Solution:**
```bash
# Reset and try again
npm run prisma:migrate reset
npm run prisma:migrate
```

### Issue: Port 5000 already in use

**Solution:**
Change PORT in `.env` file:
```env
PORT=5001
```

## 📝 Next Steps

After backend setup is complete:

1. ✅ Backend structure created
2. ✅ Dependencies installed
3. ✅ Database configured
4. ✅ Initial data seeded
5. ⏳ Build authentication endpoints
6. ⏳ Build upload functionality
7. ⏳ Build data processing endpoints
8. ⏳ Build frontend application
9. ⏳ Integration testing
10. ⏳ Deployment

## 🔗 Integration with Main Project

This tool integrates with the SEO Link Building project via REST API:

**Service Account:**
- Email: validation-service@usehypwave.com
- Password: 3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928

**API Endpoints Used:**
- `POST /api/guest-sites-api/check-duplicates` - Check for existing domains
- `POST /api/guest-sites-api/verify-publishers` - Verify publisher emails
- `POST /api/guest-sites-api/bulk-import` - Push validated sites

## 📞 Support

For issues or questions, refer to the main README.md or contact the development team.

---

**Last Updated:** Phase 2 - Backend Setup Complete
