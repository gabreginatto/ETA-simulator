"""
Project CRUD endpoints with async database.
"""
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.db.database import get_db
from app.db.models import ProjectModel

router = APIRouter()


@router.get(
    "/projects",
    response_model=ProjectListResponse,
    summary="List all projects",
    description="Get a paginated list of all saved projects.",
)
async def list_projects(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max items to return"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """List all projects with pagination."""
    # Get total count
    count_result = await db.execute(select(func.count(ProjectModel.id)))
    total = count_result.scalar() or 0

    # Get paginated items, sorted by updated_at descending
    result = await db.execute(
        select(ProjectModel)
        .order_by(ProjectModel.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    projects = result.scalars().all()

    return {
        "items": [p.to_dict() for p in projects],
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
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get a single project by ID."""
    result = await db.execute(
        select(ProjectModel).where(ProjectModel.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found: {project_id}",
        )
    return project.to_dict()


@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=201,
    summary="Create a new project",
    description="Create a new project with the provided configuration.",
)
async def create_project(
    request: ProjectCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Create a new project."""
    project_id = str(uuid.uuid4())
    now = datetime.utcnow()

    project = ProjectModel(
        id=project_id,
        name=request.name,
        description=request.description,
        plant_configuration=request.plant_configuration.model_dump(),
        jar_test_id=request.jar_test_id,
        created_at=now,
        updated_at=now,
    )

    db.add(project)
    await db.flush()
    await db.refresh(project)

    return project.to_dict()


@router.put(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
    description="Update an existing project with new data.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def update_project(
    project_id: str,
    request: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Update an existing project."""
    result = await db.execute(
        select(ProjectModel).where(ProjectModel.id == project_id)
    )
    project = result.scalar_one_or_none()

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
        project.plant_configuration = update_data["plant_configuration"]
    if "jar_test_id" in update_data:
        project.jar_test_id = update_data["jar_test_id"]

    # Always update timestamp
    project.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(project)

    return project.to_dict()


@router.delete(
    "/projects/{project_id}",
    status_code=204,
    summary="Delete a project",
    description="Permanently delete a project by ID.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a project."""
    result = await db.execute(
        select(ProjectModel).where(ProjectModel.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"Project not found: {project_id}",
        )

    await db.delete(project)
    return None
