"""
Main simulation solver orchestrating the dewatering simulation pipeline.

This module coordinates all engine components to run a complete simulation
from feed parameters to final KPIs.

Example:
    >>> from app.engine.solver import solve_plant
    >>> plant_def = {
    ...     "feed_source": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}},
    ...     "polymer_conditioner": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}},
    ...     "dewatering_unit": {"parameters": {"max_flow_m3_h": 150, "capture_rate": 0.95, "cake_dryness_percent": 23}},
    ...     "settings": {}
    ... }
    >>> result = solve_plant(plant_def)
    >>> result["success"]
    True
"""
from typing import Dict, Any, Optional, List

from app.models.stream import Stream
from app.engine.feed_source import make_feed_stream, validate_feed_parameters
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


def solve_plant(
    plant_definition: Dict[str, Any],
    jar_test_optimum_ppm: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Run a complete dewatering simulation based on plant definition.

    Args:
        plant_definition: Dictionary containing plant configuration with:
            - feed_source.parameters: flow_m3_h, ts_percent, temperature_C
            - polymer_conditioner.parameters: jar_test_optimum_ppm, shear_factor, safety_factor
            - dewatering_unit.parameters: max_flow_m3_h, capture_rate, cake_dryness_percent
            - settings: polymer_price_per_kg, operating_hours_per_day
        jar_test_optimum_ppm: Optional override for jar test dose.

    Returns:
        SimulationResult dictionary with:
            - success: bool
            - streams: dict of stream data
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
        # Validate plant definition structure
        # ---------------------------------------------------------------------
        required_sections = ["feed_source", "polymer_conditioner", "dewatering_unit"]
        for section in required_sections:
            if section not in plant_definition:
                result["errors"].append(f"Missing required section: {section}")
                return result
            if "parameters" not in plant_definition[section]:
                result["errors"].append(f"Missing 'parameters' in {section}")
                return result

        feed_params = plant_definition["feed_source"]["parameters"]
        polymer_params = plant_definition["polymer_conditioner"]["parameters"]
        dewatering_params = plant_definition["dewatering_unit"]["parameters"]
        settings = plant_definition.get("settings", {})

        # ---------------------------------------------------------------------
        # Extract parameters with defaults
        # ---------------------------------------------------------------------
        # Feed parameters
        flow_m3_h = feed_params.get("flow_m3_h", 0)
        ts_percent = feed_params.get("ts_percent", 0)
        temperature_C = feed_params.get("temperature_C", 20.0)

        # Polymer parameters
        jar_dose_ppm = jar_test_optimum_ppm or polymer_params.get("jar_test_optimum_ppm", 0)
        shear_factor = polymer_params.get("shear_factor", 1.0)
        safety_factor = polymer_params.get("safety_factor", 1.0)

        # Dewatering parameters
        max_flow_m3_h = dewatering_params.get("max_flow_m3_h", 100)
        capture_rate = dewatering_params.get("capture_rate", 0.95)
        cake_dryness_percent = dewatering_params.get("cake_dryness_percent", 23.0)
        polymer_split_cake = dewatering_params.get("polymer_split_cake", 0.3)

        # Settings
        polymer_price_per_kg = settings.get("polymer_price_per_kg")
        operating_hours_per_day = settings.get("operating_hours_per_day", 24.0)

        # ---------------------------------------------------------------------
        # Generate parameter validation warnings
        # ---------------------------------------------------------------------
        result["warnings"].extend(
            validate_feed_parameters(flow_m3_h, ts_percent, temperature_C)
        )
        result["warnings"].extend(
            validate_polymer_parameters(jar_dose_ppm, shear_factor, safety_factor)
        )
        result["warnings"].extend(
            validate_dewatering_parameters(
                flow_m3_h, max_flow_m3_h, capture_rate, cake_dryness_percent
            )
        )

        # Check for dose outside typical range
        effective_ppm = get_effective_dose_ppm(jar_dose_ppm, shear_factor, safety_factor)
        if effective_ppm < 5:
            result["warnings"].append(
                f"Very low effective dose ({effective_ppm:.1f} ppm) - may result in poor flocculation"
            )
        elif effective_ppm > 50:
            result["warnings"].append(
                f"Very high effective dose ({effective_ppm:.1f} ppm) - verify jar test results"
            )

        # ---------------------------------------------------------------------
        # Build feed stream
        # ---------------------------------------------------------------------
        feed = make_feed_stream(
            flow_m3_h=flow_m3_h,
            ts_percent=ts_percent,
            temperature_C=temperature_C,
            stream_id="feed",
        )

        # ---------------------------------------------------------------------
        # Apply polymer
        # ---------------------------------------------------------------------
        conditioned = apply_polymer(
            feed=feed,
            jar_dose_ppm=jar_dose_ppm,
            shear_factor=shear_factor,
            safety_factor=safety_factor,
            stream_id="conditioned",
        )

        # ---------------------------------------------------------------------
        # Run dewatering
        # ---------------------------------------------------------------------
        cake, liquid = dewatering_unit(
            feed=conditioned,
            capture_rate=capture_rate,
            cake_dryness_percent=cake_dryness_percent,
            polymer_split_cake=polymer_split_cake,
            cake_stream_id="cake",
            liquid_stream_id="liquid",
        )

        # ---------------------------------------------------------------------
        # Compute KPIs
        # ---------------------------------------------------------------------
        kpis = compute_kpis(
            feed=feed,
            conditioned=conditioned,
            cake=cake,
            liquid=liquid,
            polymer_price_per_kg=polymer_price_per_kg,
            operating_hours_per_day=operating_hours_per_day,
        )

        # Add KPI-based warnings
        result["warnings"].extend(generate_kpi_warnings(kpis))

        # ---------------------------------------------------------------------
        # Build result
        # ---------------------------------------------------------------------
        result["success"] = True
        result["streams"] = {
            "feed": feed.to_dict(),
            "conditioned": conditioned.to_dict(),
            "cake": cake.to_dict(),
            "liquid": liquid.to_dict(),
        }
        result["kpis"] = kpis

        # Remove duplicate warnings
        result["warnings"] = list(dict.fromkeys(result["warnings"]))

    except ValueError as e:
        result["errors"].append(str(e))
    except KeyError as e:
        result["errors"].append(f"Missing required parameter: {e}")
    except Exception as e:
        result["errors"].append(f"Unexpected error: {str(e)}")

    return result


def validate_plant_definition(plant_definition: Dict[str, Any]) -> List[str]:
    """
    Validate plant definition structure without running simulation.

    Args:
        plant_definition: Plant configuration dictionary.

    Returns:
        List of validation error messages (empty if valid).
    """
    errors = []

    required_sections = ["feed_source", "polymer_conditioner", "dewatering_unit"]
    for section in required_sections:
        if section not in plant_definition:
            errors.append(f"Missing required section: {section}")
            continue
        if "parameters" not in plant_definition[section]:
            errors.append(f"Missing 'parameters' in {section}")

    if "feed_source" in plant_definition and "parameters" in plant_definition["feed_source"]:
        params = plant_definition["feed_source"]["parameters"]
        if "flow_m3_h" not in params:
            errors.append("feed_source.parameters.flow_m3_h is required")
        if "ts_percent" not in params:
            errors.append("feed_source.parameters.ts_percent is required")

    if "polymer_conditioner" in plant_definition and "parameters" in plant_definition["polymer_conditioner"]:
        params = plant_definition["polymer_conditioner"]["parameters"]
        if "jar_test_optimum_ppm" not in params:
            errors.append("polymer_conditioner.parameters.jar_test_optimum_ppm is required")
        if "shear_factor" not in params:
            errors.append("polymer_conditioner.parameters.shear_factor is required")
        if "safety_factor" not in params:
            errors.append("polymer_conditioner.parameters.safety_factor is required")

    if "dewatering_unit" in plant_definition and "parameters" in plant_definition["dewatering_unit"]:
        params = plant_definition["dewatering_unit"]["parameters"]
        if "capture_rate" not in params:
            errors.append("dewatering_unit.parameters.capture_rate is required")
        if "cake_dryness_percent" not in params:
            errors.append("dewatering_unit.parameters.cake_dryness_percent is required")

    return errors
