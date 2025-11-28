"""
FastAPI main application entry point for SludgeSim.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import simulate, projects, jar_tests
from app.db.database import init_db, close_db, AsyncSessionLocal
from app.db.seed_data import seed_database, get_default_plant_definition

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    logger.info("Starting SludgeSim API...")

    # Validate and log database configuration
    settings.validate_and_log_database()

    # Initialize database tables
    # Note: In production, use 'alembic upgrade head' before starting the app.
    # For development, we still use create_all() for convenience.
    await init_db()
    logger.info("Database tables initialized")

    # Seed database with initial data
    async with AsyncSessionLocal() as session:
        await seed_database(session)
        logger.info("Seed data loaded")

    yield

    # Shutdown
    logger.info("Shutting down SludgeSim API...")
    await close_db()


app = FastAPI(
    title="SludgeSim API",
    description="""
## Sludge Dewatering Simulation Platform API

SludgeSim provides simulation and optimization tools for wastewater sludge dewatering operations.

### Features
- **Simulation**: Run mass balance calculations for dewatering processes
- **Jar Tests**: Manage polymer dosing optimization data
- **Projects**: Save and load plant configurations

### Quick Start
1. Create or select a jar test with optimum polymer dose
2. Configure your plant parameters (feed flow, solids, equipment settings)
3. Run a simulation to get KPIs and mass balance results
""",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    simulate.router,
    prefix="/api",
    tags=["Simulation"],
)
app.include_router(
    projects.router,
    prefix="/api",
    tags=["Projects"],
)
app.include_router(
    jar_tests.router,
    prefix="/api",
    tags=["Jar Tests"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to SludgeSim API",
        "description": "Sludge Dewatering Simulation Platform",
        "version": "0.2.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "simulate": "/api/simulate",
            "projects": "/api/projects",
            "jar_tests": "/api/jar-tests",
        },
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/default-config", tags=["Configuration"])
async def get_default_config():
    """Get the default plant configuration template."""
    return get_default_plant_definition()
