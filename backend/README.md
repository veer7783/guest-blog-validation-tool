# Guest Blog Validation Tool - Backend

Backend API for the Guest Blog Site Validation Tool, built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **User Authentication**: JWT-based authentication with 2FA support
- **Role-Based Access Control**: Super Admin and Admin roles
- **CSV Upload & Processing**: Bulk domain upload and validation
- **Task Management**: Assign and track validation tasks
- **Data Processing Pipeline**: From upload → in-process → final → completed
- **API Integration**: Seamless integration with main SEO project
- **Activity Logging**: Complete audit trail
- **Security**: Helmet, CORS, rate limiting, input validation

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update database credentials and other settings

3. **Setup database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed initial data
   npm run seed
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📊 Database Management

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

## 🔐 Default Credentials

After seeding, use these credentials:

**Super Admin:**
- Email: `superadmin@guestblog.com`
- Password: `Admin@123`

**Admin Users:**
- Email: `admin1@guestblog.com` / `admin2@guestblog.com`
- Password: `Admin@123`

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── config/            # Configuration files
│   │   ├── database.ts    # Prisma client
│   │   └── constants.ts   # App constants
│   ├── middleware/        # Express middleware
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   ├── routes/            # API routes (to be added)
│   ├── controllers/       # Route controllers (to be added)
│   ├── services/          # Business logic (to be added)
│   ├── utils/             # Utility functions
│   │   └── helpers.ts
│   └── server.ts          # Express app entry point
├── uploads/               # File upload directory
├── .env                   # Environment variables
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🔌 API Endpoints (Coming Soon)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Upload
- `POST /api/upload` - Upload CSV file
- `GET /api/upload/history` - Upload history

### Data In Process
- `GET /api/data-in-process` - List data
- `PUT /api/data-in-process/:id` - Update data
- `DELETE /api/data-in-process/:id` - Delete data

### Data Final
- `GET /api/data-final` - List final data
- `PUT /api/data-final/:id` - Update final data
- `POST /api/data-final/push` - Push to main project

### Completed
- `GET /api/completed` - List completed data
- `GET /api/completed/stats` - Statistics

### Activity Logs
- `GET /api/activity-logs` - List activity logs

### 2FA
- `POST /api/2fa/enable` - Enable 2FA
- `POST /api/2fa/verify` - Verify 2FA code
- `POST /api/2fa/disable` - Disable 2FA

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | MySQL connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `MAIN_PROJECT_API_URL` | Main project API URL | - |
| `MAIN_PROJECT_SERVICE_EMAIL` | Service account email | - |
| `MAIN_PROJECT_SERVICE_PASSWORD` | Service account password | - |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test
```

## 📝 License

Private - Internal Use Only
