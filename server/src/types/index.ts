import { Request } from 'express';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface TaskStatusChangePayload {
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
}
