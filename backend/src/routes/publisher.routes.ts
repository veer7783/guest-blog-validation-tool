import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { MainProjectAPIService } from '../services/mainProjectAPI.service';
import prisma from '../config/database';
import { AuthRequest } from '../types';

const router = Router();

/**
 * GET /api/publishers
 * Fetch all publishers from main project
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await MainProjectAPIService.fetchPublishers();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.publishers
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch publishers from main project'
      });
    }
  } catch (error: any) {
    console.error('Fetch publishers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/publishers/search
 * Search publishers by email or name
 */
router.get('/search', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
      return;
    }

    const result = await MainProjectAPIService.searchPublishers(query);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.publishers
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to search publishers'
      });
    }
  } catch (error: any) {
    console.error('Search publishers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/publishers/by-email/:email
 * Get publisher by email - returns publisher name
 */
router.get('/by-email/:email', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    const result = await MainProjectAPIService.getPublisherByEmail(email);
    
    if (result.success && result.publisher) {
      res.json({
        success: true,
        data: result.publisher
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Publisher not found'
      });
    }
  } catch (error: any) {
    console.error('Get publisher by email error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/publishers
 * Create a new publisher in main project (Super Admin only)
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is Super Admin
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only Super Admin can create publishers'
      });
      return;
    }

    const { name, email, dataFinalId, dataInProcessId } = req.body;

    console.log('Mark as Publisher request:', { name, email, dataFinalId, dataInProcessId });

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Publisher name is required'
      });
      return;
    }

    // Create local publisher record (will be synced to main tool when site is pushed)
    const result = await MainProjectAPIService.createPublisher({ name, email });

    console.log('createPublisher result:', result);

    if (result.success && result.publisher) {
      // If dataFinalId is provided, update the DataFinal record with the new publisher
      if (dataFinalId) {
        // Use the email from the request (original contact email) if result.publisher.email is null
        const publisherEmail = result.publisher.email || email;
        console.log('Updating DataFinal record:', dataFinalId, 'with publisher:', result.publisher, 'email:', publisherEmail);
        await prisma.dataFinal.update({
          where: { id: dataFinalId },
          data: {
            publisherId: result.publisher.id,
            publisherName: result.publisher.publisherName,
            publisherEmail: publisherEmail,
            publisherMatched: true,
            contactName: null,
            contactEmail: null
          }
        });
        console.log('DataFinal record updated successfully');
      }

      // If dataInProcessId is provided, update the DataInProcess record with the new publisher
      if (dataInProcessId) {
        const publisherEmailForProcess = result.publisher.email || email;
        await prisma.dataInProcess.update({
          where: { id: dataInProcessId },
          data: {
            publisherId: result.publisher.id,
            publisherName: result.publisher.publisherName,
            publisherEmail: publisherEmailForProcess,
            publisherMatched: true
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Publisher created successfully',
        data: result.publisher
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create publisher'
      });
    }
  } catch (error: any) {
    console.error('Create publisher error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
