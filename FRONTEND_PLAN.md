# 🎨 Frontend Development Plan - Phase 6

## 📋 Overview

Building a modern, responsive React + TypeScript + Material-UI frontend for the Guest Blog Validation Tool.

## 🛠️ Technology Stack

- **Framework:** React 18 + TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **Styling:** Emotion (MUI's styling solution)

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance
│   │   ├── auth.api.ts            # Auth endpoints
│   │   ├── users.api.ts           # User endpoints
│   │   ├── upload.api.ts          # Upload endpoints
│   │   ├── data.api.ts            # Data endpoints
│   │   └── twoFactor.api.ts       # 2FA endpoints
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main layout
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   └── Header.tsx         # Top header
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx      # Login form
│   │   │   ├── TwoFactorForm.tsx  # 2FA verification
│   │   │   └── ProtectedRoute.tsx # Route guard
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorAlert.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   └── dashboard/
│   │       ├── StatCard.tsx       # Statistics card
│   │       └── RecentActivity.tsx # Activity list
│   ├── pages/
│   │   ├── Login.tsx              # Login page
│   │   ├── Dashboard.tsx          # Dashboard
│   │   ├── UploadCSV.tsx          # CSV upload
│   │   ├── DataInProcess.tsx      # Data management
│   │   ├── Users.tsx              # User management
│   │   ├── ActivityLogs.tsx       # Activity logs
│   │   ├── Profile.tsx            # User profile
│   │   └── Setup2FA.tsx           # 2FA setup
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state
│   ├── hooks/
│   │   ├── useAuth.ts             # Auth hook
│   │   └── useToast.ts            # Toast notifications
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── upload.types.ts
│   │   └── data.types.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── theme/
│   │   └── theme.ts               # MUI theme
│   ├── App.tsx                    # Main app
│   ├── index.tsx                  # Entry point
│   └── routes.tsx                 # Route configuration
├── package.json
├── tsconfig.json
└── .env
```

## 🎯 Pages to Build

### 1. Login Page ✅
- Email/password form
- 2FA code input (if enabled)
- Remember me option
- Error handling
- Redirect after login

### 2. Dashboard 📊
- Statistics cards (users, tasks, data)
- Recent uploads chart
- Recent activity feed
- Quick actions
- Role-based content

### 3. CSV Upload 📤
- File upload dropzone
- CSV template download
- Upload progress
- Validation results
- Duplicate detection results
- Success/error summary

### 4. Data In Process 📋
- Data table with pagination
- Filters (status, task, date)
- Edit data inline
- Bulk actions (verify, reject, push)
- Export functionality
- Status badges

### 5. User Management 👥
- User list table
- Add/edit user modal
- Role management
- Toggle active status
- Delete user
- User statistics

### 6. Activity Logs 📜
- Activity table
- Filters (user, action, date)
- Search functionality
- Export logs
- Detailed view modal

### 7. Profile ⚙️
- User information
- Change password
- 2FA setup/disable
- Activity history
- Preferences

### 8. 2FA Setup 🔐
- QR code display
- Backup codes display
- Verification step
- Success confirmation
- Download backup codes

## 🎨 UI/UX Features

### Design System
- **Primary Color:** Blue (#1976d2)
- **Secondary Color:** Orange (#ff9800)
- **Success:** Green (#4caf50)
- **Error:** Red (#f44336)
- **Warning:** Orange (#ff9800)
- **Info:** Blue (#2196f3)

### Components
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support (optional)
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error boundaries
- ✅ Confirmation dialogs
- ✅ Form validation
- ✅ Data tables with sorting/filtering
- ✅ File upload with drag & drop
- ✅ Charts and graphs

## 🔐 Authentication Flow

```
1. User enters email/password
   ↓
2. Backend checks credentials
   ↓
3a. If 2FA disabled → Return JWT token
3b. If 2FA enabled → Request 2FA code
   ↓
4. User enters 2FA code
   ↓
5. Backend verifies code
   ↓
6. Return JWT token
   ↓
7. Store token in localStorage
   ↓
8. Redirect to Dashboard
```

## 📡 API Integration

### Axios Configuration
```typescript
// Base URL: http://localhost:5000/api
// Headers: Authorization: Bearer {token}
// Interceptors: Token refresh, error handling
```

### React Query Setup
```typescript
// Query keys
// Cache management
// Automatic refetching
// Optimistic updates
```

## 🚀 Features by Role

### Super Admin
- ✅ All features
- ✅ User management
- ✅ CSV upload
- ✅ Push to main project
- ✅ Delete data
- ✅ View all activity logs

### Admin
- ✅ View assigned tasks
- ✅ Edit data in process
- ✅ Update status
- ✅ View own activity logs
- ❌ No user management
- ❌ No CSV upload
- ❌ No delete
- ❌ No push to main project

## 📱 Responsive Breakpoints

- **Mobile:** < 600px
- **Tablet:** 600px - 960px
- **Desktop:** > 960px

## 🧪 Testing Strategy

- Unit tests: React Testing Library
- Integration tests: API mocking
- E2E tests: Cypress (optional)

## 📦 Dependencies

```json
{
  "@mui/material": "^5.x",
  "@mui/icons-material": "^5.x",
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x",
  "@tanstack/react-query": "^5.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "date-fns": "^3.x"
}
```

## 🎯 Development Phases

### Phase 6.1: Setup & Core (30 min)
- [x] Create React app
- [ ] Install dependencies
- [ ] Setup folder structure
- [ ] Configure theme
- [ ] Create API client
- [ ] Setup React Query
- [ ] Create Auth context

### Phase 6.2: Authentication (45 min)
- [ ] Login page
- [ ] 2FA verification
- [ ] Protected routes
- [ ] Auth context
- [ ] Token management

### Phase 6.3: Layout & Navigation (30 min)
- [ ] App layout
- [ ] Sidebar navigation
- [ ] Header with user menu
- [ ] Responsive design

### Phase 6.4: Dashboard (30 min)
- [ ] Statistics cards
- [ ] Charts
- [ ] Recent activity
- [ ] Quick actions

### Phase 6.5: CSV Upload (45 min)
- [ ] Upload form
- [ ] File validation
- [ ] Progress indicator
- [ ] Results display
- [ ] Template download

### Phase 6.6: Data Management (60 min)
- [ ] Data table
- [ ] Filters and search
- [ ] Edit functionality
- [ ] Bulk actions
- [ ] Status management

### Phase 6.7: User Management (45 min)
- [ ] User list
- [ ] Add/edit user
- [ ] Role management
- [ ] Delete user

### Phase 6.8: Additional Pages (45 min)
- [ ] Activity logs
- [ ] Profile page
- [ ] 2FA setup
- [ ] Settings

### Phase 6.9: Polish & Testing (30 min)
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Responsive fixes
- [ ] Testing

**Total Estimated Time:** 6-7 hours

## 🌟 Key Features

1. **Modern UI** - Clean, professional Material-UI design
2. **Responsive** - Works on all devices
3. **Fast** - React Query caching and optimization
4. **Secure** - JWT authentication, protected routes
5. **User-Friendly** - Intuitive navigation, clear feedback
6. **Accessible** - WCAG compliant
7. **Maintainable** - TypeScript, clean code structure

## 📝 Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Guest Blog Validation Tool
```

## 🚀 Getting Started

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Build for production
npm run build
```

---

**Status:** 🔄 In Progress  
**Next:** Install dependencies and create core structure
