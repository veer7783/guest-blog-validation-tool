import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from './errorHandler';

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(
      new AppError('Access denied. Super Admin privileges required.', 403)
    );
  }

  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return next(
      new AppError('Access denied. Admin privileges required.', 403)
    );
  }

  next();
};

// Alias for consistency
export const isSuperAdmin = requireSuperAdmin;
export const isAdmin = requireAdmin;
