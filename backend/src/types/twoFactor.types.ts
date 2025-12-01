// 2FA Setup Response
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

// 2FA Verify Request
export interface TwoFactorVerifyRequest {
  code: string;
}

// 2FA Enable Request
export interface TwoFactorEnableRequest {
  code: string;
}

// 2FA Disable Request
export interface TwoFactorDisableRequest {
  password: string;
  code: string;
}

// Backup Code Verify Request
export interface BackupCodeVerifyRequest {
  backupCode: string;
}

// 2FA Status Response
export interface TwoFactorStatusResponse {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  backupCodesRemaining?: number;
}
