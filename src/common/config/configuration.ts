type Config = {
  port: number;
  database: {
    host: string;
    port: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  otp: {
    expiresIn: number;
    length: number;
  };
  security: {
    rateLimitMax: number;
    rateLimitWindowMs: number;
    helmet: {
      contentSecurityPolicy: boolean;
      crossOriginEmbedderPolicy: boolean;
      crossOriginOpenerPolicy: boolean;
      crossOriginResourcePolicy: boolean;
      dnsPrefetchControl: boolean;
      frameguard: boolean;
      hidePoweredBy: boolean;
      hsts: boolean;
      ieNoOpen: boolean;
      noSniff: boolean;
      referrerPolicy: boolean;
      xssFilter: boolean;
    };
    gracefulShutdownTimeout: number;
  };
  mongodb: {
    uri: string;
  };
  redis: {
    host: string;
    port: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  logging: {
    level: string;
    maxFiles: string;
    maxSize: string;
  };
  gemini: {
    apiKey: string;
  };
};

export default (): Config => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || 'user@example.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    from: process.env.EMAIL_FROM || 'noreply@worku.com',
  },
  otp: {
    expiresIn: parseInt(process.env.OTP_EXPIRES_IN || '300', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },
  security: {
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    helmet: {
      contentSecurityPolicy: process.env.HELMET_CSP !== 'false',
      crossOriginEmbedderPolicy: process.env.HELMET_COEP !== 'false',
      crossOriginOpenerPolicy: process.env.HELMET_COOP !== 'false',
      crossOriginResourcePolicy: process.env.HELMET_CORP !== 'false',
      dnsPrefetchControl: process.env.HELMET_DNS_PREFETCH !== 'false',
      frameguard: process.env.HELMET_FRAMEGUARD !== 'false',
      hidePoweredBy: true,
      hsts: process.env.HELMET_HSTS !== 'false',
      ieNoOpen: process.env.HELMET_IE_NO_OPEN !== 'false',
      noSniff: process.env.HELMET_NO_SNIFF !== 'false',
      referrerPolicy: process.env.HELMET_REFERRER_POLICY !== 'false',
      xssFilter: process.env.HELMET_XSS_FILTER !== 'false',
    },
    gracefulShutdownTimeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '10000', 10),
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lintern',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:4200').split(','),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: process.env.LOG_MAX_FILES || '30d',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
});