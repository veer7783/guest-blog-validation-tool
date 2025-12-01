import { Request } from 'express';
import { UserRole } from '@prisma/client';

// Extended Express Request with user data
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  };
}

// JWT Payload
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

// Register Request
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

// Update User Request
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

// Change Password Request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Activity Log Details
export interface ActivityLogDetails {
  [key: string]: any;
}
