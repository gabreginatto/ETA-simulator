"""
POST /simulate endpoint for running simulations.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.api.schemas import SimulateRequest, SimulationResponse
from app.engine.solver import solve_plant
from app.api.routes.jar_tests import jar_tests_db

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
async def simulate(request: SimulateRequest) -> Dict[str, Any]:
    """
    Run a dewatering simulation.

    Args:
        request: SimulateRequest containing plant_definition and optional jar_test_id

    Returns:
        SimulationResponse with streams, KPIs, warnings, and errors
    """
    jar_test_optimum_ppm = request.jar_test_optimum_ppm

    # If jar_test_id provided, fetch the jar test and use its optimum dose
    if request.jar_test_id:
        jar_test = jar_tests_db.get(request.jar_test_id)
        if not jar_test:
            raise HTTPException(
                status_code=404,
                detail=f"Jar test not found: {request.jar_test_id}",
            )
        # Use jar test optimum unless explicitly overridden
        if jar_test_optimum_ppm is None:
            jar_test_optimum_ppm = jar_test.analysis.optimum_dose_ppm

    # Run the simulation
    try:
        result = solve_plant(
            plant_definition=request.plant_definition,
            jar_test_optimum_ppm=jar_test_optimum_ppm,
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

    Returns validation errors and warnings.
    """
    from app.engine.solver import validate_plant_definition

    errors = validate_plant_definition(request.plant_definition)

    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }
