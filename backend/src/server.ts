import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import activityLogRoutes from './routes/activityLog.routes';
import twoFactorRoutes from './routes/twoFactor.routes';
import uploadRoutes from './routes/upload.routes';
import dataInProcessRoutes from './routes/dataInProcess.routes';
import dataFinalRoutes from './routes/dataFinal.routes';
import dashboardRoutes from './routes/dashboard.routes';
import publisherRoutes from './routes/publisher.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'https://data.usehypwave.com',
    /^http:\/\/127\.0\.0\.1:\d+$/, // Allow any 127.0.0.1 port for browser preview
    /^http:\/\/localhost:\d+$/ // Allow any localhost port
  ],
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Root endpoint - API info
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Guest Blog Validation Tool API is running!',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      dataManagement: '/api/data-in-process',
      dataFinal: '/api/data-final',
      dashboard: '/api/dashboard'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Guest Blog Validation Tool API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/data-in-process', dataInProcessRoutes);
app.use('/api/data-final', dataFinalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/publishers', publisherRoutes);

// Routes to be added in next phases:
// app.use('/api/completed', completedRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Guest Blog Validation Tool - Backend Server              ║
╠════════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                  ║
║  Time: ${new Date().toLocaleString()}                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
