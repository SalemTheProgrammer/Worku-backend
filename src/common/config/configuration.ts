import { Logger } from '@nestjs/common';

const logger = new Logger('ConfigurationService');

// Required environment variables
const requiredEnvVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'MONGODB_URI',
  'JWT_SECRET'
];

const parseIntSafe = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export default () => {
  // Validate required environment variables after they've been loaded
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    logger.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const config = {
    port: parseIntSafe(process.env.PORT, 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      dbName: process.env.MONGODB_DB_NAME || 'worku'
    },

    redis: {
      host: process.env.REDIS_HOST || 'redis',
      port: parseIntSafe(process.env.REDIS_PORT, 6379),
      url: process.env.REDIS_URL || 'redis://redis:6379'
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },

    upload: {
      maxFileSize: parseIntSafe(process.env.MAX_FILE_SIZE, 5 * 1024 * 1024), // 5MB default
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'application/pdf'],
      uploadDirectory: process.env.UPLOAD_DIRECTORY || 'uploads'
    },

    api: {
      geminiKey: process.env.GEMINI_API_KEY
    },

    email: {
      host: process.env.EMAIL_HOST,
      port: parseIntSafe(process.env.EMAIL_PORT, 587),
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD, // Changed from pass to password to match EmailService
      from: process.env.EMAIL_FROM
    },

    security: {
      rateLimitWindowMs: parseIntSafe(process.env.RATE_LIMIT_WINDOW_MS, 900000),
      rateLimitMaxRequests: parseIntSafe(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
      gracefulShutdownTimeout: parseIntSafe(process.env.GRACEFUL_SHUTDOWN_TIMEOUT, 10000)
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    },

    features: {
      enableSwagger: process.env.ENABLE_SWAGGER === 'true'
    }
  };

  // Log missing required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'MONGODB_URI',
      'REDIS_HOST',
      'GEMINI_API_KEY',
      'EMAIL_HOST',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM'
    ];

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        logger.warn(`Missing required environment variable: ${varName}`);
      }
    });
  }

  return config;
};
