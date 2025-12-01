// CSV Upload Types

export interface CSVRow {
  websiteUrl: string;
  category?: string;
  language?: string;
  country?: string;
  daRange?: string;
  price?: string;
  linkType?: string;
  tat?: string;
  publisherName?: string;
  publisherEmail?: string;
  publisherContact?: string;
  notes?: string;
}

export interface ParsedCSVData {
  validRows: CSVRow[];
  invalidRows: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
  source?: 'main_project' | 'data_in_process' | 'data_final';
}

export interface BulkDuplicateCheckResult {
  duplicates: Array<{
    websiteUrl: string;
    isDuplicate: boolean;
    existingId?: string;
    source?: string;
  }>;
  duplicateCount: number;
  uniqueCount: number;
}

export interface UploadTaskCreateRequest {
  fileName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  assignedTo?: string;
}

export interface UploadTaskUpdateRequest {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  processedRecords?: number;
  duplicateRecords?: number;
  pushedRecords?: number;
  notes?: string;
}

export interface DataInProcessCreateRequest {
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
  uploadTaskId: string;
}

export interface DataInProcessUpdateRequest {
  publisherEmail?: string;
  publisherName?: string;
  publisherContact?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  category?: string;
  country?: string;
  language?: string;
  tat?: string;
  daRange?: string;
  price?: number;
  linkType?: string;
  notes?: string;
  status?: 'PENDING' | 'REACHED' | 'NOT_REACHED' | 'NO_ACTION' | 'NO_ACTION_NEEDED' | 'VERIFIED' | 'REJECTED' | 'PUSHED';
}

export interface PushToMainProjectRequest {
  dataIds: string[];
}

export interface PushToMainProjectResponse {
  success: boolean;
  pushedCount: number;
  failedCount: number;
  results: Array<{
    dataId: string;
    success: boolean;
    mainProjectId?: string;
    error?: string;
  }>;
}

export interface MainProjectAPIResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
