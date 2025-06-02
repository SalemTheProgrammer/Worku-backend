import { Module } from '@nestjs/common';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  providers: [MetricsService, PerformanceInterceptor],
  controllers: [MetricsController],
  exports: [MetricsService, PerformanceInterceptor],
})
export class MetricsModule {}