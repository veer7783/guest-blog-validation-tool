export * from './auth.types';
import type { User } from './auth.types';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UploadTask {
  id: string;
  fileName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  processedRecords: number;
  duplicateRecords: number;
  pushedRecords: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignedTo?: string;
  createdBy: string;
  notes?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  assignedToUser?: User;
  createdByUser?: User;
}

export interface DataInProcess {
  id: string;
  uploadTaskId: string;
  websiteUrl: string;
  category?: string;
  language?: string;
  country?: string;
  daRange?: string;
  price?: number;
  linkType?: string;
  tat?: string;
  publisherName?: string;
  publisherEmail?: string;
  publisherContact?: string;
  notes?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PUSHED';
  createdAt: string;
  updatedAt: string;
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  backupCodesRemaining?: number;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
