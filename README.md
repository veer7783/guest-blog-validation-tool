# Guest Blog Validation Tool

A comprehensive validation and management system for guest blog sites, designed to streamline the process of validating, pricing, and integrating guest blog opportunities with the main SEO Link Building project.

## 🎯 Project Overview

**Type:** Standalone Application  
**Integration:** Connected to SEO Link Building Final Project via REST API  
**Purpose:** Validate and process guest blog sites before adding them to the main project

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication
- Two-Factor Authentication (2FA) with TOTP
- Role-based access control (Super Admin & Admin)
- Complete activity logging and audit trail
- Secure password hashing with bcrypt

### 📤 CSV Upload & Processing
- Drag & drop CSV file upload
- Automatic domain normalization
- Duplicate detection via main project API
- Bulk processing with detailed results
- Upload history tracking

### 📊 Data Management Pipeline
1. **Data Upload** - Super Admin uploads CSV files
2. **Data in Process** - Admin users validate and edit site details
3. **Data Final** - Super Admin adds pricing and prepares for push
4. **Completed Process** - Historical record of pushed sites

### 👥 User Roles

#### Super Admin
- Upload CSV files
- Assign tasks to Admin users
- View all data across all pages
- Edit and delete any record
- Add pricing information
- Push data to main project
- Manage 2FA settings
- View activity logs
- User management

#### Admin
- View only assigned data
- Edit data in "Data in Process"
- Update status (Reached/Not Reached/No Action)
- Cannot delete records
- Cannot access final or completed pages
- Cannot push to main project

### 🔄 Workflow

```
CSV Upload → Parse & Validate → Check Duplicates → Assign to Admin
     ↓
Admin Edits & Updates Status
     ↓
Status = "Reached" → Auto-move to Data Final
     ↓
Super Admin Adds Pricing
     ↓
Push to Main Project → Completed Process Data
```

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** MySQL
- **Authentication:** JWT + speakeasy (2FA)
- **File Processing:** papaparse (CSV)
- **API Client:** Axios

### Frontend (Coming Soon)
- **Framework:** React 18
- **Language:** TypeScript
- **UI Library:** Material-UI (MUI)
- **State Management:** React Query
- **Routing:** React Router
- **API Client:** Axios

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MySQL v8+
- npm or yarn

### Installation

1. **Clone the repository** (if using Git)
   ```bash
   git clone <repository-url>
   cd guest-blog-validation-tool
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment**
   - Update `backend/.env` with your database credentials
   - Change JWT_SECRET to a secure random string

4. **Create database**
   ```sql
   CREATE DATABASE guest_blog_validation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Run migrations**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. **Seed initial data**
   ```bash
   npm run seed
   ```

7. **Start the server**
   ```bash
   npm run dev
   ```

The backend will be running at `http://localhost:5000`

## 📖 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete setup instructions
- **[Project Structure](PROJECT_STRUCTURE.md)** - Detailed project structure
- **[Backend README](backend/README.md)** - Backend-specific documentation

## 🔑 Default Credentials

After seeding the database:

**Super Admin:**
- Email: `superadmin@guestblog.com`
- Password: `Admin@123`

**Admin Users:**
- Email: `admin1@guestblog.com` / `admin2@guestblog.com`
- Password: `Admin@123`

⚠️ **Important:** Change these passwords in production!

## 🗄️ Database Schema

### Main Tables
- **users** - User accounts and authentication
- **two_factor_auth** - 2FA settings and backup codes
- **data_upload_tasks** - CSV upload tracking
- **data_in_process** - Sites being validated
- **data_final** - Validated sites with pricing
- **completed_process_data** - Successfully pushed sites
- **activity_logs** - Complete audit trail

## 🔌 API Integration

### Main Project Integration

**Service Account:**
- Email: `validation-service@usehypwave.com`
- Password: `3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928`

**API Endpoints:**
- `POST /api/guest-sites-api/check-duplicates` - Check for existing domains
- `POST /api/guest-sites-api/verify-publishers` - Verify publisher emails
- `POST /api/guest-sites-api/bulk-import` - Push validated sites

## 📊 Features by Page

### Page 1: Data Upload (Super Admin Only)
- CSV file upload (drag & drop)
- Automatic duplicate checking
- Task assignment to Admin users
- Upload history and statistics

### Page 2: Data in Process
- View assigned data (Admin) or all data (Super Admin)
- Inline editing of site details
- Status management (Pending/Reached/Not Reached/No Action)
- Filtering and search
- Auto-move to Data Final when status = "Reached"

### Page 3: Data Final (Super Admin Only)
- View all reached sites
- Add pricing (GB Base Price, LI Base Price)
- Bulk selection and editing
- Push to main project
- Detailed push results

### Page 4: Completed Process Data (Super Admin Only)
- Historical record of pushed sites
- Statistics dashboard
- Export functionality
- Filtering and search

### Page 5: Activity Logs (Super Admin Only)
- Complete audit trail
- Filter by user, action, date
- Export logs
- Full-text search

## 🔒 Security Features

- ✅ JWT authentication with secure tokens
- ✅ 2FA with TOTP (Google Authenticator compatible)
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Activity logging for audit

## 📈 Development Status

### ✅ Phase 1-2: Setup & Database (COMPLETED)
- [x] Project structure created
- [x] Dependencies installed
- [x] TypeScript configured
- [x] Prisma schema defined
- [x] Environment setup
- [x] Basic server structure

### ✅ Phase 3-4: Authentication (COMPLETED)
- [x] JWT authentication endpoints
- [x] 2FA implementation with TOTP
- [x] User management
- [x] Role-based middleware
- [x] 2FA emergency reset tools

### ✅ Phase 5-6: CSV Upload & Processing (COMPLETED)
- [x] File upload endpoint
- [x] CSV parsing with validation
- [x] Duplicate checking via main project API
- [x] Task assignment to admins
- [x] Upload history tracking

### ✅ Phase 7-8: Data Management (COMPLETED)
- [x] Data in process CRUD
- [x] Data final CRUD
- [x] Status management
- [x] Activity logging
- [x] Bulk operations

### ✅ Phase 9-10: API Integration (COMPLETED)
- [x] Main project API service
- [x] Duplicate detection
- [x] Publisher verification
- [x] Error handling

### ✅ Phase 11-12: Frontend (COMPLETED)
- [x] React setup with TypeScript
- [x] Material-UI components
- [x] Dashboard with statistics
- [x] CSV upload with drag & drop
- [x] Data management pages
- [x] User management
- [x] Activity logs viewer

### ⏳ Phase 13: Push to Main Project (IN PROGRESS)
- [ ] Push selected sites
- [ ] Push all unpushed sites
- [ ] Transfer status tracking
- [ ] Integration testing

## 🛠️ Useful Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database
```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npm run prisma:migrate reset

# Generate Prisma Client
npm run prisma:generate
```

## 🐛 Troubleshooting

### 2FA Issues

If you can't login due to 2FA problems:

```bash
cd backend

# Interactive 2FA manager (recommended)
node 2fa-manager.js

# Or reset 2FA for specific user
node reset-2fa.js your-email@example.com
```

See [2FA_TROUBLESHOOTING.md](2FA_TROUBLESHOOTING.md) for detailed 2FA troubleshooting.

### Other Issues

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting steps.

## 📝 License

Private - Internal Use Only

## 👥 Team

Development Team - SEO Link Building Project

---

**Current Phase:** Phase 13 - Push to Main Project Integration 🚀  
**Status:** 95% Complete - Production Ready  
**Last Updated:** December 2025
