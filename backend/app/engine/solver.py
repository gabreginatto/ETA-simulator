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
from app.engine.tco import compute_tco
from app.engine.tco_validation import validate_tco_settings
from app.engine.graph import (
    Connection,
    GraphValidator,
    build_incoming_edge_map,
    validate_graph,
    VALID_NODE_TYPES,
)
from app.engine.clarifier import simulate_clarifier
from app.engine.thickener import simulate_thickener
# Drinking water treatment nodes
from app.engine.coagulant import simulate_coagulant
from app.engine.flocculator import simulate_flocculator
from app.engine.sedimentation import simulate_sedimentation
from app.engine.daf import simulate_daf
from app.engine.filter import simulate_filter
from app.engine.clearwell import simulate_clearwell


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
# Drinking Water Treatment Nodes
# =============================================================================

@register_node("coagulant")
def execute_coagulant(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute coagulant node - adds coagulant to water."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Coagulant node requires input stream")

    out = simulate_coagulant(
        feed=input_stream,
        dose_mg_L=params.get("dose_mg_L", 30.0),
        coagulant_type=params.get("coagulant_type", "alum"),
        stream_id="coagulated",
    )
    return {"output": out}


@register_node("flocculator")
def execute_flocculator(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute flocculator node - provides gentle mixing for floc growth."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Flocculator requires input stream")

    out = simulate_flocculator(
        feed=input_stream,
        detention_time_min=params.get("detention_time_min", 20.0),
        g_value=params.get("g_value", 50.0),
        stream_id="flocculated",
    )
    return {"output": out}


@register_node("sedimentation")
def execute_sedimentation(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute sedimentation basin node - separates clarified water and sludge."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Sedimentation requires input stream")

    result = simulate_sedimentation(
        feed=input_stream,
        capture_rate=params.get("capture_rate", 0.90),
        underflow_solids_percent=params.get("underflow_solids_percent", 1.0),
        clarified_id="sed_clarified",
        sludge_id="sed_sludge",
    )
    return {"clarified": result["clarified"], "sludge": result["sludge"]}


@register_node("daf")
def execute_daf(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute DAF node - floats solids to surface."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("DAF requires input stream")

    result = simulate_daf(
        feed=input_stream,
        capture_rate=params.get("capture_rate", 0.92),
        float_solids_percent=params.get("float_solids_percent", 2.0),
        air_to_solids_ratio=params.get("air_to_solids_ratio", 0.02),
        recycle_rate=params.get("recycle_rate", 0.10),
        clarified_id="daf_clarified",
        float_id="daf_float",
    )
    return {"clarified": result["clarified"], "float": result["float"]}


@register_node("filter")
def execute_filter(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute rapid filter node - removes remaining solids."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Filter requires input stream")

    result = simulate_filter(
        feed=input_stream,
        capture_rate=params.get("capture_rate", 0.95),
        run_length_h=params.get("run_length_h", 24.0),
        filtered_id="filtered",
        backwash_id="backwash",
    )
    return {"filtered": result["filtered"], "backwash": result["backwash"]}


@register_node("clearwell")
def execute_clearwell(params: Dict[str, Any], inputs: Dict[str, Stream]) -> Dict[str, Stream]:
    """Execute clearwell node - provides contact time for disinfection."""
    input_stream = inputs.get("input")
    if not input_stream:
        raise ValueError("Clearwell requires input stream")

    out = simulate_clearwell(
        feed=input_stream,
        volume_m3=params.get("volume_m3", 500.0),
        contact_time_min=params.get("contact_time_min", 30.0),
        stream_id="finished",
    )
    return {"output": out}


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


def _detect_plant_profile(nodes: List[Dict], settings: Optional[Dict] = None) -> str:
    """
    Detect plant profile based on nodes present or settings.

    Returns:
        "wastewater" or "drinking_water"
    """
    # Check settings first
    if settings and settings.get("plant_profile"):
        return settings.get("plant_profile")

    # Detect based on node types present
    node_types = {n["type"] for n in nodes}

    # Drinking water indicators
    drinking_water_types = {"coagulant", "flocculator", "sedimentation", "daf", "filter", "clearwell"}
    # Wastewater indicators
    wastewater_types = {"polymer", "dewatering"}

    has_drinking = bool(node_types & drinking_water_types)
    has_wastewater = bool(node_types & wastewater_types)

    if has_drinking and not has_wastewater:
        return "drinking_water"

    return "wastewater"


def _compute_drinking_water_kpis(
    feed: Stream,
    finished: Stream,
    coagulated: Optional[Stream],
    filtered: Optional[Stream],
    backwash: Optional[Stream],
    sed_sludge: Optional[Stream],
    daf_float: Optional[Stream],
    settings: Dict[str, Any],
    pump_power_kW: float = 0.0,
) -> Dict[str, Any]:
    """
    Compute KPIs for drinking water treatment plant.

    Args:
        feed: Raw water input stream
        finished: Finished water output stream
        coagulated: Stream after coagulation (optional)
        filtered: Filtered water stream (optional)
        backwash: Filter backwash waste stream (optional)
        sed_sludge: Sedimentation sludge stream (optional)
        daf_float: DAF float (waste) stream (optional)
        settings: Plant settings
        pump_power_kW: Pump power consumption

    Returns:
        Dictionary of KPI values
    """
    operating_hours = settings.get("operating_hours_per_day", 24.0)

    # Basic flow KPIs
    feed_flow = feed.volumetric_flow_m3_h if feed else 0
    finished_flow = finished.volumetric_flow_m3_h if finished else 0

    # Water recovery
    water_recovery = (finished_flow / feed_flow * 100) if feed_flow > 0 else 0

    # Coagulant consumption
    coagulant_dose_mg_L = settings.get("coagulant_dose_mg_L", 30.0)
    coagulant_kg_per_h = (coagulant_dose_mg_L * feed_flow) / 1000  # mg/L * m³/h * 1000L/m³ / 1e6 mg/kg
    coagulant_kg_per_day = coagulant_kg_per_h * operating_hours

    # Residuals/sludge production
    residuals_flow = 0.0
    residuals_ds_kg_h = 0.0
    if sed_sludge:
        residuals_flow += sed_sludge.volumetric_flow_m3_h
        residuals_ds_kg_h += sed_sludge.dry_solids_mass_flow_kg_h
    if daf_float:
        residuals_flow += daf_float.volumetric_flow_m3_h
        residuals_ds_kg_h += daf_float.dry_solids_mass_flow_kg_h
    if backwash:
        residuals_flow += backwash.volumetric_flow_m3_h
        residuals_ds_kg_h += backwash.dry_solids_mass_flow_kg_h

    # Finished water quality estimate (solids remaining)
    finished_solids_mg_L = 0
    if finished:
        # Convert fraction to mg/L (ppm equivalent)
        finished_solids_mg_L = finished.dry_solids_fraction * 1e6 if finished.dry_solids_fraction else 0
        # Cap at reasonable turbidity proxy
        finished_solids_mg_L = min(finished_solids_mg_L, 1000)

    # Filter metrics
    filter_run_h = settings.get("filter_runtime_hours_to_clog", 24.0)
    filters_count = settings.get("filters_in_parallel", 4)
    backwash_per_day = (24 / filter_run_h) * filters_count if filter_run_h > 0 else 0

    # Energy
    energy_kwh_per_day = pump_power_kW * operating_hours

    kpis = {
        # Flow metrics
        "feed_flow_m3_h": feed_flow,
        "finished_water_flow_m3_h": finished_flow,
        "water_recovery_percent": water_recovery,

        # Coagulant metrics
        "coagulant_dose_mg_L": coagulant_dose_mg_L,
        "coagulant_kg_per_h": coagulant_kg_per_h,
        "coagulant_kg_per_day": coagulant_kg_per_day,

        # Residuals metrics
        "residuals_flow_m3_h": residuals_flow,
        "residuals_mass_kg_h": residuals_ds_kg_h,
        "residuals_tons_per_day": (residuals_ds_kg_h * operating_hours) / 1000,

        # Quality metrics
        "finished_water_turbidity_ntu": finished_solids_mg_L,  # Rough proxy

        # Filter metrics
        "filter_washes_per_day": backwash_per_day,

        # Energy metrics
        "pump_power_kW": pump_power_kW,
        "energy_kwh_per_day": energy_kwh_per_day,

        # Mass balance
        "mass_balance_closure_percent": 100.0,  # Simplified for now
        "solids_capture_actual_percent": water_recovery,

        # Placeholder polymer metrics (not applicable to WTP but needed for UI)
        "polymer_dose_ppm": 0,
        "polymer_kg_per_tDS": 0,
        "polymer_kg_per_h": 0,
        "polymer_kg_per_day": 0,
        "polymer_kg_per_month": 0,
        "cake_dryness_percent": 0,
        "cake_mass_kg_per_h": 0,
        "cake_wet_tons_per_day": 0,
        "cake_tDS_per_day": 0,
        "liquid_flow_m3_h": 0,
        "liquid_tss_estimate_mg_L": 0,
    }

    return kpis


def _compute_drinking_water_tco(
    feed: Stream,
    finished: Stream,
    coagulated: Optional[Stream],
    backwash: Optional[Stream],
    sed_sludge: Optional[Stream],
    daf_float: Optional[Stream],
    settings: Dict[str, Any],
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Compute TCO for drinking water treatment plant.

    Returns:
        Tuple of (TCO results dict, warnings list)
    """
    warnings: List[str] = []
    operating_hours = settings.get("operating_hours_per_day", 24.0)

    feed_flow = feed.volumetric_flow_m3_h if feed else 0
    finished_flow = finished.volumetric_flow_m3_h if finished else 0

    # Chemical costs (coagulant)
    coagulant_price = settings.get("coagulant_price_per_kg", 2.0)
    coagulant_dose_mg_L = settings.get("coagulant_dose_mg_L", 30.0)
    coagulant_kg_per_h = (coagulant_dose_mg_L * feed_flow) / 1000
    chemical_cost_per_h = coagulant_kg_per_h * coagulant_price

    # Filtration costs (water for backwash)
    water_cost = settings.get("water_cost_per_m3", 1.5)
    backwash_volume = settings.get("backwash_volume_m3", 10.0)
    filter_run_h = settings.get("filter_runtime_hours_to_clog", 24.0)
    filters_count = settings.get("filters_in_parallel", 4)

    if filter_run_h and filters_count and backwash_volume:
        backwash_per_day = (24 / filter_run_h) * filters_count
        filtration_cost_per_day = backwash_per_day * backwash_volume * water_cost
    else:
        filtration_cost_per_day = 0
        warnings.append("Filtration cost not calculated: missing filter settings")

    # Sludge disposal costs
    disposal_cost_per_ton = settings.get("disposal_cost_per_ton_wet", 60.0)
    residuals_tons_per_day = 0
    if sed_sludge:
        residuals_tons_per_day += (sed_sludge.mass_flow_kg_h * operating_hours) / 1000
    if daf_float:
        residuals_tons_per_day += (daf_float.mass_flow_kg_h * operating_hours) / 1000
    if backwash:
        # Backwash is mostly water, so count dry solids
        residuals_tons_per_day += (backwash.dry_solids_mass_flow_kg_h * operating_hours) / 1000

    sludge_cost_per_day = residuals_tons_per_day * disposal_cost_per_ton

    # Logistics costs
    storage_cost = settings.get("storage_cost_per_kg", 0.3)
    handling_cost = settings.get("handling_cost_per_kg", 0.1)
    logistics_cost_per_day = (coagulant_kg_per_h * operating_hours) * (storage_cost + handling_cost)

    # Daily totals
    chemical_cost_per_day = chemical_cost_per_h * operating_hours
    total_per_day = chemical_cost_per_day + filtration_cost_per_day + sludge_cost_per_day + logistics_cost_per_day

    # Calculate per 1000 m³ (unitary cost)
    daily_volume_m3 = feed_flow * operating_hours
    if daily_volume_m3 > 0:
        factor = 1000 / daily_volume_m3
        per_1000m3 = {
            "chemicals": chemical_cost_per_day * factor,
            "filtration": filtration_cost_per_day * factor,
            "sludge": sludge_cost_per_day * factor,
            "logistics": logistics_cost_per_day * factor,
            "total": total_per_day * factor,
        }
    else:
        per_1000m3 = {"chemicals": 0, "filtration": 0, "sludge": 0, "logistics": 0, "total": 0}

    per_day = {
        "chemicals": chemical_cost_per_day,
        "filtration": filtration_cost_per_day,
        "sludge": sludge_cost_per_day,
        "logistics": logistics_cost_per_day,
        "total": total_per_day,
    }

    per_month = {k: v * 30 for k, v in per_day.items()}
    per_year = {k: v * 365 for k, v in per_day.items()}

    return {
        "per_1000m3": per_1000m3,
        "per_day": per_day,
        "per_month": per_month,
        "per_year": per_year,
    }, warnings


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
        # 5. Detect plant profile and extract streams accordingly
        # ---------------------------------------------------------------------
        plant_profile = _detect_plant_profile(nodes, settings)

        # Common streams
        feed_stream = _find_stream_by_type(nodes, streams, "feed", "output")
        pump_stream = _find_stream_by_type(nodes, streams, "pump", "output")

        # Wastewater-specific streams
        conditioned_stream = _find_stream_by_type(nodes, streams, "polymer", "output")
        cake_stream = _find_stream_by_type(nodes, streams, "dewatering", "cake")
        liquid_stream = _find_stream_by_type(nodes, streams, "dewatering", "liquid")

        # Clarifier streams (optional, used in both profiles)
        clarifier_overflow = _find_stream_by_type(nodes, streams, "clarifier", "overflow")
        clarifier_underflow = _find_stream_by_type(nodes, streams, "clarifier", "underflow")

        # Thickener streams (optional)
        thickened_stream = _find_stream_by_type(nodes, streams, "thickener", "thickened")
        supernatant_stream = _find_stream_by_type(nodes, streams, "thickener", "supernatant")

        # Drinking water-specific streams
        coagulated_stream = _find_stream_by_type(nodes, streams, "coagulant", "output")
        flocculated_stream = _find_stream_by_type(nodes, streams, "flocculator", "output")
        sed_clarified_stream = _find_stream_by_type(nodes, streams, "sedimentation", "clarified")
        sed_sludge_stream = _find_stream_by_type(nodes, streams, "sedimentation", "sludge")
        daf_clarified_stream = _find_stream_by_type(nodes, streams, "daf", "clarified")
        daf_float_stream = _find_stream_by_type(nodes, streams, "daf", "float")
        filtered_stream = _find_stream_by_type(nodes, streams, "filter", "filtered")
        backwash_stream = _find_stream_by_type(nodes, streams, "filter", "backwash")
        finished_stream = _find_stream_by_type(nodes, streams, "clearwell", "output")

        # ---------------------------------------------------------------------
        # 5b. Validate required streams based on profile
        # ---------------------------------------------------------------------
        if plant_profile == "drinking_water":
            # For drinking water: need feed and at least one treatment step
            if not feed_stream:
                result["errors"].append(
                    "Incomplete graph: missing feed stream. "
                    "A drinking water simulation requires at minimum: feed → treatment process."
                )
                return result
            # Find the final water output for KPIs
            # Priority: clearwell > filter > sedimentation/daf > flocculator > coagulant
            finished_water = (
                finished_stream or
                filtered_stream or
                sed_clarified_stream or
                daf_clarified_stream or
                flocculated_stream or
                coagulated_stream
            )
            if not finished_water:
                result["errors"].append(
                    "Incomplete graph: no treated water output found. "
                    "Connect nodes from feed through treatment to produce finished water."
                )
                return result
        else:
            # Wastewater profile - require full dewatering path
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
        # 6. Compute KPIs (profile-aware)
        # ---------------------------------------------------------------------
        pump_power = 0.0
        if pump_stream:
            pump_power = getattr(pump_stream, "power_kW", 0.0)

        settings = settings or {}

        if plant_profile == "drinking_water":
            # Drinking water KPIs
            kpis = _compute_drinking_water_kpis(
                feed=feed_stream,
                finished=finished_water,
                coagulated=coagulated_stream,
                filtered=filtered_stream,
                backwash=backwash_stream,
                sed_sludge=sed_sludge_stream,
                daf_float=daf_float_stream,
                settings=settings,
                pump_power_kW=pump_power,
            )
        else:
            # Wastewater KPIs (original logic)
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
        # 6b. Compute TCO (Total Cost of Ownership) - profile-aware
        # ---------------------------------------------------------------------
        tco_validation_warnings = validate_tco_settings(settings)
        result["warnings"].extend(tco_validation_warnings)

        if plant_profile == "drinking_water":
            # For drinking water, compute TCO differently
            tco_results, tco_warnings = _compute_drinking_water_tco(
                feed=feed_stream,
                finished=finished_water,
                coagulated=coagulated_stream,
                backwash=backwash_stream,
                sed_sludge=sed_sludge_stream,
                daf_float=daf_float_stream,
                settings=settings,
            )
        else:
            tco_results, tco_warnings = compute_tco(
                feed=feed_stream,
                conditioned=conditioned_stream,
                cake=cake_stream,
                liquid=liquid_stream,
                settings=settings,
            )

        # Add TCO results to KPIs
        kpis["tco_per_1000m3"] = tco_results["per_1000m3"]
        kpis["tco_per_day"] = tco_results["per_day"]
        kpis["tco_per_month"] = tco_results["per_month"]
        kpis["tco_per_year"] = tco_results["per_year"]

        result["warnings"].extend(tco_warnings)

        # ---------------------------------------------------------------------
        # 7. Generate warnings
        # ---------------------------------------------------------------------
        if plant_profile != "drinking_water":
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
        if pump_stream:
            response_streams["pump_out"] = pump_stream.to_dict()

        if plant_profile == "drinking_water":
            # Drinking water streams
            if coagulated_stream:
                response_streams["coagulated"] = coagulated_stream.to_dict()
            if flocculated_stream:
                response_streams["flocculated"] = flocculated_stream.to_dict()
            if sed_clarified_stream:
                response_streams["sed_clarified"] = sed_clarified_stream.to_dict()
            if sed_sludge_stream:
                response_streams["sed_sludge"] = sed_sludge_stream.to_dict()
            if daf_clarified_stream:
                response_streams["daf_clarified"] = daf_clarified_stream.to_dict()
            if daf_float_stream:
                response_streams["daf_float"] = daf_float_stream.to_dict()
            if filtered_stream:
                response_streams["filtered"] = filtered_stream.to_dict()
            if backwash_stream:
                response_streams["backwash"] = backwash_stream.to_dict()
            if finished_stream:
                response_streams["finished"] = finished_stream.to_dict()
        else:
            # Wastewater streams
            if conditioned_stream:
                response_streams["conditioned"] = conditioned_stream.to_dict()
            if cake_stream:
                response_streams["cake"] = cake_stream.to_dict()
            if liquid_stream:
                response_streams["liquid"] = liquid_stream.to_dict()

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
