# API Testing Guide - Authentication & User Management

## 🚀 Base URL
```
http://localhost:5000/api
```

## 📋 Available Endpoints

### Authentication Endpoints

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@guestblog.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "superadmin@guestblog.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "isActive": true
    }
  }
}
```

#### 2. Get Current User
```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "superadmin@guestblog.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "twoFactorAuth": {
      "isEnabled": false
    }
  }
}
```

#### 3. Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin@123",
  "newPassword": "NewSecure@Pass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 5. Register New User (Super Admin Only)
```http
POST /api/auth/register
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "email": "newadmin@guestblog.com",
  "password": "SecurePass@123",
  "firstName": "New",
  "lastName": "Admin",
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "newadmin@guestblog.com",
    "firstName": "New",
    "lastName": "Admin",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### User Management Endpoints (Super Admin Only)

#### 1. Get All Users
```http
GET /api/users?page=1&limit=50&role=ADMIN&isActive=true&search=john
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `role` (optional): Filter by role (ADMIN, SUPER_ADMIN)
- `isActive` (optional): Filter by status (true, false)
- `search` (optional): Search in email, firstName, lastName

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "admin1@guestblog.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "twoFactorAuth": {
          "isEnabled": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

#### 2. Get User by ID
```http
GET /api/users/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 3. Update User
```http
PUT /api/users/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "newemail@guestblog.com",
  "isActive": true
}
```

#### 4. Delete User
```http
DELETE /api/users/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### 5. Toggle User Status
```http
PATCH /api/users/:id/status
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "id": "uuid",
    "email": "admin1@guestblog.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "isActive": false
  }
}
```

#### 6. Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "active": 3,
    "inactive": 0,
    "superAdmins": 1,
    "admins": 2
  }
}
```

---

### Activity Log Endpoints (Super Admin Only)

#### 1. Get Activity Logs
```http
GET /api/activity-logs?page=1&limit=50&userId=uuid&action=LOGIN&entityType=User&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `entityType` (optional): Filter by entity type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "userId": "uuid",
        "action": "LOGIN",
        "entityType": "User",
        "entityId": "uuid",
        "details": null,
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "uuid",
          "email": "superadmin@guestblog.com",
          "firstName": "Super",
          "lastName": "Admin",
          "role": "SUPER_ADMIN"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

#### 2. Get Log by ID
```http
GET /api/activity-logs/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 Testing with cURL

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@guestblog.com",
    "password": "Admin@123"
  }'
```

### 2. Get Current User (with token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get All Users
```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@guestblog.com",
    "password": "TestPass@123",
    "firstName": "Test",
    "lastName": "Admin",
    "role": "ADMIN"
  }'
```

---

## 🧪 Testing with PowerShell

### 1. Login
```powershell
$body = @{
    email = "superadmin@guestblog.com"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.data.token
Write-Host "Token: $token"
```

### 2. Get Current User
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
    -Method Get `
    -Headers $headers | ConvertTo-Json -Depth 10
```

### 3. Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/users" `
    -Method Get `
    -Headers $headers | ConvertTo-Json -Depth 10
```

---

## 🔐 Default Test Credentials

**Super Admin:**
- Email: `superadmin@guestblog.com`
- Password: `Admin@123`

**Admin 1:**
- Email: `admin1@guestblog.com`
- Password: `Admin@123`

**Admin 2:**
- Email: `admin2@guestblog.com`
- Password: `Admin@123`

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error message"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "No token provided. Please login."
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Access denied. Super Admin privileges required."
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "User not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "message": "Too many requests from this IP, please try again later."
  }
}
```

---

## 📝 Activity Log Actions

- `LOGIN` - User logged in
- `LOGOUT` - User logged out
- `USER_CREATE` - New user created
- `USER_UPDATE` - User updated
- `USER_DELETE` - User deleted
- `USER_STATUS_CHANGE` - User status changed
- `PASSWORD_CHANGE` - Password changed
- `2FA_ENABLE` - 2FA enabled
- `2FA_DISABLE` - 2FA disabled

---

## 🎯 Next Steps

After testing authentication, you can proceed to:
1. **Phase 4:** 2FA Implementation
2. **Phase 5:** CSV Upload & Processing
3. **Phase 6:** Data Management (In Process, Final, Completed)

---

**Server Status:** ✅ Running on http://localhost:5000  
**API Version:** v1  
**Last Updated:** Phase 3 Complete
