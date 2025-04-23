import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet, { crossOriginResourcePolicy } from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import logger from './common/utils/logger';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);

    // Initialize FileUtils with ConfigService
    await import('./common/utils/file.utils').then(({ FileUtils }) => {
      FileUtils.init(configService);
    });

    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads',
      setHeaders: (res) => {
        // Allow CORS for static files
        res.set('Access-Control-Allow-Origin', configService.get('cors.origin'));
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Range');
        res.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      }
    });

    // Security middleware
    app.use(helmet({
      crossOriginResourcePolicy: true
    }));

    // CORS configuration
    app.enableCors({
      origin: configService.get('cors.origin'),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: configService.get('cors.credentials'),
      allowedHeaders: 'Content-Type, Accept, Authorization',
      preflightContinue: false,
      optionsSuccessStatus: 204
    });

    // Global pipes, interceptors, and filters
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    // Swagger setup
    const port = configService.get('port');

    const config = new DocumentBuilder()
      .setTitle('Worku API')
      .setDescription('The Worku hiring platform API documentation')
      .setVersion('1.0')
      .setContact('Worku Support', 'https://worku.com', 'support@worku.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:' + port, 'Local Development')
      .addServer('https://api.worku.com', 'Production')
      .addTag('authentication', 'Authentication and authorization endpoints')
      .addTag('company', 'Company profile and management')
      .addTag('candidate', 'Candidate profile and management')
      .addTag('job', 'Job posting and application')
      .addTag('Profile Picture', 'Candidate profile picture management')
      .addTag('CV', 'Candidate CV management')
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
    const server = await app.listen(port);
    logger.info(`Application is running on: http://localhost:${port}`);

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        
        try {
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
          }, configService.get('security.gracefulShutdownTimeout'));
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    }

    // Handle unhandled rejections and exceptions
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

bootstrap();
