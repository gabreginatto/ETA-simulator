"""
FastAPI main application entry point for SludgeSim.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import simulate, projects, jar_tests
from app.db import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    print("Starting SludgeSim API...")

    # Load seed data into route databases
    from app.api.routes.jar_tests import jar_tests_db as route_jar_tests_db
    from app.api.routes.projects import projects_db as route_projects_db

    # Copy seed data to route databases
    route_jar_tests_db.update(seed_data.jar_tests_db)
    route_projects_db.update(seed_data.projects_db)

    print(f"Loaded {len(route_jar_tests_db)} jar tests")
    print(f"Loaded {len(route_projects_db)} projects")

    yield

    # Shutdown
    print("Shutting down SludgeSim API...")


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
    version="0.1.0",
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
        "version": "0.1.0",
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
    return seed_data.get_default_plant_definition()
