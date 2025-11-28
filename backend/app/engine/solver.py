"""
Graph-based simulation solver for the dewatering simulation pipeline.

This module provides a registry-based graph execution engine that accepts
React Flow–style nodes and edges, executes via topological sort, and
produces simulation results.

Example (graph-based):
    >>> from app.engine.solver import solve_graph
    >>> nodes = [
    ...     {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
    ...     {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}}},
    ...     {"id": "dewatering-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23}}},
    ... ]
    >>> edges = [
    ...     {"id": "e1", "source": "feed-1", "target": "polymer-1"},
    ...     {"id": "e2", "source": "polymer-1", "target": "dewatering-1"},
    ... ]
    >>> result = solve_graph(nodes, edges)
    >>> result["success"]
    True

Example (legacy):
    >>> from app.engine.solver import plant_definition_to_graph, solve_graph
    >>> plant_def = {
    ...     "feed_source": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}},
    ...     "polymer_conditioner": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}},
    ...     "dewatering_unit": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23}},
    ...     "settings": {}
    ... }
    >>> nodes, edges = plant_definition_to_graph(plant_def)
    >>> result = solve_graph(nodes, edges, settings=plant_def.get("settings"))
    >>> result["success"]
    True
"""
from typing import Dict, Any, Optional, List, Tuple, Callable

from app.models.stream import Stream
from app.engine.feed_source import make_feed_stream, validate_feed_parameters
from app.engine.pump import simulate_pump
from app.engine.polymer_conditioner import (
    apply_polymer,
    validate_polymer_parameters,
    get_effective_dose_ppm,
)
from app.engine.dewatering_unit import (
    dewatering_unit,
    validate_dewatering_parameters,
)
from app.engine.kpis import compute_kpis, generate_kpi_warnings
from app.engine.graph import (
    Connection,
    GraphValidator,
    build_incoming_edge_map,
    validate_graph,
    VALID_NODE_TYPES,
)
from app.engine.clarifier import simulate_clarifier
from app.engine.thickener import simulate_thickener


# =============================================================================
# Node Registry
# =============================================================================

# Registry signature: (params: Dict, inputs: Dict[str, Stream]) -> Dict[str, Stream]
NODE_REGISTRY: Dict[str, Callable[[Dict[str, Any], Dict[str, Stream]], Dict[str, Stream]]] = {}


def register_node(node_type: str):
    """Decorator to register node execution functions."""
    def decorator(fn: Callable[[Dict[str, Any], Dict[str, Stream]], Dict[str, Stream]]):
        NODE_REGISTRY[node_type] = fn
        return fn
    return decorator


@register_node("feed")
def execute_feed(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute feed node - creates the initial sludge stream."""
    stream = make_feed_stream(
        flow_m3_h=params.get("flow_m3_h", 0),
        ts_percent=params.get("ts_percent", 0),
        temperature_C=params.get("temperature_C", 20.0),
        stream_id="feed",
    )
    return {"output": stream}


@register_node("pump")
def execute_pump(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute pump node - transfers stream with energy calculation."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Pump requires input stream")

    head_m = params.get("head_m", 20.0)
    eff_pump = params.get("efficiency_pump", 0.7)
    eff_motor = params.get("efficiency_motor", 0.9)
    total_eff = eff_pump * eff_motor

    out = simulate_pump(
        stream=input_stream,
        head_m=head_m,
        efficiency=total_eff,
        output_stream_id="pump_out",
    )
    return {"output": out}


@register_node("polymer")
def execute_polymer(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute polymer conditioner node - adds polymer to sludge."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Polymer conditioner requires input stream")

    out = apply_polymer(
        feed=input_stream,
        jar_dose_ppm=params.get("jar_test_optimum_ppm", 0),
        shear_factor=params.get("shear_factor", 1.0),
        safety_factor=params.get("safety_factor", 1.0),
        stream_id="conditioned",
    )
    return {"output": out}


@register_node("dewatering")
def execute_dewatering(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute dewatering unit node - separates cake and liquid."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Dewatering unit requires input stream")

    cake, liquid = dewatering_unit(
        feed=input_stream,
        capture_rate=params.get("capture_rate", 0.95),
        cake_dryness_percent=params.get("cake_dryness_percent", 23.0),
        polymer_split_cake=params.get("polymer_split_cake", 0.3),
        cake_stream_id="cake",
        liquid_stream_id="liquid",
    )
    return {"cake": cake, "liquid": liquid}


@register_node("clarifier")
def execute_clarifier(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute clarifier node - splits into overflow and underflow."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Clarifier requires input stream")

    result = simulate_clarifier(
        feed=input_stream,
        underflow_rate_m3_h=params.get("underflow_rate_m3_h", 10.0),
        capture_rate=params.get("capture_rate", 0.98),
        overflow_id="clarifier_overflow",
        underflow_id="clarifier_underflow",
    )
    return {"overflow": result["overflow"], "underflow": result["underflow"]}


@register_node("thickener")
def execute_thickener(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute thickener node - concentrates sludge."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Thickener requires input stream")

    result = simulate_thickener(
        feed=input_stream,
        target_thickened_ts_percent=params.get("target_thickened_ts_percent", 5.0),
        capture_rate=params.get("capture_rate", 0.95),
        supernatant_id="thickener_supernatant",
        thickened_id="thickener_sludge",
    )
    return {"thickened": result["thickened"], "supernatant": result["supernatant"]}


# =============================================================================
# Helper Functions
# =============================================================================

def _find_stream_by_type(
    nodes: List[Dict],
    streams: Dict[Tuple[str, str], Stream],
    node_type: str,
    handle: str,
) -> Optional[Stream]:
    """Find first stream of given node type and handle."""
    for node in nodes:
        if node["type"] == node_type:
            key = (node["id"], handle)
            if key in streams:
                return streams[key]
    return None


def _generate_parameter_warnings(
    nodes: List[Dict],
    jar_test_optimum_ppm: Optional[float],
    jar_test_range: Optional[Dict[str, float]],
) -> List[str]:
    """Generate warnings based on parameter values."""
    warnings: List[str] = []

    # Find parameter values from nodes
    feed_params = {}
    polymer_params = {}
    dewatering_params = {}

    for node in nodes:
        params = node.get("data", {}).get("parameters", {})
        if node["type"] == "feed":
            feed_params = params
        elif node["type"] == "polymer":
            polymer_params = params
        elif node["type"] == "dewatering":
            dewatering_params = params

    # Feed validation
    if feed_params:
        flow_m3_h = feed_params.get("flow_m3_h", 0)
        ts_percent = feed_params.get("ts_percent", 0)
        temperature_C = feed_params.get("temperature_C", 20.0)
        warnings.extend(validate_feed_parameters(flow_m3_h, ts_percent, temperature_C))

    # Polymer validation
    if polymer_params:
        jar_dose_ppm = jar_test_optimum_ppm or polymer_params.get("jar_test_optimum_ppm", 0)
        shear_factor = polymer_params.get("shear_factor", 1.0)
        safety_factor = polymer_params.get("safety_factor", 1.0)
        warnings.extend(validate_polymer_parameters(jar_dose_ppm, shear_factor, safety_factor))

        # Check effective dose range
        effective_ppm = get_effective_dose_ppm(jar_dose_ppm, shear_factor, safety_factor)
        if effective_ppm < 5:
            warnings.append(
                f"Very low effective dose ({effective_ppm:.1f} ppm) - may result in poor flocculation"
            )
        elif effective_ppm > 50:
            warnings.append(
                f"Very high effective dose ({effective_ppm:.1f} ppm) - verify jar test results"
            )

        # Check against jar test acceptable range
        if jar_test_range:
            range_min = jar_test_range.get("acceptable_range_min_ppm")
            range_max = jar_test_range.get("acceptable_range_max_ppm")
            if range_min is not None and effective_ppm < range_min:
                warnings.append(
                    f"Effective dose ({effective_ppm:.1f} ppm) is below jar test acceptable range (min: {range_min:.1f} ppm)"
                )
            if range_max is not None and effective_ppm > range_max:
                warnings.append(
                    f"Effective dose ({effective_ppm:.1f} ppm) exceeds jar test acceptable range (max: {range_max:.1f} ppm)"
                )

    # Dewatering validation
    if dewatering_params and feed_params:
        flow_m3_h = feed_params.get("flow_m3_h", 0)
        max_flow_m3_h = dewatering_params.get("max_flow_m3_h", 100)
        capture_rate = dewatering_params.get("capture_rate", 0.95)
        cake_dryness_percent = dewatering_params.get("cake_dryness_percent", 23.0)
        warnings.extend(
            validate_dewatering_parameters(flow_m3_h, max_flow_m3_h, capture_rate, cake_dryness_percent)
        )

    return warnings


# =============================================================================
# Legacy Shim
# =============================================================================

def plant_definition_to_graph(plant_def: Dict[str, Any]) -> Tuple[List[Dict], List[Dict]]:
    """
    Convert legacy plant_definition to nodes/edges format.

    Args:
        plant_def: Legacy plant configuration dictionary

    Returns:
        Tuple of (nodes, edges) in graph format
    """
    nodes: List[Dict] = []
    edges: List[Dict] = []

    # Feed node
    if "feed_source" in plant_def:
        nodes.append({
            "id": "feed-1",
            "type": "feed",
            "data": {"parameters": plant_def["feed_source"].get("parameters", {})}
        })

    prev_node = "feed-1"

    # Optional pump node
    if "transfer_pump" in plant_def and plant_def["transfer_pump"].get("parameters"):
        nodes.append({
            "id": "pump-1",
            "type": "pump",
            "data": {"parameters": plant_def["transfer_pump"]["parameters"]}
        })
        edges.append({
            "id": "e-feed-pump",
            "source": prev_node,
            "sourceHandle": "output",
            "target": "pump-1",
            "targetHandle": "input"
        })
        prev_node = "pump-1"

    # Polymer node
    if "polymer_conditioner" in plant_def:
        nodes.append({
            "id": "polymer-1",
            "type": "polymer",
            "data": {"parameters": plant_def["polymer_conditioner"].get("parameters", {})}
        })
        edges.append({
            "id": "e-to-polymer",
            "source": prev_node,
            "sourceHandle": "output",
            "target": "polymer-1",
            "targetHandle": "input"
        })
        prev_node = "polymer-1"

    # Dewatering node
    if "dewatering_unit" in plant_def:
        nodes.append({
            "id": "dewatering-1",
            "type": "dewatering",
            "data": {"parameters": plant_def["dewatering_unit"].get("parameters", {})}
        })
        edges.append({
            "id": "e-to-dewatering",
            "source": prev_node,
            "sourceHandle": "output",
            "target": "dewatering-1",
            "targetHandle": "input"
        })

    return nodes, edges


# =============================================================================
# Main Graph Solver
# =============================================================================

def solve_graph(
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
    jar_test_optimum_ppm: Optional[float] = None,
    jar_test_range: Optional[Dict[str, float]] = None,
    settings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute simulation using graph-based topology.

    Args:
        nodes: List of node dictionaries with id, type, data.parameters
        edges: List of edge dictionaries with id, source, target, sourceHandle, targetHandle
        jar_test_optimum_ppm: Optional override for jar test dose
        jar_test_range: Optional dict with acceptable_range_min_ppm and acceptable_range_max_ppm
        settings: Optional settings dict (polymer_price_per_kg, electricity_price_per_kwh, etc.)

    Returns:
        SimulationResult dictionary with:
            - success: bool
            - streams: dict of stream data (feed, conditioned, cake, liquid, pump_out)
            - kpis: dict of KPI values
            - warnings: list of warning messages
            - errors: list of error messages
    """
    result: Dict[str, Any] = {
        "success": False,
        "streams": {},
        "kpis": {},
        "warnings": [],
        "errors": [],
    }

    try:
        # ---------------------------------------------------------------------
        # 1. Validate graph structure
        # ---------------------------------------------------------------------
        validation_errors = validate_graph(nodes, edges)
        if validation_errors:
            result["errors"] = validation_errors
            return result

        # ---------------------------------------------------------------------
        # 2. Get topological order
        # ---------------------------------------------------------------------
        node_map = {n["id"]: n for n in nodes}
        node_ids = [n["id"] for n in nodes]
        connections = [
            Connection(
                e["source"],
                e.get("sourceHandle", "output"),
                e["target"],
                e.get("targetHandle", "input"),
            )
            for e in edges
        ]

        order, error = GraphValidator.get_topological_order(node_ids, connections)
        if order is None:
            result["errors"].append(error)
            return result

        # ---------------------------------------------------------------------
        # 3. Build incoming edge map
        # ---------------------------------------------------------------------
        incoming_map = build_incoming_edge_map(edges)

        # ---------------------------------------------------------------------
        # 4. Execute nodes in topological order
        # ---------------------------------------------------------------------
        streams: Dict[Tuple[str, str], Stream] = {}

        for node_id in order:
            node = node_map[node_id]
            node_type = node["type"]
            params = dict(node.get("data", {}).get("parameters", {}))

            # Override jar_test_optimum_ppm if provided at request level
            if node_type == "polymer" and jar_test_optimum_ppm is not None:
                params["jar_test_optimum_ppm"] = jar_test_optimum_ppm

            # Gather inputs from upstream edges
            inputs: Dict[str, Stream] = {}
            for edge in incoming_map.get(node_id, []):
                source_key = (edge["source"], edge.get("sourceHandle", "output"))
                target_handle = edge.get("targetHandle", "input")
                if source_key in streams:
                    inputs[target_handle] = streams[source_key]

            # Execute node
            executor = NODE_REGISTRY.get(node_type)
            if not executor:
                result["errors"].append(f"No executor for node type: {node_type}")
                return result

            outputs = executor(params, inputs)

            # Store outputs
            for handle_id, stream in outputs.items():
                streams[(node_id, handle_id)] = stream

        # ---------------------------------------------------------------------
        # 5. Extract linear path streams for KPI computation
        # ---------------------------------------------------------------------
        feed_stream = _find_stream_by_type(nodes, streams, "feed", "output")
        conditioned_stream = _find_stream_by_type(nodes, streams, "polymer", "output")
        cake_stream = _find_stream_by_type(nodes, streams, "dewatering", "cake")
        liquid_stream = _find_stream_by_type(nodes, streams, "dewatering", "liquid")
        pump_stream = _find_stream_by_type(nodes, streams, "pump", "output")

        # Clarifier streams (optional)
        clarifier_overflow = _find_stream_by_type(nodes, streams, "clarifier", "overflow")
        clarifier_underflow = _find_stream_by_type(nodes, streams, "clarifier", "underflow")

        # Thickener streams (optional)
        thickened_stream = _find_stream_by_type(nodes, streams, "thickener", "thickened")
        supernatant_stream = _find_stream_by_type(nodes, streams, "thickener", "supernatant")

        # ---------------------------------------------------------------------
        # 5b. Validate required streams exist before KPI calculation
        # ---------------------------------------------------------------------
        required_streams = {
            "feed": feed_stream,
            "polymer (conditioned)": conditioned_stream,
            "dewatering (cake)": cake_stream,
            "dewatering (liquid)": liquid_stream,
        }
        missing = [name for name, stream in required_streams.items() if stream is None]
        if missing:
            result["errors"].append(
                f"Incomplete graph: missing required streams from {', '.join(missing)}. "
                "A complete simulation requires at minimum: feed → polymer → dewatering."
            )
            return result

        # ---------------------------------------------------------------------
        # 6. Compute KPIs
        # ---------------------------------------------------------------------
        pump_power = 0.0
        if pump_stream:
            pump_power = getattr(pump_stream, "power_kW", 0.0)

        settings = settings or {}
        kpis = compute_kpis(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            polymer_price_per_kg=settings.get("polymer_price_per_kg"),
            electricity_price_per_kwh=settings.get("electricity_price_per_kwh"),
            operating_hours_per_day=settings.get("operating_hours_per_day", 24.0),
            pump_power_kW=pump_power,
        )

        # ---------------------------------------------------------------------
        # 7. Generate warnings
        # ---------------------------------------------------------------------
        result["warnings"].extend(
            _generate_parameter_warnings(nodes, jar_test_optimum_ppm, jar_test_range)
        )
        result["warnings"].extend(generate_kpi_warnings(kpis))

        # ---------------------------------------------------------------------
        # 8. Build response streams dict
        # ---------------------------------------------------------------------
        response_streams: Dict[str, Any] = {}
        if feed_stream:
            response_streams["feed"] = feed_stream.to_dict()
        if conditioned_stream:
            response_streams["conditioned"] = conditioned_stream.to_dict()
        if cake_stream:
            response_streams["cake"] = cake_stream.to_dict()
        if liquid_stream:
            response_streams["liquid"] = liquid_stream.to_dict()
        if pump_stream:
            response_streams["pump_out"] = pump_stream.to_dict()

        # Clarifier streams (optional)
        if clarifier_overflow:
            response_streams["clarifier_overflow"] = clarifier_overflow.to_dict()
        if clarifier_underflow:
            response_streams["clarifier_underflow"] = clarifier_underflow.to_dict()

        # Thickener streams (optional)
        if thickened_stream:
            response_streams["thickened"] = thickened_stream.to_dict()
        if supernatant_stream:
            response_streams["supernatant"] = supernatant_stream.to_dict()

        result["streams"] = response_streams
        result["kpis"] = kpis
        result["success"] = True

        # Remove duplicate warnings
        result["warnings"] = list(dict.fromkeys(result["warnings"]))

    except ValueError as e:
        result["errors"].append(str(e))
    except KeyError as e:
        result["errors"].append(f"Missing required parameter: {e}")
    except Exception as e:
        result["errors"].append(f"Unexpected error: {str(e)}")

    return result


# =============================================================================
# Backward Compatibility Alias
# =============================================================================

def solve_plant(
    plant_definition: Dict[str, Any],
    jar_test_optimum_ppm: Optional[float] = None,
    jar_test_range: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Run a complete dewatering simulation based on plant definition.

    This is a backward-compatibility wrapper around solve_graph.
    It converts the legacy plant_definition to graph format and executes.

    Args:
        plant_definition: Dictionary containing plant configuration
        jar_test_optimum_ppm: Optional override for jar test dose
        jar_test_range: Optional dict with acceptable_range_min_ppm and acceptable_range_max_ppm

    Returns:
        SimulationResult dictionary
    """
    nodes, edges = plant_definition_to_graph(plant_definition)
    settings = plant_definition.get("settings", {})

    return solve_graph(
        nodes=nodes,
        edges=edges,
        jar_test_optimum_ppm=jar_test_optimum_ppm,
        jar_test_range=jar_test_range,
        settings=settings,
    )


# =============================================================================
# Validation (for legacy /simulate/validate endpoint)
# =============================================================================

class ValidationError:
    """Structured validation error with path and message."""

    def __init__(self, path: str, message: str, severity: str = "error"):
        self.path = path
        self.message = message
        self.severity = severity  # "error" or "warning"

    def to_dict(self) -> Dict[str, str]:
        return {"path": self.path, "message": self.message, "severity": self.severity}


def validate_plant_definition(plant_definition: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Validate plant definition structure without running simulation.

    Args:
        plant_definition: Plant configuration dictionary.

    Returns:
        List of validation error dictionaries with path, message, and severity.
    """
    errors: List[ValidationError] = []

    required_sections = ["feed_source", "polymer_conditioner", "dewatering_unit"]
    for section in required_sections:
        if section not in plant_definition:
            errors.append(ValidationError(section, f"Missing required section: {section}"))
            continue
        if "parameters" not in plant_definition[section]:
            errors.append(ValidationError(f"{section}.parameters", f"Missing parameters in {section}"))

    # Feed source validation
    if "feed_source" in plant_definition and "parameters" in plant_definition.get("feed_source", {}):
        params = plant_definition["feed_source"]["parameters"]
        flow = params.get("flow_m3_h")
        ts = params.get("ts_percent")

        if flow is None:
            errors.append(ValidationError("feed_source.parameters.flow_m3_h", "Flow rate is required"))
        elif flow <= 0:
            errors.append(ValidationError("feed_source.parameters.flow_m3_h", "Flow rate must be greater than 0"))
        elif flow > 10000:
            errors.append(ValidationError("feed_source.parameters.flow_m3_h", "Flow rate exceeds maximum (10,000 m³/h)", "warning"))

        if ts is None:
            errors.append(ValidationError("feed_source.parameters.ts_percent", "Total solids is required"))
        elif ts < 0 or ts > 100:
            errors.append(ValidationError("feed_source.parameters.ts_percent", "Total solids must be between 0 and 100%"))
        elif ts < 0.5:
            errors.append(ValidationError("feed_source.parameters.ts_percent", "Very low solids content (<0.5%)", "warning"))
        elif ts > 15:
            errors.append(ValidationError("feed_source.parameters.ts_percent", "Very high solids content (>15%)", "warning"))

    # Polymer conditioner validation
    if "polymer_conditioner" in plant_definition and "parameters" in plant_definition.get("polymer_conditioner", {}):
        params = plant_definition["polymer_conditioner"]["parameters"]
        jar_dose = params.get("jar_test_optimum_ppm")
        shear = params.get("shear_factor")
        safety = params.get("safety_factor")

        if jar_dose is None:
            errors.append(ValidationError("polymer_conditioner.parameters.jar_test_optimum_ppm", "Jar test optimum dose is required"))
        elif jar_dose <= 0:
            errors.append(ValidationError("polymer_conditioner.parameters.jar_test_optimum_ppm", "Dose must be greater than 0"))
        elif jar_dose > 100:
            errors.append(ValidationError("polymer_conditioner.parameters.jar_test_optimum_ppm", "Unusually high dose (>100 ppm)", "warning"))

        if shear is None:
            errors.append(ValidationError("polymer_conditioner.parameters.shear_factor", "Shear factor is required"))
        elif shear < 0.5 or shear > 3.0:
            errors.append(ValidationError("polymer_conditioner.parameters.shear_factor", "Shear factor should be between 0.5 and 3.0"))

        if safety is None:
            errors.append(ValidationError("polymer_conditioner.parameters.safety_factor", "Safety factor is required"))
        elif safety < 1.0:
            errors.append(ValidationError("polymer_conditioner.parameters.safety_factor", "Safety factor should be at least 1.0"))
        elif safety > 2.0:
            errors.append(ValidationError("polymer_conditioner.parameters.safety_factor", "Safety factor >2.0 may waste polymer", "warning"))

    # Dewatering unit validation
    if "dewatering_unit" in plant_definition and "parameters" in plant_definition.get("dewatering_unit", {}):
        params = plant_definition["dewatering_unit"]["parameters"]
        capture = params.get("capture_rate")
        cake_ds = params.get("cake_dryness_percent")
        max_flow = params.get("max_flow_m3_h")

        if capture is None:
            errors.append(ValidationError("dewatering_unit.parameters.capture_rate", "Capture rate is required"))
        elif capture < 0 or capture > 1:
            errors.append(ValidationError("dewatering_unit.parameters.capture_rate", "Capture rate must be between 0 and 1"))
        elif capture < 0.8:
            errors.append(ValidationError("dewatering_unit.parameters.capture_rate", "Low capture rate (<80%)", "warning"))

        if cake_ds is None:
            errors.append(ValidationError("dewatering_unit.parameters.cake_dryness_percent", "Cake dryness is required"))
        elif cake_ds < 10 or cake_ds > 50:
            errors.append(ValidationError("dewatering_unit.parameters.cake_dryness_percent", "Cake dryness should be between 10% and 50%"))

        # Check flow vs capacity
        if max_flow is not None and "feed_source" in plant_definition:
            feed_flow = plant_definition["feed_source"].get("parameters", {}).get("flow_m3_h", 0)
            if feed_flow > max_flow:
                errors.append(ValidationError(
                    "dewatering_unit.parameters.max_flow_m3_h",
                    f"Feed flow ({feed_flow} m³/h) exceeds unit capacity ({max_flow} m³/h)",
                    "warning"
                ))

    # Transfer pump validation (optional)
    if "transfer_pump" in plant_definition and "parameters" in plant_definition.get("transfer_pump", {}):
        params = plant_definition["transfer_pump"]["parameters"]
        head_m = params.get("head_m")
        eff_pump = params.get("efficiency_pump")
        eff_motor = params.get("efficiency_motor")

        if head_m is None or head_m <= 0:
            errors.append(ValidationError("transfer_pump.parameters.head_m", "Pump head must be greater than 0"))
        if eff_pump is None or eff_pump <= 0 or eff_pump > 1:
            errors.append(ValidationError("transfer_pump.parameters.efficiency_pump", "Pump efficiency must be between 0 and 1"))
        if eff_motor is None or eff_motor <= 0 or eff_motor > 1:
            errors.append(ValidationError("transfer_pump.parameters.efficiency_motor", "Motor efficiency must be between 0 and 1"))

    return [e.to_dict() for e in errors]
