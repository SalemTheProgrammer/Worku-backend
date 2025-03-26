import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { rateLimit } from 'express-rate-limit';
import logger from '../utils/logger';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private limiter: any;

  constructor(private configService: ConfigService) {
    const rateLimitMax = this.configService.get<number>('security.rateLimitMax');
    const rateLimitWindowMs = this.configService.get<number>('security.rateLimitWindowMs');

    this.limiter = rateLimit({
      windowMs: rateLimitWindowMs,
      max: rateLimitMax,
      message: {
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later',
        error: 'Too Many Requests'
      },
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        res.status(429).json({
          statusCode: 429,
          message: 'Too many requests from this IP, please try again later',
          error: 'Too Many Requests',
          timestamp: new Date().toISOString()
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}