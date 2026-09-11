import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import { TokenPayload, AuthenticatedUser } from '../types';

export class AuthService {
  static generateAccessToken(user: AuthenticatedUser): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });
  }

  static async generateAndSaveRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  static async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };

    const accessToken = this.generateAccessToken(authUser);
    const refreshToken = await this.generateAndSaveRefreshToken(user.id);

    return { user: authUser, accessToken, refreshToken };
  }

  static async refreshAccessToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new AppError('Refresh token required', 401, 'MISSING_REFRESH_TOKEN');
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Token rotation: revoke old token and generate new pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const authUser: AuthenticatedUser = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
      role: storedToken.user.role,
      avatarUrl: storedToken.user.avatarUrl,
    };

    const newAccessToken = this.generateAccessToken(authUser);
    const newRefreshToken = await this.generateAndSaveRefreshToken(storedToken.user.id);

    return { user: authUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return;

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }
}
