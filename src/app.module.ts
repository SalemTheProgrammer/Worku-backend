import { Module, NestModule, MiddlewareConsumer, RequestMethod, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CompanyModule } from './company/company.module';
import { OtpModule } from './otp/otp.module';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { JobModule } from './job/job.module';
import { ApplicationModule } from './application/application.module';
import { HealthModule } from './common/health/health.module';
import { GeminiModule } from './services/gemini.module';
import { InterviewModule } from './interview/interview.module';
import configuration from './common/config/configuration';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379', 10),
          maxRetriesPerRequest: null,
          retryStrategy: (times) => {
            const delay = Math.min(times * 100, 3000);
            console.log(`Retrying Redis connection in ${delay}ms... (attempt ${times})`);
            return delay;
          },
          reconnectOnError: (err) => {
            console.error('Redis connection error:', err.message);
            return true; // Always attempt to reconnect
          }
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: false
        },
        settings: {
          lockDuration: 30000,
          stalledInterval: 30000,
          maxStalledCount: 1
        }
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        return {
          uri,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('MongoDB connected successfully');
            });
            connection.on('error', (error) => {
              console.error('MongoDB connection error:', error);
            });
            connection.on('disconnected', () => {
              console.log('MongoDB disconnected');
            });
            return connection;
          }
        };
      },
      inject: [ConfigService],
    }),
    CompanyModule,
    OtpModule,
    AuthModule,
    CandidateModule,
    JobModule,
    ApplicationModule,
    HealthModule,
    GeminiModule,
    InterviewModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimiterMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'api', method: RequestMethod.ALL },
        { path: 'uploads/*filePath', method: RequestMethod.GET },
        { path: 'public/*filePath', method: RequestMethod.GET },
        { path: 'assets/*filePath', method: RequestMethod.GET }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
