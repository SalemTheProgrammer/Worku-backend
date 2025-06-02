import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register, collectDefaultMetrics } from 'prom-client';

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
    // Enable default metrics collection
    collectDefaultMetrics({ prefix: 'lintern_' });
    
    // Register custom metrics
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

  // Specific endpoint tracking methods
  recordCandidateRegistration() {
    this.httpRequestsTotal.inc({ method: 'POST', route: '/auth/candidate/register', status: '201' });
  }

  recordCompanyRegistration() {
    this.httpRequestsTotal.inc({ method: 'POST', route: '/auth/company/register', status: '201' });
  }

  recordJobCreation() {
    this.httpRequestsTotal.inc({ method: 'POST', route: '/jobs/create', status: '201' });
  }

  recordCVUpload() {
    this.httpRequestsTotal.inc({ method: 'POST', route: '/candidate/cv', status: '201' });
  }

  recordInterviewScheduled() {
    this.httpRequestsTotal.inc({ method: 'POST', route: '/interviews/schedule', status: '201' });
  }

  recordLoginAttempt(userType: 'candidate' | 'company', success: boolean) {
    const status = success ? '200' : '401';
    const route = userType === 'candidate' ? '/auth/candidate/login' : '/auth/company/login';
    this.httpRequestsTotal.inc({ method: 'POST', route, status });
  }
}