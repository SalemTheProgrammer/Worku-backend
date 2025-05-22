import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import logger from './common/utils/logger';

// Set default NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

async function bootstrap() {
  try {
    const nodeEnv = process.env.NODE_ENV;
    console.log(`Starting application in ${nodeEnv} mode`);
    // Create the app with logging configuration
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', nodeEnv === 'production' ? 'log' : 'debug', 'verbose']
    });
    const configService = app.get(ConfigService);

    // CORS must be enabled before any other middleware
    const corsOrigins = configService.get('CORS_ALLOWED_ORIGINS', '').split(',')
      .filter(origin => origin)
      .map(origin => origin.trim());
      
    if (corsOrigins.length === 0) {
      // Fallback for development
      corsOrigins.push(process.env.NODE_ENV === 'production'
        ? 'https://your-frontend-domain.com'
        : 'http://localhost:4200'
      );
    }

    app.enableCors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
      credentials: true,
      optionsSuccessStatus: 204,
    });

    // Enable compression
    app.use(compression());

    // Initialize FileUtils with ConfigService
    await import('./common/utils/file.utils').then(({ FileUtils }) => {
      FileUtils.init(configService);
    });

    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads',
      setHeaders: (res) => {
        // Allow CORS for static files
        const allowedOrigins = configService.get('CORS_ALLOWED_ORIGINS', '').split(',')
          .filter(origin => origin)
          .map(origin => origin.trim());
        const origin = allowedOrigins.length > 0
          ? allowedOrigins[0]
          : process.env.NODE_ENV === 'production'
            ? 'https://your-frontend-domain.com'
            : 'http://localhost:4200';
        
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Range, Authorization');
        res.set('Access-Control-Allow-Credentials', 'true');
        res.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      }
    });

    // Security middleware configuration
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
        xssFilter: true,
        hidePoweredBy: true,
        ieNoOpen: true,
        noSniff: true,
        frameguard: {
          action: 'deny'
        }
      })
    );

    // Rate limiting
    app.use(rateLimit({
      windowMs: configService.get('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
      max: configService.get('RATE_LIMIT_MAX_REQUESTS', 100), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    }));

    // CORS configuration
    // Security middleware configuration

    // Global pipes, interceptors, and filters
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    // Get port number with type safety
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    
    // Swagger setup - only in non-production
    if (process.env.NODE_ENV !== 'production' || configService.get<boolean>('ENABLE_SWAGGER', false)) {
      const config = new DocumentBuilder()
        .setTitle('Worku API')
        .setDescription('The Worku hiring platform API documentation')
        .setVersion('1.0')
        .setContact('Worku Support', 'https://worku.com', 'support@worku.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer(process.env.NODE_ENV === 'production'
          ? configService.get('API_URL', 'https://api.worku.com')
          : `http://localhost:${port}`,
          process.env.NODE_ENV === 'production' ? 'Production' : 'Local Development')
        .addTag('authentication', 'Authentication and authorization endpoints')
        .addTag('company', 'Company profile and management')
        .addTag('candidate', 'Candidate profile and management')
        .addTag('applications', 'Job applications and analysis')
        .addTag('job', 'Job posting and application')
        .addTag('Profile Picture', 'Candidate profile picture management')
        .addTag('CV', 'Candidate CV management')
        .addTag('interviews', 'Interview scheduling and management')
        .addTag('rejections', 'Application rejection management and automated emails')
        .addTag('Journal des Activités - Entreprise', 'Journal des activités pour les entreprises')
        .addTag('Journal des Activités - Candidat', 'Journal des activités pour les candidats')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      
      // Setup Swagger UI at /api
      SwaggerModule.setup('api', app, document);
      
      // Setup route for raw Swagger JSON
      SwaggerModule.setup('api-json', app, document, {
        jsonDocumentUrl: 'api-json',
        useGlobalPrefix: false
      });
    }
    const server = await app.listen(port);
    logger.info(`Application is running on port ${port} in ${nodeEnv} mode`);

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    
    const shutdownGracefully = async (signal: string) => {
      try {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        
        // Close NestJS app
        await app.close();
        logger.info('NestJS application closed');

        // Close HTTP server
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

        // Force close after timeout
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, configService.get<number>('GRACEFUL_SHUTDOWN_TIMEOUT', 10000));

      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    for (const signal of signals) {
      process.on(signal, () => shutdownGracefully(signal));
    }

    // Handle unhandled rejections and exceptions
    // Handle uncaught errors
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Error during application bootstrap:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
