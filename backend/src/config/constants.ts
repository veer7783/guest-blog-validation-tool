// Categories
export const CATEGORIES = [
  'TECHNOLOGY',
  'HEALTH',
  'FINANCE',
  'BUSINESS',
  'LIFESTYLE',
  'EDUCATION',
  'TRAVEL',
  'FOOD',
  'FASHION',
  'SPORTS',
  'ENTERTAINMENT',
  'REAL_ESTATE',
  'AUTOMOTIVE',
  'HOME_GARDEN',
  'PARENTING',
  'PETS',
  'OTHER'
] as const;

// Countries
export const COUNTRIES = [
  'US', 'UK', 'CA', 'AU', 'IN', 'DE', 'FR', 'ES', 'IT', 'NL',
  'SE', 'NO', 'DK', 'FI', 'IE', 'NZ', 'SG', 'MY', 'PH', 'TH',
  'ID', 'VN', 'JP', 'KR', 'CN', 'HK', 'TW', 'BR', 'MX', 'AR',
  'CL', 'CO', 'PE', 'ZA', 'NG', 'KE', 'EG', 'AE', 'SA', 'OTHER'
] as const;

// Languages
export const LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'no', 'da',
  'fi', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'id', 'th',
  'vi', 'tr', 'other'
] as const;

// Process Status
export const PROCESS_STATUS = {
  PENDING: 'PENDING',
  REACHED: 'REACHED',
  NOT_REACHED: 'NOT_REACHED',
  NO_ACTION: 'NO_ACTION'
} as const;

// Site Status
export const SITE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

// Negotiation Status
export const NEGOTIATION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
} as const;

// Task Status
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
} as const;

// Activity Log Actions
export const ACTIVITY_ACTIONS = {
  UPLOAD: 'UPLOAD',
  ASSIGN: 'ASSIGN',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  MOVE_TO_FINAL: 'MOVE_TO_FINAL',
  PUSH: 'PUSH',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  TWO_FA_ENABLE: '2FA_ENABLE',
  TWO_FA_DISABLE: '2FA_DISABLE'
} as const;

// File Upload
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
export const ALLOWED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel'];
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
