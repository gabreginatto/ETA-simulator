"""
JarTest CRUD endpoints with async database.
"""
from datetime import datetime, date as date_type
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import JarTestCreate, JarTestResponse, JarTestListResponse
from app.db.database import get_db
from app.db.models import JarTestModel, JarTestCounterModel

router = APIRouter()


async def generate_jar_test_id(db: AsyncSession) -> str:
    """Generate a sequential jar test ID like JT-2025-001."""
    year = datetime.now().year

    # Get or create counter for current year
    result = await db.execute(
        select(JarTestCounterModel).where(JarTestCounterModel.year == year)
    )
    counter = result.scalar_one_or_none()

    if counter is None:
        counter = JarTestCounterModel(year=year, counter=1)
        db.add(counter)
    else:
        counter.counter += 1

    await db.flush()
    return f"JT-{year}-{counter.counter:03d}"


@router.get(
    "/jar-tests",
    response_model=JarTestListResponse,
    summary="List all jar tests",
    description="Get a list of all saved jar tests.",
)
async def list_jar_tests(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max items to return"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """List all jar tests with pagination."""
    # Get total count
    count_result = await db.execute(select(func.count(JarTestModel.id)))
    total = count_result.scalar() or 0

    # Get paginated items, sorted by date descending
    result = await db.execute(
        select(JarTestModel)
        .order_by(JarTestModel.date.desc())
        .offset(skip)
        .limit(limit)
    )
    jar_tests = result.scalars().all()

    return {
        "items": [jt.to_dict() for jt in jar_tests],
        "total": total,
    }


@router.get(
    "/jar-tests/{jar_test_id}",
    response_model=JarTestResponse,
    summary="Get a jar test by ID",
    description="Retrieve a specific jar test by its unique ID.",
    responses={
        404: {"description": "Jar test not found"},
    },
)
async def get_jar_test(
    jar_test_id: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get a single jar test by ID."""
    result = await db.execute(
        select(JarTestModel).where(JarTestModel.id == jar_test_id)
    )
    jar_test = result.scalar_one_or_none()

    if not jar_test:
        raise HTTPException(
            status_code=404,
            detail=f"Jar test not found: {jar_test_id}",
        )
    return jar_test.to_dict()


@router.post(
    "/jar-tests",
    response_model=JarTestResponse,
    status_code=201,
    summary="Create a new jar test",
    description="Create a new jar test record with dose data and analysis.",
)
async def create_jar_test(
    request: JarTestCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Create a new jar test."""
    # Parse date string
    try:
        test_date = date_type.fromisoformat(request.date)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format: {request.date}. Use YYYY-MM-DD.",
        )

    jar_test_id = await generate_jar_test_id(db)
    now = datetime.utcnow()

    jar_test = JarTestModel(
        id=jar_test_id,
        date=test_date,
        sample=request.sample.model_dump(),
        polymer=request.polymer.model_dump(),
        doses=[d.model_dump() for d in request.doses],
        analysis=request.analysis.model_dump(),
        notes=request.notes,
        created_at=now,
        updated_at=now,
    )

    db.add(jar_test)
    await db.flush()
    await db.refresh(jar_test)

    return jar_test.to_dict()


@router.put(
    "/jar-tests/{jar_test_id}",
    response_model=JarTestResponse,
    summary="Update a jar test",
    description="Update an existing jar test with new data.",
    responses={
        404: {"description": "Jar test not found"},
    },
)
async def update_jar_test(
    jar_test_id: str,
    request: JarTestCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Update an existing jar test (full replacement)."""
    result = await db.execute(
        select(JarTestModel).where(JarTestModel.id == jar_test_id)
    )
    jar_test = result.scalar_one_or_none()

    if not jar_test:
        raise HTTPException(
            status_code=404,
            detail=f"Jar test not found: {jar_test_id}",
        )

    # Parse date string
    try:
        test_date = date_type.fromisoformat(request.date)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format: {request.date}. Use YYYY-MM-DD.",
        )

    # Update fields
    jar_test.date = test_date
    jar_test.sample = request.sample.model_dump()
    jar_test.polymer = request.polymer.model_dump()
    jar_test.doses = [d.model_dump() for d in request.doses]
    jar_test.analysis = request.analysis.model_dump()
    jar_test.notes = request.notes
    jar_test.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(jar_test)

    return jar_test.to_dict()


@router.delete(
    "/jar-tests/{jar_test_id}",
    status_code=204,
    summary="Delete a jar test",
    description="Permanently delete a jar test by ID.",
    responses={
        404: {"description": "Jar test not found"},
    },
)
async def delete_jar_test(
    jar_test_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a jar test."""
    result = await db.execute(
        select(JarTestModel).where(JarTestModel.id == jar_test_id)
    )
    jar_test = result.scalar_one_or_none()

    if not jar_test:
        raise HTTPException(
            status_code=404,
            detail=f"Jar test not found: {jar_test_id}",
        )

    await db.delete(jar_test)
    return None
