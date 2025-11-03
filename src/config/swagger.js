import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-Time Polling Platform API',
      version: '1.0.0',
      description: 'A real-time polling application backend with PostgreSQL, Redis, and Express',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);