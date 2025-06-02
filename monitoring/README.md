# Lintern Monitoring Setup Guide

This directory contains the complete Grafana and Prometheus monitoring setup for the Lintern job platform.

## 🚀 Quick Start

### Prerequisites
1. **Docker Desktop** must be installed and running
2. **Node.js** and **npm** installed
3. **Redis** running locally (for Redis metrics)

### Setup Steps

1. **Install npm dependencies:**
   ```bash
   npm install prom-client @willsoto/nestjs-prometheus
   ```

2. **Start Docker Desktop** (if not already running)

3. **Start the monitoring stack:**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

4. **Restart your NestJS application** to enable metrics collection

5. **Access the dashboards:**
   - **Grafana**: http://localhost:3001 (admin/lintern123)
   - **Prometheus**: http://localhost:9090
   - **App Metrics**: http://localhost:3000/metrics

## 📊 What's Being Monitored

### Application Metrics
- **HTTP Requests**: Rate, duration, status codes
- **Database Queries**: Performance and frequency
- **Queue Jobs**: Processing times and success rates
- **Business Metrics**: User registrations, job applications

### System Metrics
- **CPU Usage**: Real-time CPU utilization
- **Memory Usage**: RAM consumption
- **Disk I/O**: Storage performance
- **Network Traffic**: Bandwidth usage

### Service Health
- **Redis**: Connection status and performance
- **MongoDB**: Database connectivity (if configured)
- **Application**: Health checks and uptime

## 🎯 Key Features

### Real-time Dashboards
- **Lintern Overview**: Main dashboard with key metrics
- **System Performance**: Server resource monitoring
- **Application Performance**: API response times and errors
- **Business Intelligence**: User activity and conversions

### Alerting Rules
- High error rates (>10%)
- Slow response times (>2 seconds)
- High resource usage (>80%)
- Service connectivity issues
- Queue job failures

### Custom Metrics
The NestJS application exposes custom metrics for:
- Job application rates
- User registration trends
- CV processing performance
- Interview scheduling success

## 🔧 Configuration

### Prometheus Configuration
- **File**: `monitoring/prometheus/prometheus.yml`
- **Scrape Interval**: 15 seconds
- **Retention**: 200 hours
- **Targets**: NestJS app, Node Exporter, Redis Exporter

### Grafana Configuration
- **Admin User**: admin
- **Password**: lintern123
- **Data Source**: Prometheus (auto-configured)
- **Dashboards**: Auto-provisioned from JSON files

### Alert Rules
- **File**: `monitoring/prometheus/alerts.yml`
- **Categories**: Performance, System, Business
- **Notification**: Console logs (extend to email/Slack)

## 📈 Using the Dashboards

### Lintern Overview Dashboard
Access at: http://localhost:3001/d/lintern-overview

**Panels Include:**
- HTTP Request Rate
- Response Time (P95)
- CPU Usage
- Memory Usage
- Error Rate
- Active Users

### Creating Custom Dashboards
1. Open Grafana at http://localhost:3001
2. Login with admin/lintern123
3. Click "+" → "Dashboard"
4. Add panels with PromQL queries
5. Save and share

## 🚨 Common Issues & Solutions

### Docker Not Starting
```bash
# Check if Docker Desktop is running
docker --version

# If not installed, download from: https://www.docker.com/products/docker-desktop
```

### Prometheus Not Scraping Metrics
```bash
# Check if NestJS app is running with metrics enabled
curl http://localhost:3000/metrics

# Should return Prometheus format metrics
```

### Grafana Login Issues
```bash
# Reset Grafana admin password
docker exec -it lintern-grafana grafana-cli admin reset-admin-password newpassword
```

### No Data in Dashboards
1. Verify Prometheus is scraping: http://localhost:9090/targets
2. Check NestJS metrics endpoint: http://localhost:3000/metrics
3. Ensure services are on same network

## 🔍 Useful PromQL Queries

### HTTP Performance
```promql
# Request rate per endpoint
rate(lintern_http_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(lintern_http_request_duration_seconds_bucket[5m]))

# Error rate percentage
rate(lintern_http_requests_total{status=~"5.."}[5m]) / rate(lintern_http_requests_total[5m]) * 100
```

### System Resources
```promql
# CPU usage
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
```

### Business Metrics
```promql
# Job applications per hour
rate(lintern_job_applications_total[1h]) * 3600

# Active users
lintern_active_users
```

## 📝 Extending the Setup

### Adding New Metrics
1. Update `src/monitoring/metrics.service.ts`
2. Add new Counter/Histogram/Gauge
3. Call metrics methods in your services
4. Create dashboard panels

### Adding New Exporters
1. Add service to `docker-compose.monitoring.yml`
2. Configure in `monitoring/prometheus/prometheus.yml`
3. Create specific dashboards

### Custom Alerts
1. Edit `monitoring/prometheus/alerts.yml`
2. Add new alerting rules
3. Restart Prometheus container

## 🎯 Performance Optimization

### Metrics Best Practices
- Use appropriate metric types (Counter vs Gauge)
- Add meaningful labels
- Avoid high cardinality labels
- Sample heavy metrics if needed

### Dashboard Performance
- Limit time ranges for heavy queries
- Use recording rules for complex calculations
- Optimize panel refresh intervals

## 🔐 Security Notes

- Change default Grafana password in production
- Restrict network access to monitoring ports
- Use TLS/SSL for external access
- Implement proper authentication for alerts

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)

## 🆘 Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.monitoring.yml logs`
2. Verify service status: `docker-compose -f docker-compose.monitoring.yml ps`
3. Test connectivity: `curl http://localhost:9090/-/healthy`