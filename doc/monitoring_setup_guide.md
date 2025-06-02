# Grafana & Prometheus Monitoring Setup Guide

This guide provides complete setup instructions for integrating Grafana and Prometheus monitoring into your NestJS application.

## 📊 Overview

This monitoring setup includes:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and alerting
- **Node Exporter**: System metrics
- **Redis Exporter**: Redis metrics
- **MongoDB Exporter**: Database metrics
- **Custom NestJS Metrics**: Application-specific metrics

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NestJS App    │───▶│   Prometheus    │───▶│    Grafana      │
│  (Port 3000)    │    │  (Port 9090)    │    │  (Port 3001)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Custom Metrics  │    │  Node Exporter  │    │   Dashboards    │
│ - HTTP requests │    │  (Port 9100)    │    │   - System      │
│ - DB queries    │    │                 │    │   - Application │
│ - Queue jobs    │    │                 │    │   - Database    │
│ - Errors        │    │                 │    │   - Alerts      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 File Structure

```
monitoring/
├── docker-compose.monitoring.yml
├── prometheus/
│   ├── prometheus.yml
│   └── alerts.yml
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── prometheus.yml
│   │   └── dashboards/
│   │       ├── dashboard.yml
│   │       ├── system-metrics.json
│   │       ├── application-metrics.json
│   │       ├── database-metrics.json
│   │       └── business-metrics.json
│   └── grafana.ini
└── exporters/
    ├── mongodb-exporter.yml
    └── redis-exporter.yml
```

## 🚀 Docker Compose Configuration

### Main Monitoring Stack (docker-compose.monitoring.yml)

```yaml
version: '3.8'

services:
  # Prometheus for metrics collection
  prometheus:
    image: prom/prometheus:latest
    container_name: lintern-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    networks:
      - monitoring

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: lintern-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=lintern123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/grafana.ini:/etc/grafana/grafana.ini
    networks:
      - monitoring
    depends_on:
      - prometheus

  # Node Exporter for system metrics
  node-exporter:
    image: prom/node-exporter:latest
    container_name: lintern-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: lintern-redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://host.docker.internal:6379
    networks:
      - monitoring

  # MongoDB Exporter
  mongodb-exporter:
    image: percona/mongodb_exporter:latest
    container_name: lintern-mongodb-exporter
    ports:
      - "9216:9216"
    environment:
      - MONGODB_URI=mongodb://salem:5ecfbb1352dcca479b4b084c@cluster0.yyhfd.mongodb.net/lintern?retryWrites=true&w=majority&appName=Cluster0
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

## ⚙️ Prometheus Configuration

### prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  # NestJS Application Metrics
  - job_name: 'lintern-api'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  # System Metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Redis Metrics
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # MongoDB Metrics
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  # Prometheus Self-Monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### alerts.yml
```yaml
groups:
  - name: lintern-alerts
    rules:
      # High Error Rate Alert
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      # High Response Time Alert
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      # Database Connection Alert
      - alert: DatabaseConnectionIssue
        expr: mongodb_up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "MongoDB connection lost"
          description: "MongoDB is unreachable"

      # Redis Connection Alert
      - alert: RedisConnectionIssue
        expr: redis_up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection lost"
          description: "Redis is unreachable"

      # High Memory Usage Alert
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      # High CPU Usage Alert
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"
```

## 📊 NestJS Metrics Integration

### Install Required Packages

```bash
npm install prom-client @prometheus-io/client nestjs-prometheus
npm install --save-dev @types/prom-client
```

### Metrics Module (src/monitoring/metrics.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'lintern_',
        },
      },
    }),
  ],
  providers: [MetricsService, PerformanceInterceptor],
  controllers: [MetricsController],
  exports: [MetricsService, PerformanceInterceptor],
})
export class MetricsModule {}
```

### Custom Metrics Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  // HTTP Request Metrics
  private readonly httpRequestsTotal = new Counter({
    name: 'lintern_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'lintern_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  // Database Metrics
  private readonly dbQueriesTotal = new Counter({
    name: 'lintern_db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['collection', 'operation'],
  });

  private readonly dbQueryDuration = new Histogram({
    name: 'lintern_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['collection', 'operation'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  });

  // Queue Metrics
  private readonly queueJobsTotal = new Counter({
    name: 'lintern_queue_jobs_total',
    help: 'Total number of queue jobs',
    labelNames: ['queue', 'status'],
  });

  private readonly queueJobDuration = new Histogram({
    name: 'lintern_queue_job_duration_seconds',
    help: 'Queue job processing duration in seconds',
    labelNames: ['queue'],
    buckets: [1, 5, 10, 30, 60, 120, 300],
  });

  // Business Metrics
  private readonly activeUsers = new Gauge({
    name: 'lintern_active_users',
    help: 'Number of active users',
    labelNames: ['type'], // candidate, company
  });

  private readonly jobApplicationsTotal = new Counter({
    name: 'lintern_job_applications_total',
    help: 'Total number of job applications',
    labelNames: ['status'],
  });

  constructor() {
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.dbQueriesTotal);
    register.registerMetric(this.dbQueryDuration);
    register.registerMetric(this.queueJobsTotal);
    register.registerMetric(this.queueJobDuration);
    register.registerMetric(this.activeUsers);
    register.registerMetric(this.jobApplicationsTotal);
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, route: string, status: number) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
  }

  recordHttpDuration(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration.observe(
      { method, route, status: status.toString() },
      duration / 1000, // Convert ms to seconds
    );
  }

  // Database Metrics Methods
  recordDbQuery(collection: string, operation: string) {
    this.dbQueriesTotal.inc({ collection, operation });
  }

  recordDbQueryDuration(collection: string, operation: string, duration: number) {
    this.dbQueryDuration.observe({ collection, operation }, duration / 1000);
  }

  // Queue Metrics Methods
  recordQueueJob(queue: string, status: string) {
    this.queueJobsTotal.inc({ queue, status });
  }

  recordQueueJobDuration(queue: string, duration: number) {
    this.queueJobDuration.observe({ queue }, duration / 1000);
  }

  // Business Metrics Methods
  setActiveUsers(type: string, count: number) {
    this.activeUsers.set({ type }, count);
  }

  recordJobApplication(status: string) {
    this.jobApplicationsTotal.inc({ status });
  }
}
```

### Performance Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const method = request.method;
    const route = request.route?.path || request.url;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const status = response.statusCode;

        this.metricsService.recordHttpRequest(method, route, status);
        this.metricsService.recordHttpDuration(method, route, status, duration);
      }),
    );
  }
}
```

## 📈 Grafana Dashboards

### System Metrics Dashboard
- CPU Usage
- Memory Usage
- Disk I/O
- Network Traffic

### Application Metrics Dashboard
- HTTP Request Rate
- Response Time (P50, P95, P99)
- Error Rate
- Active Connections

### Database Metrics Dashboard
- Query Performance
- Connection Pool Status
- Collection Statistics
- Index Usage

### Business Metrics Dashboard
- User Registration Rate
- Job Application Rate
- Interview Scheduling Rate
- Success/Failure Ratios

## 🚀 Quick Start

1. **Start monitoring stack:**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access dashboards:**
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/lintern123)

3. **Add metrics to your NestJS app:**
   ```typescript
   import { MetricsModule } from './monitoring/metrics.module';
   
   @Module({
     imports: [MetricsModule],
   })
   export class AppModule {}
   ```

4. **Add performance interceptor globally:**
   ```typescript
   app.useGlobalInterceptors(new PerformanceInterceptor(metricsService));
   ```

## 🔔 Alerting Rules

The setup includes alerts for:
- High error rates (>10%)
- High response times (>2s)
- Database connectivity issues
- High system resource usage
- Queue job failures

## 📊 Key Metrics to Monitor

### Performance Metrics
- `lintern_http_request_duration_seconds`
- `lintern_db_query_duration_seconds`
- `lintern_queue_job_duration_seconds`

### Business Metrics
- `lintern_job_applications_total`
- `lintern_active_users`
- `lintern_http_requests_total`

### System Metrics
- `node_cpu_usage_percent`
- `node_memory_usage_percent`
- `mongodb_connections`
- `redis_connected_clients`

This monitoring setup provides comprehensive observability into your NestJS application performance, system health, and business metrics.