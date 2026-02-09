"""
ALOT! Platform - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.config import settings
from app.core.database import engine, Base
from app.routes import (
    auth,
    lots,
    entries,
    trivia,
    credits,
    payments,
    fulfillment,
    hosts,
    admin,
)

# Initialize Sentry (if configured)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        environment=settings.ENVIRONMENT,
        traces_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.1,
    )

# Create FastAPI app
app = FastAPI(
    title="ALOT! API",
    description="Marketplace platform for collectible Lot Rooms",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # TODO: Initialize Redis connection
    # TODO: Initialize WebSocket manager
    # TODO: Run startup health checks
    print(f"🚀 ALOT! API starting in {settings.ENVIRONMENT} mode...")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    # TODO: Close Redis connection
    # TODO: Close database connections
    print("👋 ALOT! API shutting down...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "ALOT! API",
        "version": "1.0.0",
        "status": "operational",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # TODO: Add database health check
    # TODO: Add Redis health check
    # TODO: Add Stripe connectivity check
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
        "stripe": "connected",
    }


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(lots.router, prefix="/api/lots", tags=["Lots"])
app.include_router(entries.router, prefix="/api/entries", tags=["Entries"])
app.include_router(trivia.router, prefix="/api/trivia", tags=["Trivia"])
app.include_router(credits.router, prefix="/api/credits", tags=["Credits"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(fulfillment.router, prefix="/api/fulfillment", tags=["Fulfillment"])
app.include_router(hosts.router, prefix="/api/hosts", tags=["Marketplace Hosts"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
