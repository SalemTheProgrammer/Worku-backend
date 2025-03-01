# Worku Hiring Platform

A NestJS-based hiring platform with OTP email verification for company registration.

## Features

- Company registration with professional email validation
- OTP-based email verification
- Swagger API documentation
- Docker support
- Modular architecture
- Production-ready configuration

## Prerequisites

- Node.js (v20 or later)
- npm (v9 or later)
- Docker and Docker Compose (optional)

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd worku-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (use `.env.example` as template):
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
- Set up your SMTP credentials for email sending
- Update JWT secret
- Configure other environment variables as needed

5. Start the development server:
```bash
npm run start:dev
```

### Using Docker

1. Build and start the containers:
```bash
docker-compose up -d
```

2. The API will be available at http://localhost:3000

## API Documentation

Once the application is running, you can access the Swagger documentation at:
http://localhost:3000/api

## API Endpoints

### Company Registration

- `POST /company/register`
  - Register a new company with professional email validation
  - Required fields:
    - nomEntreprise (Company Name)
    - numeroRNE (RNE Number)
    - email (Professional Email)

- `POST /company/verify`
  - Verify company registration using OTP
  - Required fields:
    - email
    - otp

## Development

### Project Structure

```
src/
├── auth/           # Authentication related files
├── company/        # Company registration module
├── otp/           # OTP service and utilities
├── common/        # Shared utilities and configurations
└── main.ts        # Application entry point
```

### Running Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

1. Build the Docker image:
```bash
docker build -t worku-platform .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env worku-platform
```

## Security Considerations

- Update the JWT_SECRET in production
- Use proper SMTP credentials
- Set up appropriate rate limiting
- Use HTTPS in production
- Implement proper email validation

## License

[Your chosen license]
