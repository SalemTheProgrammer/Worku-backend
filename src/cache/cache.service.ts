import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      console.log(`Cache get for key "${key}": ${value ? 'hit' : 'miss'}`);
      return value;
    } catch (error) {
      console.error(`Error getting cache key "${key}":`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 900): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      console.log(`Cache set for key "${key}" with TTL ${ttl}s`);
    } catch (error) {
      console.error(`Error setting cache key "${key}":`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      console.log(`Cache deleted for key "${key}"`);
    } catch (error) {
      console.error(`Error deleting cache key "${key}":`, error);
    }
  }

  generateCacheKey(prefix: string, params?: Record<string, any>): string {
    if (!params) {
      return prefix;
    }
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      }, {});
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  async isStale(key: string): Promise<boolean> {
    const cachedData = await this.cacheManager.get<number>(`${key}:timestamp`);
    if (!cachedData) return true;
    
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    return cachedData < fifteenMinutesAgo;
  }

  async setTimestamp(key: string): Promise<void> {
    await this.cacheManager.set(`${key}:timestamp`, Date.now());
  }
}