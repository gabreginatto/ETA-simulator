"""
Project CRUD endpoints.
"""
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query
import uuid

from app.api.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.models.project import Project, PlantConfiguration

router = APIRouter()

# In-memory storage for MVP
# TODO: Replace with database integration
projects_db: Dict[str, Project] = {}


@router.get(
    "/projects",
    response_model=ProjectListResponse,
    summary="List all projects",
    description="Get a paginated list of all saved projects.",
)
async def list_projects(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max items to return"),
) -> Dict[str, Any]:
    """List all projects with pagination."""
    all_projects = list(projects_db.values())
    # Sort by updated_at descending (most recent first)
    all_projects.sort(key=lambda p: p.updated_at, reverse=True)

    total = len(all_projects)
    items = all_projects[skip : skip + limit]

    return {
        "items": [p.model_dump() for p in items],
        "total": total,
    }


@router.get(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Get a project by ID",
    description="Retrieve a specific project by its unique ID.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def get_project(project_id: str) -> Dict[str, Any]:
    """Get a single project by ID."""
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found: {project_id}",
        )
    return project.model_dump()


@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=201,
    summary="Create a new project",
    description="Create a new project with the provided configuration.",
)
async def create_project(request: ProjectCreate) -> Dict[str, Any]:
    """Create a new project."""
    # Generate unique ID
    project_id = str(uuid.uuid4())
    now = datetime.utcnow()

    project = Project(
        id=project_id,
        name=request.name,
        description=request.description,
        plant_configuration=request.plant_configuration,
        jar_test_id=request.jar_test_id,
        created_at=now,
        updated_at=now,
    )

    projects_db[project_id] = project
    return project.model_dump()


@router.put(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
    description="Update an existing project with new data.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def update_project(project_id: str, request: ProjectUpdate) -> Dict[str, Any]:
    """Update an existing project."""
    project = projects_db.get(project_id)
    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found: {project_id}",
        )

    # Update fields if provided
    update_data = request.model_dump(exclude_unset=True)

    if "name" in update_data:
        project.name = update_data["name"]
    if "description" in update_data:
        project.description = update_data["description"]
    if "plant_configuration" in update_data and update_data["plant_configuration"]:
        project.plant_configuration = PlantConfiguration(**update_data["plant_configuration"])
    if "jar_test_id" in update_data:
        project.jar_test_id = update_data["jar_test_id"]

    # Always update timestamp
    project.updated_at = datetime.utcnow()

    projects_db[project_id] = project
    return project.model_dump()


@router.delete(
    "/projects/{project_id}",
    status_code=204,
    summary="Delete a project",
    description="Permanently delete a project by ID.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def delete_project(project_id: str):
    """Delete a project."""
    if project_id not in projects_db:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found: {project_id}",
        )

    del projects_db[project_id]
    return None


# Export for use in seed data
def get_projects_db() -> Dict[str, Project]:
    """Get reference to projects database."""
    return projects_db
