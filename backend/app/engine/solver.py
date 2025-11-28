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


def solve_plant(
    plant_definition: Dict[str, Any],
    jar_test_optimum_ppm: Optional[float] = None,
    jar_test_range: Optional[Dict[str, float]] = None,
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
        jar_test_range: Optional dict with acceptable_range_min_ppm and acceptable_range_max_ppm.

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
        electricity_price_per_kwh = settings.get("electricity_price_per_kwh")
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

        # Check dose against jar test acceptable range
        if jar_test_range:
            range_min = jar_test_range.get("acceptable_range_min_ppm")
            range_max = jar_test_range.get("acceptable_range_max_ppm")
            if range_min is not None and effective_ppm < range_min:
                result["warnings"].append(
                    f"Effective dose ({effective_ppm:.1f} ppm) is below jar test acceptable range (min: {range_min:.1f} ppm)"
                )
            if range_max is not None and effective_ppm > range_max:
                result["warnings"].append(
                    f"Effective dose ({effective_ppm:.1f} ppm) exceeds jar test acceptable range (max: {range_max:.1f} ppm)"
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
        # Optional Pump
        # ---------------------------------------------------------------------
        stream_to_condition = feed
        pump_power = 0.0
        pump_out_stream = None

        pump_section = plant_definition.get("transfer_pump")
        if pump_section and "parameters" in pump_section:
            pump_params = pump_section["parameters"]
            head_m = pump_params.get("head_m", 20.0)
            eff_pump = pump_params.get("efficiency_pump", 0.7)
            eff_motor = pump_params.get("efficiency_motor", 0.9)
            
            # Total efficiency
            total_eff = eff_pump * eff_motor
            
            pump_out_stream = simulate_pump(
                stream=feed,
                head_m=head_m,
                efficiency=total_eff,
                output_stream_id="pump_out"
            )
            
            stream_to_condition = pump_out_stream
            pump_power = getattr(pump_out_stream, "power_kW", 0.0)

        # ---------------------------------------------------------------------
        # Apply polymer
        # ---------------------------------------------------------------------
        conditioned = apply_polymer(
            feed=stream_to_condition,
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
            electricity_price_per_kwh=electricity_price_per_kwh,
            operating_hours_per_day=operating_hours_per_day,
            pump_power_kW=pump_power,
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
        if pump_out_stream:
            result["streams"]["pump_out"] = pump_out_stream.to_dict()
            
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
