"""
POST /simulate endpoint for running simulations.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import SimulateRequest, SimulationResponse
from app.engine.solver import solve_plant
from app.db.database import get_db
from app.db.models import JarTestModel

router = APIRouter()


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Run a dewatering simulation",
    description="""
Run a complete sludge dewatering simulation with the provided plant configuration.

The simulation calculates:
- Mass balance through feed, conditioning, and dewatering stages
- Polymer consumption and costs
- Cake production metrics
- Liquid (centrate/filtrate) quality estimates

Optionally link a jar test to automatically use its optimum polymer dose.
""",
    responses={
        200: {"description": "Simulation completed successfully"},
        400: {"description": "Invalid plant configuration"},
        404: {"description": "Referenced jar test not found"},
        422: {"description": "Validation error in parameters"},
    },
)
async def simulate(
    request: SimulateRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Run a dewatering simulation.

    Args:
        request: SimulateRequest containing plant_definition and optional jar_test_id

    Returns:
        SimulationResponse with streams, KPIs, warnings, and errors
    """
    jar_test_optimum_ppm = request.jar_test_optimum_ppm
    jar_test_range = None

    # If jar_test_id provided, fetch the jar test and use its optimum dose and range
    if request.jar_test_id:
        result = await db.execute(
            select(JarTestModel).where(JarTestModel.id == request.jar_test_id)
        )
        jar_test = result.scalar_one_or_none()

        if not jar_test:
            raise HTTPException(
                status_code=404,
                detail=f"Jar test not found: {request.jar_test_id}",
            )
        # Use jar test optimum unless explicitly overridden
        if jar_test_optimum_ppm is None:
            jar_test_optimum_ppm = jar_test.analysis.get("optimum_dose_ppm")
        # Extract acceptable range for validation
        jar_test_range = {
            "acceptable_range_min_ppm": jar_test.analysis.get("acceptable_range_min_ppm"),
            "acceptable_range_max_ppm": jar_test.analysis.get("acceptable_range_max_ppm"),
        }

    # Run the simulation
    try:
        result = solve_plant(
            plant_definition=request.plant_definition,
            jar_test_optimum_ppm=jar_test_optimum_ppm,
            jar_test_range=jar_test_range,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}",
        )

    # Check for errors in result
    if result["errors"]:
        raise HTTPException(
            status_code=422,
            detail="; ".join(result["errors"]),
        )

    return result


@router.post(
    "/simulate/validate",
    summary="Validate plant configuration",
    description="Validate a plant configuration without running the simulation.",
)
async def validate_configuration(request: SimulateRequest) -> Dict[str, Any]:
    """
    Validate plant configuration without running simulation.

    Returns validation errors and warnings with paths for inline display.
    """
    from app.engine.solver import validate_plant_definition

    validation_results = validate_plant_definition(request.plant_definition)

    # Separate errors and warnings
    errors = [e for e in validation_results if e.get("severity") == "error"]
    warnings = [e for e in validation_results if e.get("severity") == "warning"]

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }
