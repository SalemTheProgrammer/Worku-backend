# Worku MVP Deployment Script for Windows
# This script helps you deploy your Worku hiring platform quickly on Windows

param(
    [switch]$Force = $false
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Test-Docker {
    Write-Status "Checking Docker installation..."
    
    try {
        $dockerVersion = docker --version 2>$null
        $composeVersion = docker-compose --version 2>$null
        
        if (-not $dockerVersion -or -not $composeVersion) {
            throw "Docker or Docker Compose not found"
        }
        
        Write-Success "Docker and Docker Compose are installed"
        return $true
    }
    catch {
        Write-Error "Docker is not installed or not accessible. Please install Docker Desktop first."
        return $false
    }
}

function Test-Environment {
    Write-Status "Checking environment configuration..."
    
    if (-not (Test-Path ".env.production")) {
        Write-Warning "Production environment file not found"
        
        if (Test-Path ".env.production.example") {
            Copy-Item ".env.production.example" ".env.production"
            Write-Warning "Created .env.production from template"
            Write-Host ""
            Write-Host "Required variables to configure:" -ForegroundColor Yellow
            Write-Host "- MONGODB_URI (your MongoDB connection string)" -ForegroundColor White
            Write-Host "- JWT_SECRET (generate with: openssl rand -base64 32)" -ForegroundColor White
            Write-Host "- JWT_REFRESH_SECRET (generate with: openssl rand -base64 32)" -ForegroundColor White
            Write-Host "- GEMINI_API_KEY (your Google Gemini API key)" -ForegroundColor White
            Write-Host "- EMAIL_* variables (your SMTP settings)" -ForegroundColor White
            Write-Host "- CORS_ALLOWED_ORIGINS (your frontend domain)" -ForegroundColor White
            Write-Host ""
            
            if (-not $Force) {
                Read-Host "Press Enter after configuring .env.production"
            }
        }
        else {
            Write-Error ".env.production.example not found"
            return $false
        }
    }
    
    Write-Success "Environment configuration found"
    return $true
}

function Test-EnvironmentVariables {
    Write-Status "Validating environment variables..."
    
    $envContent = Get-Content ".env.production" -Raw
    $missingVars = @()
    
    $requiredVars = @(
        "MONGODB_URI",
        "JWT_SECRET", 
        "GEMINI_API_KEY",
        "EMAIL_HOST",
        "EMAIL_USER",
        "EMAIL_PASSWORD"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "^$var=.+" -or $envContent -match "^$var=$") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host " - $var" -ForegroundColor Red
        }
        return $false
    }
    
    Write-Success "Environment validation passed"
    return $true
}

function Build-Application {
    Write-Status "Building application..."
    
    try {
        npm run deploy:build 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Success "Application built successfully"
        return $true
    }
    catch {
        Write-Error "Failed to build application: $_"
        return $false
    }
}

function Deploy-Application {
    Write-Status "Deploying application..."
    
    try {
        npm run deploy:prod 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Deployment failed"
        }
        Write-Success "Application deployed successfully"
        return $true
    }
    catch {
        Write-Error "Failed to deploy application: $_"
        return $false
    }
}

function Wait-ForServices {
    Write-Status "Waiting for services to be ready..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Status "Health check attempt $attempt/$maxAttempts..."
        
        try {
            npm run health:check 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Services are healthy!"
                return $true
            }
        }
        catch {
            # Continue trying
        }
        
        Start-Sleep -Seconds 10
        $attempt++
    }
    
    Write-Error "Services failed to become healthy within expected time"
    Write-Status "Checking logs..."
    npm run deploy:logs
    return $false
}

function Show-DeploymentInfo {
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Worku MVP is now running!" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Service Information:" -ForegroundColor Yellow
    Write-Host "  - API: http://localhost:8080" -ForegroundColor White
    Write-Host "  - Health Check: http://localhost:8080/health" -ForegroundColor White
    Write-Host "  - API Documentation: http://localhost:8080/api" -ForegroundColor White
    Write-Host ""
    Write-Host "🛠️ Management Commands:" -ForegroundColor Yellow
    Write-Host "  - View logs: npm run deploy:logs" -ForegroundColor White
    Write-Host "  - Stop services: npm run deploy:stop" -ForegroundColor White
    Write-Host "  - Restart: npm run deploy:prod" -ForegroundColor White
    Write-Host "  - Health check: npm run health:check" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test your API endpoints at http://localhost:8080/api" -ForegroundColor White
    Write-Host "  2. Configure your domain and SSL certificate" -ForegroundColor White
    Write-Host "  3. Set up monitoring and backups" -ForegroundColor White
    Write-Host "  4. Update CORS_ALLOWED_ORIGINS for your frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Yellow
    Write-Host "  - README.md - Complete project documentation" -ForegroundColor White
    Write-Host "  - DEPLOYMENT.md - Detailed deployment guide" -ForegroundColor White
    Write-Host "  - API docs at /api endpoint" -ForegroundColor White
    Write-Host ""
}

function Main {
    Write-Host "🚀 Worku MVP Deployment Script" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    
    # Pre-deployment checks
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-Environment)) { exit 1 }
    if (-not (Test-EnvironmentVariables)) { exit 1 }
    
    Write-Host ""
    Write-Status "All pre-deployment checks passed!"
    Write-Host ""
    
    # Build and deploy
    if (-not (Build-Application)) { exit 1 }
    Write-Host ""
    
    if (-not (Deploy-Application)) { exit 1 }
    Write-Host ""
    
    # Wait for services
    if (-not (Wait-ForServices)) { exit 1 }
    Write-Host ""
    
    # Show success information
    Show-DeploymentInfo
}

try {
    Main
}
catch {
    Write-Error "Deployment failed: $_"
    Write-Status "Cleaning up..."
    try {
        npm run deploy:stop 2>$null | Out-Null
    }
    catch {
        # Ignore cleanup errors
    }
    exit 1
}