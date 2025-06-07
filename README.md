# 🚀 Worku - Hiring Platform API

A comprehensive job matching and recruitment platform built with NestJS, featuring AI-powered CV analysis, intelligent job recommendations, and a complete hiring workflow.

## 🌟 Features

### Core Functionality
- **🔐 Secure Authentication** - JWT-based auth with refresh tokens
- **👥 Dual User Types** - Companies and Candidates with role-based access
- **💼 Job Management** - Complete job posting, application, and tracking system
- **🤖 AI-Powered CV Analysis** - Automated CV parsing and candidate matching
- **📧 Email Integration** - Automated notifications and communication
- **📊 Analytics Dashboard** - Company insights and recruitment metrics
- **🔍 Smart Job Recommendations** - AI-driven job matching for candidates
- **📱 File Management** - CV uploads, profile images, and company logos
- **🕒 Interview Scheduling** - Complete interview management system

### Technical Features
- **🛡️ Production Security** - Helmet, rate limiting, CORS, validation
- **📈 Monitoring** - Health checks, metrics, and performance tracking
- **🗄️ Database** - MongoDB with optimized schemas and indexing
- **⚡ Caching** - Redis-based caching for improved performance
- **📋 Queue Management** - Bull queue for background job processing
- **📖 API Documentation** - Comprehensive Swagger/OpenAPI documentation
- **🐳 Docker Support** - Complete containerization with multi-stage builds
- **🧪 Testing** - Unit and integration tests with Jest

## 🛠️ Technology Stack

- **Backend**: NestJS (Node.js), TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis with Bull Queue
- **Authentication**: JWT with Passport
- **AI Integration**: Google Gemini API
- **Email**: Nodemailer with templating
- **File Processing**: Multer, PDF parsing
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Prometheus metrics, Winston logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- Redis 6+
- Docker & Docker Compose (recommended)

### Option 1: Docker Deployment (Recommended)

1. **Clone and setup**:
```bash
git clone <your-repo-url>
cd worku-backend
```

2. **Configure environment**:
```bash
cp .env.production.example .env.production
# Edit .env.production with your actual values
```

3. **Deploy with Docker**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Verify deployment**:
```bash
curl http://localhost:8080/health
```

### Option 2: Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Setup environment**:
```bash
cp .env.production.example .env
# Configure your local environment variables
```

3. **Start services** (MongoDB, Redis):
```bash
docker-compose up -d redis
# Start your MongoDB instance
```

4. **Run the application**:
```bash
npm run start:prod
```

## 📖 API Documentation

Once deployed, access the interactive API documentation:

- **Swagger UI**: `http://your-domain/api`
- **OpenAPI JSON**: `http://your-domain/api-json`
- **Health Check**: `http://your-domain/health`

## 🔑 Key API Endpoints

### Authentication
```
POST /api/v1/auth/register/company    - Register company
POST /api/v1/auth/register/candidate  - Register candidate  
POST /api/v1/auth/login              - User login
POST /api/v1/auth/refresh            - Refresh JWT token
```

### Job Management
```
GET    /api/v1/jobs                  - List jobs (with filters)
POST   /api/v1/jobs                  - Create job posting
GET    /api/v1/jobs/:id              - Get job details
PUT    /api/v1/jobs/:id              - Update job
DELETE /api/v1/jobs/:id              - Delete job
```

### Applications
```
POST /api/v1/jobs/:id/apply          - Apply to job
GET  /api/v1/applications            - Get user applications
PUT  /api/v1/applications/:id/status - Update application status
```

### AI Features
```
POST /api/v1/candidates/analyze-cv   - AI CV analysis
GET  /api/v1/recommended-jobs        - Get job recommendations
POST /api/v1/jobs/:id/analyze-candidates - Analyze job applicants
```

## 🔧 Configuration

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/worku
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret

# External APIs
GEMINI_API_KEY=your-gemini-api-key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Application
FRONTEND_URL=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Optional Configuration
- `RATE_LIMIT_MAX_REQUESTS=100` - API rate limiting
- `MAX_FILE_SIZE=5242880` - File upload size limit (5MB)
- `ENABLE_SWAGGER=false` - Enable/disable API docs in production
- `LOG_LEVEL=info` - Logging level

## 🐳 Production Deployment

### Docker Deployment Steps

1. **Prepare environment**:
```bash
# Create production environment file
cp .env.production.example .env.production
# Configure all required variables
```

2. **Build and deploy**:
```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

3. **Health verification**:
```bash
# Check application health
curl http://localhost:8080/health

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

### Cloud Deployment

For cloud deployment (AWS, GCP, Azure), you'll need:

1. **External MongoDB** (MongoDB Atlas recommended)
2. **External Redis** (ElastiCache, Cloud Memorystore, etc.)
3. **File Storage** (S3, Google Cloud Storage, Azure Blob)
4. **Domain & SSL** certificate
5. **Environment variables** configured in your cloud platform

## 📊 Monitoring & Health

- **Health endpoint**: `/health` - Application and service status
- **Metrics endpoint**: `/metrics` - Prometheus metrics
- **Logs**: Winston-based structured logging
- **Graceful shutdown**: Proper cleanup on termination

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate limiting** (100 requests/15 minutes by default)
- **Helmet security headers**
- **CORS protection**
- **Input validation** with class-validator
- **Password hashing** with bcrypt
- **File upload validation**
- **SQL injection protection** (NoSQL)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

## 📝 Development

```bash
# Start in development mode
npm run start:dev

# Build for production
npm run build:prod

# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 API Integration Examples

### Company Registration
```javascript
const response = await fetch('/api/v1/auth/register/company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: "Tech Corp",
    firstName: "John",
    lastName: "Doe",
    email: "john@techcorp.com",
    password: "SecurePass123!",
    phoneNumber: "+1234567890",
    industry: "Technology"
  })
});
```

### Job Creation
```javascript
const response = await fetch('/api/v1/jobs', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: "Senior Developer",
    description: "Join our amazing team...",
    skills: ["JavaScript", "Node.js", "React"],
    salary: { min: 80000, max: 120000, currency: "USD" },
    location: "Remote",
    contractType: "FULL_TIME"
  })
});
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api`
- Review the health status at `/health`

---

**Ready for production deployment!** 🚀