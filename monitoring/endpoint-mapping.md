# Lintern API Endpoint Monitoring Mapping

This document shows how your specific API endpoints are mapped to Grafana dashboard panels and Prometheus metrics.

## 📊 Dashboard Overview

### 1. **Lintern API Endpoints Dashboard** (`lintern-api-endpoints`)
- **URL**: http://localhost:3001/d/lintern-api-endpoints
- **Purpose**: Real-time monitoring of all API endpoints grouped by functionality

### 2. **Lintern Business Metrics Dashboard** (`lintern-business-metrics`)
- **URL**: http://localhost:3001/d/lintern-business-metrics
- **Purpose**: Key performance indicators and business metrics

## 🎯 Endpoint Categories & Monitoring

### 👤 **Candidate Authentication Endpoints**
**Dashboard Panel**: "🧑‍💼 Candidate Authentication Endpoints"

| Endpoint | Method | Metrics Tracked |
|----------|--------|----------------|
| `/auth/candidate/register` | POST | Registration rate, success/failure |
| `/auth/candidate/login` | POST | Login attempts, success rate |
| `/auth/candidate/verify-otp` | POST | OTP verification success |
| `/auth/candidate/request-password-reset` | POST | Password reset requests |
| `/auth/candidate/reset-password` | POST | Password reset completion |

**Prometheus Queries**:
```promql
# Registration rate
rate(lintern_http_requests_total{route="/auth/candidate/register", status="201"}[5m])

# Login success rate
rate(lintern_http_requests_total{route="/auth/candidate/login", status="200"}[5m]) / rate(lintern_http_requests_total{route="/auth/candidate/login"}[5m]) * 100
```

### 🏢 **Company Authentication Endpoints**
**Dashboard Panel**: "🏢 Company Authentication Endpoints"

| Endpoint | Method | Metrics Tracked |
|----------|--------|----------------|
| `/auth/company/register` | POST | Company registration rate |
| `/auth/company/login/initiate` | POST | Login initiation attempts |
| `/auth/company/login/verify` | POST | Login verification success |
| `/auth/company/verify` | POST | Email verification |
| `/auth/company/refresh-token` | POST | Token refresh requests |

### 💼 **Job Management Endpoints**
**Dashboard Panel**: "💼 Job Management Endpoints"

| Endpoint | Method | Metrics Tracked |
|----------|--------|----------------|
| `/jobs/create` | POST | New job posting rate |
| `/jobs/list` | GET | Job search requests |
| `/jobs/search` | GET | Search queries |
| `/jobs/my-jobs` | GET | Company job viewing |
| `/jobs/:jobId` | GET | Job detail views |
| `/jobs/:jobId` | DELETE | Job deletion rate |
| `/jobs/:jobId/seen` | POST | Job view tracking |

**Business Metrics**:
```promql
# Job creation rate per hour
rate(lintern_http_requests_total{route="/jobs/create", status="201"}[1h]) * 3600

# Job view rate
rate(lintern_http_requests_total{route=~"/jobs/.*/seen"}[5m])
```

### 📝 **Application Management Endpoints**
**Dashboard Panel**: "📝 Application Management Endpoints"

| Endpoint | Method | Metrics Tracked |
|----------|--------|----------------|
| `/applications` | POST | Job application submissions |
| `/applications` | GET | Application list views |
| `/applications/:id` | GET | Application detail views |
| `/applications/:id` | DELETE | Application withdrawals |
| `/applications/candidate/applications` | GET | Candidate application history |

**Key Metrics**:
```promql
# Application submission rate
rate(lintern_job_applications_total{status="submitted"}[5m])

# Application response time
histogram_quantile(0.95, rate(lintern_http_request_duration_seconds_bucket{route="/applications", method="POST"}[5m]))
```

### 🗓️ **Interview Management Endpoints**
**Dashboard Panel**: "🗓️ Interview Management Endpoints"

| Endpoint | Method | Metrics Tracked |
|----------|--------|----------------|
| `/interviews/schedule` | POST | Interview scheduling rate |
| `/interviews/confirm/:token` | GET | Interview confirmations |
| `/interviews/application/:applicationId` | GET | Interview queries by application |
| `/interviews/candidate/:candidateId` | GET | Candidate interview history |
| `/interviews/scheduled` | GET | Scheduled interview views |
| `/interviews/add-to-future` | POST | Future interview additions |

### 📄 **CV Management Endpoints**
**Dashboard Panel**: "📄 CV Management Endpoints"

| Endpoint | Method | Metrics Tracked |
|----------|--------|----------------|
| `/auth/candidate/profile/cv` | POST | CV uploads |
| `/auth/candidate/profile/cv` | GET | CV downloads |
| `/auth/candidate/profile/cv/analyze` | POST | CV analysis requests |
| `/auth/candidate/profile/cv/job-match` | POST | Job matching requests |
| `/candidate/cv-profile/extract` | POST | CV profile extraction |

**Queue Metrics**:
```promql
# CV analysis processing time
histogram_quantile(0.95, rate(lintern_queue_job_duration_seconds_bucket{queue="cv-analysis"}[5m]))

# CV analysis success rate
rate(lintern_queue_jobs_total{queue="cv-analysis", status="completed"}[5m]) / rate(lintern_queue_jobs_total{queue="cv-analysis"}[5m])
```

### 🔍 **Profile Management Endpoints**

| Category | Endpoints | Metrics |
|----------|-----------|---------|
| **Candidate Profile** | `/auth/candidate/profile/*` | Profile updates, completions |
| **Company Profile** | `/company/profile/*` | Company profile updates |
| **Skills** | `/auth/candidate/skills/*` | Skill additions/updates |
| **Experience** | `/candidate/experience/*` | Experience management |
| **Education** | `/auth/candidate/education/*` | Education updates |
| **Certifications** | `/auth/candidate/certifications/*` | Certification management |

### 📊 **Business Intelligence Endpoints**

| Endpoint | Method | Business Metric |
|----------|--------|----------------|
| `/recommended-jobs` | GET | Job recommendation usage |
| `/candidate-journal` | GET | Candidate activity tracking |
| `/company-journal` | GET | Company activity tracking |
| `/rejections` | POST | Rejection reason tracking |
| `/health` | GET | System health monitoring |

## 🎯 **Key Performance Indicators (KPIs)**

### Registration Funnel
1. **Registration Attempts**: `rate(lintern_http_requests_total{route=~"/auth/.*/register"}[1h])`
2. **Registration Success**: `rate(lintern_http_requests_total{route=~"/auth/.*/register", status="201"}[1h])`
3. **Email Verification**: `rate(lintern_http_requests_total{route=~"/auth/.*/verify"}[1h])`

### Job Application Funnel
1. **Job Views**: `rate(lintern_http_requests_total{route=~"/jobs/.*", method="GET"}[1h])`
2. **Applications Started**: `rate(lintern_http_requests_total{route="/applications", method="POST"}[1h])`
3. **Applications Completed**: `rate(lintern_job_applications_total{status="submitted"}[1h])`

### Interview Conversion
1. **Applications Submitted**: `lintern_job_applications_total{status="submitted"}`
2. **Interviews Scheduled**: `rate(lintern_http_requests_total{route="/interviews/schedule"}[1h])`
3. **Interviews Confirmed**: `rate(lintern_http_requests_total{route=~"/interviews/confirm/.*"}[1h])`

## 🚨 **Critical Alerts**

### Performance Alerts
```promql
# High response time for job applications
histogram_quantile(0.95, rate(lintern_http_request_duration_seconds_bucket{route="/applications"}[5m])) > 3

# High error rate on critical endpoints
rate(lintern_http_requests_total{route=~"/auth/.*/login", status=~"5.."}[5m]) > 0.05
```

### Business Alerts
```promql
# Low job application rate
rate(lintern_job_applications_total{status="submitted"}[1h]) < 5

# High CV analysis failure rate
rate(lintern_queue_jobs_total{queue="cv-analysis", status="failed"}[5m]) > 0.1
```

## 📈 **Dashboard Usage Guide**

### Accessing Dashboards
1. **Open Grafana**: http://localhost:3001
2. **Login**: admin / lintern123
3. **Navigate to Dashboards**:
   - "Lintern API Endpoints Dashboard" - Real-time endpoint monitoring
   - "Lintern Business Metrics" - Business KPIs and trends
   - "Lintern Overview" - System overview

### Key Panels to Monitor
1. **HTTP Request Rate** - Monitor API usage patterns
2. **Response Time P95** - Ensure good user experience
3. **Error Rate** - Track system reliability
4. **Business Metrics** - Monitor platform growth
5. **Queue Performance** - Track background job processing

### Creating Custom Views
1. Use time range selector for specific periods
2. Filter by endpoint using regex patterns
3. Set up alerts for critical thresholds
4. Export data for reporting

## 🔧 **Customization Options**

### Adding New Endpoint Monitoring
1. **Update MetricsService**: Add new endpoint tracking methods
2. **Create Dashboard Panel**: Add new panel with appropriate PromQL queries
3. **Set Alert Rules**: Define thresholds for new endpoints

### Business Metric Customization
1. **Custom Counters**: Track specific business events
2. **Histogram Metrics**: Monitor processing times
3. **Gauge Metrics**: Track current state values

This mapping ensures complete visibility into your Lintern platform's performance and business metrics.