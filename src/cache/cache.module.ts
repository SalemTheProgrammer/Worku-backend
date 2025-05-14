import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST') || 'localhost',
        port: configService.get('REDIS_PORT') || 6379,
        ttl: 900,
        max: 100,
        isGlobal: true,
        retryStrategy: (times: number) => {
          // retry 5 times with exponential backoff
          if (times >= 5) return null;
          return Math.min(times * 100, 3000);
        },
        onClientReady: (client: any) => {
          client.on('error', console.error);
          client.on('ready', () => console.log('Redis client ready'));
          client.on('connect', () => console.log('Redis client connected'));
        }
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class RedisCacheModule {}