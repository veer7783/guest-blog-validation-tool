import { body } from 'express-validator';
import { handleValidationErrors } from './validator';

// Enable 2FA validation
export const validateEnable2FA = [
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  handleValidationErrors
];

// Disable 2FA validation
export const validateDisable2FA = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  handleValidationErrors
];

// Verify backup code validation
export const validateBackupCode = [
  body('backupCode')
    .notEmpty()
    .withMessage('Backup code is required')
    .isLength({ min: 8, max: 8 })
    .withMessage('Backup code must be 8 characters'),
  handleValidationErrors
];

// Regenerate backup codes validation
export const validateRegenerateBackupCodes = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];
