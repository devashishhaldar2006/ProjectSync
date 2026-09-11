import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { initSocketServer } from './sockets/socketManager';
import { startOverdueScheduler } from './jobs/overdueScheduler';

// Routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', userRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Initialize WebSockets
initSocketServer(server);

// Start Overdue Scheduler Background Job
startOverdueScheduler();

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`[Server] ProjectSync server running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${config.env}`);
});

export { app, server };
