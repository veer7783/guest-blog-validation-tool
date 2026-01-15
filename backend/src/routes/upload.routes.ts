import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/roleCheck';
import { uploadCSV, handleUploadError } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Download CSV template (basic - Site only)
router.get('/template', UploadController.downloadTemplate);

// Download CSV template with price column
router.get('/template-with-price', UploadController.downloadTemplateWithPrice);

// Download comprehensive CSV template with all fields
router.get('/template-full', UploadController.downloadFullTemplate);

// Upload CSV (Super Admin and Contributor, with rate limiting)
router.post(
  '/csv',
  uploadLimiter,
  uploadCSV.single('file'),
  handleUploadError,
  UploadController.uploadCSV
);

// Get all upload tasks
router.get('/tasks', UploadController.getUploadTasks);

// Get upload task statistics
router.get('/tasks/statistics', UploadController.getStatistics);

// Get single upload task
router.get('/tasks/:id', UploadController.getUploadTask);

// Test main project API connection
router.get('/test-connection', UploadController.testMainProjectConnection);

export default router;
