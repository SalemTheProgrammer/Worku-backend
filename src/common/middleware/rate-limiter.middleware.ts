import { Injectable, NestMiddleware, RequestMethod } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly limiter = new RateLimiterMemory({
    points: 1000, // Increased from 100 to 1000 points
    duration: 60, // Changed to 1 minute instead of 15 minutes for better user experience
  });

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Skip rate limiting for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    try {
      let pointsToRemove = 1;
      let duration = 900; // Default 15 minutes
      let points = 100;

      // Route-specific rate limits
      if (req.url.includes('/applications/apply')) {
        pointsToRemove = 1;
        duration = 3600; // 1 hour
        points = 100; // Increased to 100 requests per hour
      } else if (req.url.includes('/applications/statistiques')) {
        pointsToRemove = 1;
        duration = 300; // 5 minutes
        points = 200; // Increased to 200 requests per 5 minutes
      } else if (req.url.includes('/applications/analyse')) {
        pointsToRemove = 1;
        duration = 300; // 5 minutes
        points = 150; // Increased to 150 requests per 5 minutes
      } else if (req.url.includes('/auth')) {
        pointsToRemove = 1;
        duration = 300; // 5 minutes
        points = 50; // Auth endpoints have stricter limits
      }

      const ip = req.ip || '127.0.0.1'; // Default IP if undefined
      const rateLimiterRes: RateLimiterRes = await this.limiter.consume(ip, pointsToRemove);

      res.setHeader('X-RateLimit-Limit', points);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toUTCString());

      next();
    } catch (rejRes) {
      // Preserve CORS headers even when rate limited
      if (req.headers.origin) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
      res.status(429).json({
        statusCode: 429,
        message: 'Too Many Requests',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      });
    }
  }
}