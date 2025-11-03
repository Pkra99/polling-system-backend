import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter, publicLimiter } from './middleware/rateLimit.middleware.js';
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import questionRoutes from './routes/question.routes.js';
import publicRoutes from './routes/public.routes.js';
import resultRoutes from './routes/result.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Polling API Documentation',
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Real-Time Polling Platform API',
    version: '1.0.0',
    documentation: `http://localhost:${env.PORT}/api-docs`,
    endpoints: {
      auth: '/api/auth',
      sessions: '/api/sessions',
      public: '/api/public',
      results: '/api/results',
    },
  });
});

// Apply rate limiting
app.use('/api/auth', apiLimiter);
app.use('/api/sessions', apiLimiter);
app.use('/api/questions', apiLimiter);
app.use('/api/public', publicLimiter);
app.use('/api/results', publicLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', questionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/results', resultRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;