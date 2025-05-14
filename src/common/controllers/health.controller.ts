import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    @InjectConnection() private readonly mongoConnection: Connection,
    @InjectQueue('cv-analysis') private cvAnalysisQueue: Queue
  ) {}

  private async checkMongoConnection(): Promise<boolean> {
    try {
      return this.mongoConnection.readyState === 1;
    } catch (error) {
      return false;
    }
  }

  private async checkRedisConnection(): Promise<boolean> {
    try {
      await this.cvAnalysisQueue.isReady();
      return true;
    } catch (error) {
      return false;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application health information',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok'
        },
        version: {
          type: 'string',
          example: '1.0.0'
        },
        timestamp: {
          type: 'string',
          example: '2025-03-20T15:35:46.789Z'
        }
      }
    }
  })
  async getHealth() {
    const [mongoStatus, redisStatus] = await Promise.all([
      this.checkMongoConnection(),
      this.checkRedisConnection()
    ]);

    const status = mongoStatus && redisStatus ? 'healthy' : 'degraded';

    if (!mongoStatus && !redisStatus) {
      throw new ServiceUnavailableException('Critical services are down');
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
      },
      version: this.configService.get('version', '1.0.0')
    };
  }
}