# 🚀 Worku MVP Deployment Guide

This guide will help you deploy your Worku hiring platform as a production-ready MVP.

## 📋 Pre-Deployment Checklist

### ✅ Required Services
- [ ] **MongoDB Database** (MongoDB Atlas recommended for cloud)
- [ ] **Redis Instance** (ElastiCache, Cloud Memorystore, or self-hosted)
- [ ] **Email Provider** (Gmail, SendGrid, or SMTP service)
- [ ] **AI API Access** (Google Gemini API key)
- [ ] **Domain Name** (for production URLs)
- [ ] **SSL Certificate** (Let's Encrypt or cloud provider)

### ✅ Environment Configuration
- [ ] All environment variables configured in `.env.production`
- [ ] CORS origins set to your frontend domain
- [ ] JWT secrets generated (minimum 32 characters)
- [ ] Email SMTP credentials configured
- [ ] File upload limits appropriate for your use case

## 🌐 Deployment Options

### Option 1: Docker Deployment (Recommended for MVP)

This is the fastest way to get your MVP online:

#### 1. **Prepare Your Server**
```bash
# On your server (Ubuntu/Debian example)
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. **Setup Project**
```bash
# Clone your repository
git clone <your-repo-url>
cd worku-backend

# Setup environment
cp .env.production.example .env.production
nano .env.production  # Configure all variables
```

#### 3. **Deploy Application**
```bash
# Build and start services
npm run deploy:build
npm run deploy:prod

# Verify deployment
npm run health:check

# View logs
npm run deploy:logs
```

#### 4. **Setup Reverse Proxy (Nginx)**
```nginx
# /etc/nginx/sites-available/worku-api
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. **Enable SSL with Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Cloud Platform Deployment

#### Heroku
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Connect MongoDB Atlas and Redis addon
4. Deploy via Git or GitHub integration

#### Railway/Render
1. Connect your GitHub repository
2. Configure environment variables
3. Set build and start commands
4. Deploy automatically on push

#### AWS/GCP/Azure
1. Use container services (ECS, Cloud Run, Container Instances)
2. Configure external databases (RDS, Cloud SQL)
3. Set up load balancers and SSL certificates
4. Configure environment variables in the platform

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Configure network access (add your server IP)
3. Create database user
4. Get connection string for `MONGODB_URI`

### Redis Cloud
1. Create instance at [redis.com](https://redis.com)
2. Get connection URL for `REDIS_URL`

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate app password
3. Use in `EMAIL_PASSWORD`

### SendGrid
1. Create account and verify domain
2. Generate API key
3. Configure SMTP settings

## 🔑 Security Checklist

- [ ] Strong JWT secrets (use `openssl rand -base64 32`)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] CORS configured for your frontend domain only
- [ ] Rate limiting enabled (default: 100 requests/15 minutes)
- [ ] Database credentials secured
- [ ] Environment variables not exposed
- [ ] Regular security updates scheduled

## 📊 Monitoring Setup

### Basic Monitoring
```bash
# Check application health
curl https://api.yourdomain.com/health

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

### Advanced Monitoring (Optional)
- Set up log aggregation (ELK stack, Datadog)
- Configure uptime monitoring (UptimeRobot, Pingdom)
- Set up error tracking (Sentry)
- Monitor performance metrics at `/metrics`

## 🚀 Go-Live Steps

### 1. **Pre-Launch Testing**
```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Test API documentation
curl https://api.yourdomain.com/api

# Test authentication endpoint
curl -X POST https://api.yourdomain.com/api/v1/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test Corp","email":"test@example.com"}'
```

### 2. **Performance Testing**
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test concurrent requests
ab -n 100 -c 10 https://api.yourdomain.com/health
```

### 3. **Backup Strategy**
- Database: Configure automated backups in MongoDB Atlas
- Files: Backup uploads directory regularly
- Environment: Keep secure copy of `.env.production`

### 4. **Launch Checklist**
- [ ] All API endpoints responding correctly
- [ ] Authentication working
- [ ] File uploads functioning
- [ ] Email notifications sending
- [ ] Job recommendations working
- [ ] CV analysis functioning
- [ ] Admin dashboard accessible
- [ ] Documentation accessible at `/api`

## 🔧 Troubleshooting

### Common Issues

#### "Service Unavailable" Error
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs app

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongosh "your-mongodb-uri"

# Check Redis connection
redis-cli -u "your-redis-url" ping
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Fix permissions if needed
sudo chown -R 1000:1000 uploads/
```

## 📈 Scaling Considerations

### For Growth Beyond MVP:
1. **Load Balancing**: Multiple app instances behind load balancer
2. **Database Scaling**: MongoDB sharding or read replicas
3. **File Storage**: Move to cloud storage (S3, Google Cloud Storage)
4. **CDN**: Use CDN for static assets and file downloads
5. **Microservices**: Split into smaller services as needed

## 🆘 Support & Maintenance

### Regular Maintenance Tasks:
- [ ] Monitor application health daily
- [ ] Check logs for errors weekly
- [ ] Update dependencies monthly
- [ ] Backup verification monthly
- [ ] Security updates as available

### Emergency Contacts:
- Application logs: `docker-compose logs -f`
- Health check: `/health` endpoint
- Documentation: `/api` endpoint
- Error tracking: Application logs

---

🎉 **Your Worku MVP is ready for launch!**

Remember to:
1. Start with a small user base
2. Monitor performance closely
3. Gather user feedback
4. Iterate based on real usage patterns
5. Scale infrastructure as needed

Good luck with your MVP launch! 🚀