# ALOT! Quick Start Guide

Get the ALOT! platform running locally in under 10 minutes.

## Prerequisites

- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **Node.js 20+** ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Stripe Account** ([Sign up](https://dashboard.stripe.com/register))

## Method 1: Docker Compose (Recommended)

### 1. Clone Repository
```bash
git clone https://github.com/kc-vaultik/alot.git
cd alot
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Stripe keys
# Get keys from: https://dashboard.stripe.com/apikeys
```

### 3. Start Everything
```bash
docker-compose up -d
```

### 4. Access Applications
- **Frontend:** http://localhost:3004
- **Backend API:** http://localhost:8006
- **API Docs:** http://localhost:8006/api/docs

### 5. Stop Services
```bash
docker-compose down
```

## Method 2: Manual Setup

### 1. Database Setup

**Install PostgreSQL:**
```bash
# Windows (using winget)
winget install PostgreSQL.PostgreSQL

# Create database
psql -U postgres
CREATE DATABASE alot;
CREATE USER alot WITH PASSWORD 'alot';
GRANT ALL PRIVILEGES ON DATABASE alot TO alot;
\q
```

**Install Redis:**
```bash
# Windows (using winget)
winget install Redis.Redis
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend
python -m app.main
```

Backend will be available at http://localhost:8006

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3004

### 4. Celery Workers (Optional)

```bash
cd backend
venv\Scripts\activate

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# In another terminal, start Celery Beat
celery -A app.tasks.celery_app beat --loglevel=info
```

## Stripe Webhook Setup (Local Development)

### 1. Install Stripe CLI
```bash
# Windows (using winget)
winget install Stripe.StripeCLI

# macOS
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

### 2. Forward Webhooks
```bash
stripe listen --forward-to localhost:8006/api/webhooks/stripe
```

Copy the webhook signing secret and update your `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Verify Installation

### 1. Check Backend Health
```bash
curl http://localhost:8006/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "stripe": "connected"
}
```

### 2. Check Database
```bash
psql -U alot -d alot
\dt  # List tables
\q   # Quit
```

### 3. Check Redis
```bash
redis-cli ping
# Should return: PONG
```

## Create Admin User

```bash
cd backend
venv\Scripts\activate
python scripts/create_admin.py --email admin@alot.com --password admin123
```

## Seed Test Data

```bash
python scripts/seed_data.py
```

This will create:
- 5 test users
- 10 product classes across all tiers
- 5 active lots (various funding stages)
- Sample entries and purchases

## Common Issues

### Port Already in Use

**Backend (8006):**
```bash
# Windows
netstat -ano | findstr :8006
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8006 | xargs kill
```

**Frontend (3004):**
```bash
# Windows
netstat -ano | findstr :3004
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3004 | xargs kill
```

### Database Connection Fails

```bash
# Check PostgreSQL is running
# Windows
sc query postgresql-x64-15

# macOS
brew services list

# Restart PostgreSQL
# Windows
net stop postgresql-x64-15
net start postgresql-x64-15

# macOS
brew services restart postgresql@15
```

### Redis Connection Fails

```bash
# Check Redis is running
# Windows
sc query Redis

# macOS
brew services list

# Restart Redis
# Windows
net stop Redis
net start Redis

# macOS
brew services restart redis
```

## Development Workflow

### Run Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Backend (Python)
black .
isort .
flake8 .

# Frontend (TypeScript)
npm run format
npm run lint
```

### Database Migrations
```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### View Logs
```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker

# Individual containers
docker logs -f alot_backend
```

## Next Steps

1. **Read Documentation:** Check `/docs` folder for detailed guides
2. **Explore API:** Visit http://localhost:8006/api/docs for interactive API docs
3. **Configure Stripe:** Set up products and webhooks in Stripe dashboard
4. **Customize Settings:** Edit `.env` for your specific requirements
5. **Deploy to Production:** See `docs/DEPLOYMENT_GUIDE.md`

## Useful Commands

```bash
# Check all services
docker-compose ps

# View real-time logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild containers
docker-compose up -d --build

# Clean everything
docker-compose down -v  # WARNING: Deletes database!

# Access database directly
docker-compose exec postgres psql -U alot -d alot

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Support

- **Documentation:** `/docs` folder
- **API Reference:** http://localhost:8006/api/docs
- **Issues:** Create a GitHub issue
- **Email:** support@alot.com

## Security Note

**⚠️ IMPORTANT:** The default `.env.example` contains example values. **NEVER** use these in production. Always:
- Generate new secure JWT secrets
- Use production Stripe keys
- Use strong database passwords
- Enable HTTPS/TLS
- Configure proper CORS origins

---

**Status:** Base Framework Ready
**Last Updated:** February 9, 2026
