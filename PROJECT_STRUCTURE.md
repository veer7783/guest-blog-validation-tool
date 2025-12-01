# Guest Blog Validation Tool - Project Structure

## 📁 Complete Directory Structure

```
guest-blog-validation-tool/
│
├── backend/                          # Node.js + Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema definition
│   │   ├── seed.ts                  # Database seeding script
│   │   └── migrations/              # Database migration files (auto-generated)
│   │
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   ├── database.ts          # Prisma client instance
│   │   │   └── constants.ts         # Application constants
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.ts              # JWT authentication middleware (to be created)
│   │   │   ├── roleCheck.ts         # Role-based access control (to be created)
│   │   │   ├── rateLimiter.ts       # Rate limiting (to be created)
│   │   │   ├── validator.ts         # Input validation (to be created)
│   │   │   ├── errorHandler.ts      # Global error handler ✅
│   │   │   └── notFoundHandler.ts   # 404 handler ✅
│   │   │
│   │   ├── routes/                  # API route definitions
│   │   │   ├── auth.routes.ts       # Authentication routes (to be created)
│   │   │   ├── user.routes.ts       # User management routes (to be created)
│   │   │   ├── upload.routes.ts     # CSV upload routes (to be created)
│   │   │   ├── dataInProcess.routes.ts  # Data in process routes (to be created)
│   │   │   ├── dataFinal.routes.ts  # Data final routes (to be created)
│   │   │   ├── completed.routes.ts  # Completed data routes (to be created)
│   │   │   ├── activityLog.routes.ts # Activity log routes (to be created)
│   │   │   └── twoFactor.routes.ts  # 2FA routes (to be created)
│   │   │
│   │   ├── controllers/             # Route controllers (business logic)
│   │   │   ├── auth.controller.ts   # Authentication logic (to be created)
│   │   │   ├── user.controller.ts   # User management logic (to be created)
│   │   │   ├── upload.controller.ts # CSV upload logic (to be created)
│   │   │   ├── dataInProcess.controller.ts (to be created)
│   │   │   ├── dataFinal.controller.ts (to be created)
│   │   │   ├── completed.controller.ts (to be created)
│   │   │   ├── activityLog.controller.ts (to be created)
│   │   │   └── twoFactor.controller.ts (to be created)
│   │   │
│   │   ├── services/                # Business logic services
│   │   │   ├── auth.service.ts      # Authentication service (to be created)
│   │   │   ├── user.service.ts      # User service (to be created)
│   │   │   ├── upload.service.ts    # Upload processing service (to be created)
│   │   │   ├── dataInProcess.service.ts (to be created)
│   │   │   ├── dataFinal.service.ts (to be created)
│   │   │   ├── mainProjectApi.service.ts # API integration (to be created)
│   │   │   ├── activityLog.service.ts (to be created)
│   │   │   └── twoFactor.service.ts # 2FA service (to be created)
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── helpers.ts           # General helpers ✅
│   │   │   ├── csvParser.ts         # CSV parsing utilities (to be created)
│   │   │   ├── domainValidator.ts   # Domain validation (to be created)
│   │   │   └── logger.ts            # Custom logger (to be created)
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── express.d.ts         # Express type extensions (to be created)
│   │   │   └── index.ts             # Common types (to be created)
│   │   │
│   │   └── server.ts                # Express app entry point ✅
│   │
│   ├── uploads/                     # File upload directory
│   │   └── .gitkeep                 # Keep directory in git ✅
│   │
│   ├── dist/                        # Compiled JavaScript (auto-generated)
│   │
│   ├── .env                         # Environment variables ✅
│   ├── .env.example                 # Environment template ✅
│   ├── .gitignore                   # Git ignore rules ✅
│   ├── package.json                 # Node.js dependencies ✅
│   ├── tsconfig.json                # TypeScript configuration ✅
│   ├── nodemon.json                 # Nodemon configuration ✅
│   └── README.md                    # Backend documentation ✅
│
├── frontend/                        # React + TypeScript Frontend (to be created)
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── common/              # Reusable components
│   │   │   ├── layout/              # Layout components
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── upload/              # Upload page components
│   │   │   ├── dataInProcess/       # Data in process components
│   │   │   ├── dataFinal/           # Data final components
│   │   │   ├── completed/           # Completed data components
│   │   │   └── activityLogs/        # Activity logs components
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DataUpload.tsx
│   │   │   ├── DataInProcess.tsx
│   │   │   ├── DataFinal.tsx
│   │   │   ├── CompletedData.tsx
│   │   │   ├── ActivityLogs.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   └── useToast.ts
│   │   │
│   │   ├── services/                # API service layer
│   │   │   ├── api.ts               # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── upload.service.ts
│   │   │   └── data.service.ts
│   │   │
│   │   ├── context/                 # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── constants.ts
│   │   │   ├── validators.ts
│   │   │   └── formatters.ts
│   │   │
│   │   ├── types/                   # TypeScript types
│   │   │   └── index.ts
│   │   │
│   │   ├── App.tsx                  # Root component
│   │   ├── index.tsx                # Entry point
│   │   └── routes.tsx               # Route configuration
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── SETUP_GUIDE.md                   # Complete setup instructions ✅
├── PROJECT_STRUCTURE.md             # This file ✅
└── README.md                        # Project overview (to be created)
```

## 🗂️ Database Tables

### users
- User accounts (Super Admin & Admin)
- Authentication credentials
- Role and status

### two_factor_auth
- 2FA secrets
- Backup codes
- Enable/disable status

### data_upload_tasks
- CSV upload tracking
- Task assignment
- Upload statistics

### data_in_process
- Sites being validated
- Publisher information
- Metrics (DA, DR, Traffic, SS)
- Status tracking

### data_final
- Validated sites
- Pricing information
- Ready to push to main project

### completed_process_data
- Successfully pushed sites
- Historical record
- Main project references

### activity_logs
- Complete audit trail
- User actions
- Timestamps and details

## 📊 Data Flow

```
1. CSV Upload (Super Admin)
   ↓
2. Parse & Validate
   ↓
3. Check Duplicates (API Call to Main Project)
   ↓
4. Store in data_upload_tasks & data_in_process
   ↓
5. Assign to Admin
   ↓
6. Admin Edits & Updates Status
   ↓
7. Status = "Reached" → Auto-move to data_final
   ↓
8. Super Admin adds pricing
   ↓
9. Push to Main Project (API Call)
   ↓
10. Move to completed_process_data
```

## 🔐 Authentication Flow

```
1. User Login (Email + Password)
   ↓
2. Validate Credentials
   ↓
3. Check if 2FA Enabled
   ├─ No → Issue JWT Token
   └─ Yes → Request 2FA Code
      ↓
      Verify Code
      ↓
      Issue JWT Token
```

## 🎯 API Integration Points

### Main Project API Calls

1. **Check Duplicates**
   - Endpoint: `POST /api/guest-sites-api/check-duplicates`
   - Purpose: Filter out existing domains
   - Called: During CSV upload

2. **Verify Publishers**
   - Endpoint: `POST /api/guest-sites-api/verify-publishers`
   - Purpose: Validate publisher emails
   - Called: Before pushing to main project

3. **Bulk Import**
   - Endpoint: `POST /api/guest-sites-api/bulk-import`
   - Purpose: Push validated sites
   - Called: From Data Final page

## 🚀 Development Phases

### ✅ Phase 1-2: Project Setup (COMPLETED)
- Backend structure created
- Dependencies configured
- Database schema defined
- Environment setup

### ⏳ Phase 3-4: Authentication & Users
- JWT authentication
- 2FA implementation
- User management
- Role-based access

### ⏳ Phase 5-6: CSV Upload & Processing
- File upload
- CSV parsing
- Duplicate checking
- Task assignment

### ⏳ Phase 7-8: Data Management
- Data in process CRUD
- Data final CRUD
- Status management
- Activity logging

### ⏳ Phase 9-10: API Integration
- Main project API service
- Push functionality
- Error handling
- Completed data tracking

### ⏳ Phase 11-12: Frontend Development
- React setup
- Component development
- API integration
- UI/UX implementation

### ⏳ Phase 13: Testing & Deployment
- Integration testing
- Bug fixes
- Production deployment

## 📝 File Naming Conventions

- **Routes**: `*.routes.ts` (e.g., `auth.routes.ts`)
- **Controllers**: `*.controller.ts` (e.g., `auth.controller.ts`)
- **Services**: `*.service.ts` (e.g., `auth.service.ts`)
- **Middleware**: `*.ts` (e.g., `auth.ts`, `roleCheck.ts`)
- **Types**: `*.d.ts` or `*.ts` (e.g., `express.d.ts`, `index.ts`)
- **React Components**: `PascalCase.tsx` (e.g., `DataUpload.tsx`)
- **Hooks**: `use*.ts` (e.g., `useAuth.ts`)

## 🎨 Code Organization Principles

1. **Separation of Concerns**: Routes → Controllers → Services → Database
2. **Single Responsibility**: Each file has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Reusable utilities and helpers
4. **Type Safety**: TypeScript throughout
5. **Error Handling**: Centralized error handling
6. **Logging**: Activity logs for audit trail
7. **Security**: Input validation, authentication, authorization

---

**Status**: Phase 2 Complete - Backend Structure Ready
**Next**: Phase 3 - Authentication Implementation
