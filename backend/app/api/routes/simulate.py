"""
POST /simulate endpoint for running simulations.

Supports two payload formats:
1. Graph-based: nodes + edges (React Flow format)
2. Legacy: plant_definition (backward compatibility)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import SimulateRequest, SimulationResponse
from app.engine.solver import solve_graph, plant_definition_to_graph
from app.db.database import get_db
from app.db.models import JarTestModel

router = APIRouter()


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Run a dewatering simulation",
    description="""
Run a complete sludge dewatering simulation with the provided configuration.

Supports two payload formats:
1. **Graph-based (new)**: Send `nodes` and `edges` arrays in React Flow format
2. **Legacy**: Send `plant_definition` dictionary (automatically converted to graph)

The simulation calculates:
- Mass balance through feed, conditioning, and dewatering stages
- Polymer consumption and costs
- Cake production metrics
- Liquid (centrate/filtrate) quality estimates

Optionally link a jar test to automatically use its optimum polymer dose.
""",
    responses={
        200: {"description": "Simulation completed successfully"},
        400: {"description": "Invalid request - must provide nodes/edges or plant_definition"},
        404: {"description": "Referenced jar test not found"},
        422: {"description": "Validation error in parameters or graph structure"},
    },
)
async def simulate(
    request: SimulateRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Run a dewatering simulation.

    Args:
        request: SimulateRequest with either nodes/edges or plant_definition

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

    # Determine payload format and prepare nodes/edges
    try:
        if request.nodes is not None and request.edges is not None:
            # Graph-based payload (new format)
            nodes = [n.model_dump() for n in request.nodes]
            edges = [e.model_dump() for e in request.edges]
            # Settings may come from plant_definition if provided
            settings = None
            if request.plant_definition:
                settings = request.plant_definition.get("settings", {})
        elif request.plant_definition:
            # Legacy payload - convert to graph format
            nodes, edges = plant_definition_to_graph(request.plant_definition)
            settings = request.plant_definition.get("settings", {})
        else:
            raise HTTPException(
                status_code=400,
                detail="Request must include either nodes/edges or plant_definition",
            )

        # Run the graph-based simulation
        result = solve_graph(
            nodes=nodes,
            edges=edges,
            jar_test_optimum_ppm=jar_test_optimum_ppm,
            jar_test_range=jar_test_range,
            settings=settings,
        )
    except HTTPException:
        raise
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

    Note: Currently only supports legacy plant_definition format.
    Graph validation happens during simulation for nodes/edges format.
    """
    from app.engine.solver import validate_plant_definition
    from app.engine.graph import validate_graph

    # Handle graph-based validation
    if request.nodes is not None and request.edges is not None:
        from app.engine.graph import Connection, GraphValidator

        nodes = [n.model_dump() for n in request.nodes]
        edges = [e.model_dump() for e in request.edges]

        # 1. Structural validation (valid node types, edge references, port compatibility)
        graph_errors = validate_graph(nodes, edges)
        if graph_errors:
            return {
                "valid": False,
                "errors": [{"path": "graph", "message": err, "severity": "error"} for err in graph_errors],
                "warnings": [],
            }

        # 2. Cycle detection via topological sort
        node_ids = [n["id"] for n in nodes]
        connections = [
            Connection(
                e["source"],
                e.get("sourceHandle", "output"),
                e["target"],
                e.get("targetHandle", "input")
            )
            for e in edges
        ]
        order, cycle_error = GraphValidator.get_topological_order(node_ids, connections)
        if order is None:
            return {
                "valid": False,
                "errors": [{"path": "edges", "message": cycle_error, "severity": "error"}],
                "warnings": [],
            }

        # 3. Required node check - simulation requires feed, polymer, and dewatering
        node_types = {n["type"] for n in nodes}
        required = {"feed", "polymer", "dewatering"}
        missing = required - node_types
        warnings = []
        if missing:
            warnings.append({
                "path": "nodes",
                "message": f"Graph is missing required equipment: {', '.join(sorted(missing))}. Simulation will fail.",
                "severity": "warning"
            })

        return {
            "valid": len(warnings) == 0,
            "errors": [],
            "warnings": warnings,
        }

    # Legacy plant_definition validation
    if request.plant_definition:
        validation_results = validate_plant_definition(request.plant_definition)

        # Separate errors and warnings
        errors = [e for e in validation_results if e.get("severity") == "error"]
        warnings = [e for e in validation_results if e.get("severity") == "warning"]

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    # No payload provided
    return {
        "valid": False,
        "errors": [{"path": "request", "message": "Must provide nodes/edges or plant_definition", "severity": "error"}],
        "warnings": [],
    }
