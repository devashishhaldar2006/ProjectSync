import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

/**
 * Strict API-Level RBAC Middleware.
 * Enforces allowed roles. Returns 403 Forbidden if user role is insufficient.
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required before checking permissions', code: 'UNAUTHORIZED' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
          code: 'FORBIDDEN',
        },
      });
      return;
    }

    next();
  };
};
