import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { MainProjectAPIService } from '../services/mainProjectAPI.service';

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

export default router;
