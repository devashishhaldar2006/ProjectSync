import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/projectsync_db?schema=public',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_123',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_456',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresInDays: parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '7', 10),
  },
  env: process.env.NODE_ENV || 'development',
};
