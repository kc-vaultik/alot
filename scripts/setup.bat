@echo off
REM ALOT! Platform - Windows Setup Script

echo ========================================
echo ALOT! Platform Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop/
    exit /b 1
)

echo [OK] Docker found

REM Check if .env exists
if not exist .env (
    echo [INFO] Creating .env from template...
    copy .env.example .env
    echo [WARN] Please edit .env and add your Stripe API keys!
    echo.
    pause
)

REM Start Docker Compose
echo.
echo [INFO] Starting Docker containers...
docker-compose up -d

REM Wait for services to be ready
echo.
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check health
echo.
echo [INFO] Checking service health...
curl -s http://localhost:8006/health

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Frontend:  http://localhost:3004
echo Backend:   http://localhost:8006
echo API Docs:  http://localhost:8006/api/docs
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause
