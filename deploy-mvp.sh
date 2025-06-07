#!/bin/bash

# Worku MVP Deployment Script
# This script helps you deploy your Worku hiring platform quickly

set -e

echo "🚀 Worku MVP Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if environment file exists
check_environment() {
    if [ ! -f ".env.production" ]; then
        print_warning "Production environment file not found"
        print_status "Creating .env.production from template..."
        
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env.production
            print_warning "Please edit .env.production with your actual values before continuing"
            echo ""
            echo "Required variables to configure:"
            echo "- MONGODB_URI (your MongoDB connection string)"
            echo "- JWT_SECRET (generate with: openssl rand -base64 32)"
            echo "- JWT_REFRESH_SECRET (generate with: openssl rand -base64 32)"
            echo "- GEMINI_API_KEY (your Google Gemini API key)"
            echo "- EMAIL_* variables (your SMTP settings)"
            echo "- CORS_ALLOWED_ORIGINS (your frontend domain)"
            echo ""
            read -p "Press Enter after configuring .env.production..."
        else
            print_error ".env.production.example not found"
            exit 1
        fi
    fi
    
    print_success "Environment configuration found"
}

# Validate critical environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    # Source the environment file
    if [ -f ".env.production" ]; then
        set -a
        source .env.production
        set +a
    fi
    
    missing_vars=()
    
    # Check critical variables
    [ -z "$MONGODB_URI" ] && missing_vars+=("MONGODB_URI")
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
    [ -z "$GEMINI_API_KEY" ] && missing_vars+=("GEMINI_API_KEY")
    [ -z "$EMAIL_HOST" ] && missing_vars+=("EMAIL_HOST")
    [ -z "$EMAIL_USER" ] && missing_vars+=("EMAIL_USER")
    [ -z "$EMAIL_PASSWORD" ] && missing_vars+=("EMAIL_PASSWORD")
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf ' - %s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    if npm run deploy:build; then
        print_success "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi
}

# Deploy the application
deploy_application() {
    print_status "Deploying application..."
    
    if npm run deploy:prod; then
        print_success "Application deployed successfully"
    else
        print_error "Failed to deploy application"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts..."
        
        if npm run health:check 2>/dev/null; then
            print_success "Services are healthy!"
            return 0
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to become healthy within expected time"
    print_status "Checking logs..."
    npm run deploy:logs
    exit 1
}

# Display deployment information
show_deployment_info() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo ""
    echo "Your Worku MVP is now running!"
    echo ""
    echo "📋 Service Information:"
    echo "  - API: http://localhost:8080"
    echo "  - Health Check: http://localhost:8080/health"
    echo "  - API Documentation: http://localhost:8080/api"
    echo ""
    echo "🛠️ Management Commands:"
    echo "  - View logs: npm run deploy:logs"
    echo "  - Stop services: npm run deploy:stop"
    echo "  - Restart: npm run deploy:prod"
    echo "  - Health check: npm run health:check"
    echo ""
    echo "📖 Next Steps:"
    echo "  1. Test your API endpoints at http://localhost:8080/api"
    echo "  2. Configure your domain and SSL certificate"
    echo "  3. Set up monitoring and backups"
    echo "  4. Update CORS_ALLOWED_ORIGINS for your frontend"
    echo ""
    echo "📚 Documentation:"
    echo "  - README.md - Complete project documentation"
    echo "  - DEPLOYMENT.md - Detailed deployment guide"
    echo "  - API docs at /api endpoint"
    echo ""
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Cleaning up..."
        npm run deploy:stop 2>/dev/null || true
    fi
}

# Main deployment flow
main() {
    # Set up cleanup trap
    trap cleanup EXIT
    
    print_status "Starting Worku MVP deployment..."
    echo ""
    
    # Pre-deployment checks
    check_docker
    check_environment
    validate_environment
    
    echo ""
    print_status "All pre-deployment checks passed!"
    echo ""
    
    # Build and deploy
    build_application
    echo ""
    deploy_application
    echo ""
    
    # Wait for services
    wait_for_services
    echo ""
    
    # Show success information
    show_deployment_info
    
    # Remove cleanup trap on success
    trap - EXIT
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"