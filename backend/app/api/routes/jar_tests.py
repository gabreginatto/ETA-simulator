"""
JarTest CRUD endpoints.
"""
from datetime import datetime, date
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Query

from app.api.schemas import JarTestCreate, JarTestResponse, JarTestListResponse
from app.models.jar_test import (
    JarTest,
    JarTestSample,
    JarTestPolymer,
    JarTestDose,
    JarTestAnalysis,
)

router = APIRouter()

# In-memory storage for MVP
# TODO: Replace with database integration
jar_tests_db: Dict[str, JarTest] = {}

# Counter for generating sequential IDs
_jar_test_counter = 0


def _generate_jar_test_id() -> str:
    """Generate a sequential jar test ID like JT-2024-001."""
    global _jar_test_counter
    _jar_test_counter += 1
    year = datetime.now().year
    return f"JT-{year}-{_jar_test_counter:03d}"


@router.get(
    "/jar-tests",
    response_model=JarTestListResponse,
    summary="List all jar tests",
    description="Get a list of all saved jar tests.",
)
async def list_jar_tests(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max items to return"),
) -> Dict[str, Any]:
    """List all jar tests with pagination."""
    all_tests = list(jar_tests_db.values())
    # Sort by date descending (most recent first)
    all_tests.sort(key=lambda t: t.date, reverse=True)

    total = len(all_tests)
    items = all_tests[skip : skip + limit]

    return {
        "items": [_jar_test_to_response(t) for t in items],
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
async def get_jar_test(jar_test_id: str) -> Dict[str, Any]:
    """Get a single jar test by ID."""
    jar_test = jar_tests_db.get(jar_test_id)
    if not jar_test:
        raise HTTPException(
            status_code=404,
            detail=f"Jar test not found: {jar_test_id}",
        )
    return _jar_test_to_response(jar_test)


@router.post(
    "/jar-tests",
    response_model=JarTestResponse,
    status_code=201,
    summary="Create a new jar test",
    description="Create a new jar test record with dose data and analysis.",
)
async def create_jar_test(request: JarTestCreate) -> Dict[str, Any]:
    """Create a new jar test."""
    jar_test_id = _generate_jar_test_id()
    now = datetime.utcnow()

    # Parse date string
    try:
        test_date = date.fromisoformat(request.date)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format: {request.date}. Use YYYY-MM-DD.",
        )

    jar_test = JarTest(
        id=jar_test_id,
        date=test_date,
        sample=request.sample,
        polymer=request.polymer,
        doses=request.doses,
        analysis=request.analysis,
        notes=request.notes,
        created_at=now,
        updated_at=now,
    )

    jar_tests_db[jar_test_id] = jar_test
    return _jar_test_to_response(jar_test)


@router.put(
    "/jar-tests/{jar_test_id}",
    response_model=JarTestResponse,
    summary="Update a jar test",
    description="Update an existing jar test with new data.",
    responses={
        404: {"description": "Jar test not found"},
    },
)
async def update_jar_test(jar_test_id: str, request: JarTestCreate) -> Dict[str, Any]:
    """Update an existing jar test (full replacement)."""
    if jar_test_id not in jar_tests_db:
        raise HTTPException(
            status_code=404,
            detail=f"Jar test not found: {jar_test_id}",
        )

    existing = jar_tests_db[jar_test_id]

    # Parse date string
    try:
        test_date = date.fromisoformat(request.date)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format: {request.date}. Use YYYY-MM-DD.",
        )

    jar_test = JarTest(
        id=jar_test_id,
        date=test_date,
        sample=request.sample,
        polymer=request.polymer,
        doses=request.doses,
        analysis=request.analysis,
        notes=request.notes,
        created_at=existing.created_at,
        updated_at=datetime.utcnow(),
    )

    jar_tests_db[jar_test_id] = jar_test
    return _jar_test_to_response(jar_test)


@router.delete(
    "/jar-tests/{jar_test_id}",
    status_code=204,
    summary="Delete a jar test",
    description="Permanently delete a jar test by ID.",
    responses={
        404: {"description": "Jar test not found"},
    },
)
async def delete_jar_test(jar_test_id: str):
    """Delete a jar test."""
    if jar_test_id not in jar_tests_db:
        raise HTTPException(
            status_code=404,
            detail=f"Jar test not found: {jar_test_id}",
        )

    del jar_tests_db[jar_test_id]
    return None


def _jar_test_to_response(jar_test: JarTest) -> Dict[str, Any]:
    """Convert JarTest to response format."""
    return {
        "id": jar_test.id,
        "date": jar_test.date.isoformat(),
        "sample": jar_test.sample.model_dump(),
        "polymer": jar_test.polymer.model_dump(),
        "doses": [d.model_dump() for d in jar_test.doses],
        "analysis": jar_test.analysis.model_dump(),
        "notes": jar_test.notes,
        "created_at": jar_test.created_at,
        "updated_at": jar_test.updated_at,
    }


# Export for use in other modules
def get_jar_tests_db() -> Dict[str, JarTest]:
    """Get reference to jar tests database."""
    return jar_tests_db
