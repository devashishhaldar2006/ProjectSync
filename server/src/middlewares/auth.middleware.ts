import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, TokenPayload } from '../types';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No Bearer token provided.', code: 'UNAUTHORIZED' },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: { message: 'Access token expired', code: 'TOKEN_EXPIRED' },
        });
        return;
      }
      res.status(401).json({
        success: false,
        error: { message: 'Invalid access token', code: 'INVALID_TOKEN' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'User associated with token no longer exists', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
