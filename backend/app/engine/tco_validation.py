"""
TCO Settings Validation Module.

Validates TCO-related settings and returns warnings for invalid or
out-of-range values.
"""
from typing import Dict, Any, List


def validate_tco_settings(settings: Dict[str, Any]) -> List[str]:
    """
    Validate TCO settings and return warnings for invalid values.

    Args:
        settings: Plant settings dictionary

    Returns:
        List of warning messages for invalid settings
    """
    warnings: List[str] = []

    if not settings:
        return warnings

    # Validate filtration parameters
    backwash_volume = settings.get("backwash_volume_m3")
    if backwash_volume is not None and backwash_volume <= 0:
        warnings.append("TCO Warning: backwash_volume_m3 must be > 0")

    runtime = settings.get("filter_runtime_hours_to_clog")
    if runtime is not None and runtime <= 0:
        warnings.append("TCO Warning: filter_runtime_hours_to_clog must be > 0")

    filter_flow = settings.get("filter_flow_m3_h")
    if filter_flow is not None and filter_flow <= 0:
        warnings.append("TCO Warning: filter_flow_m3_h must be > 0")

    filters_parallel = settings.get("filters_in_parallel")
    if filters_parallel is not None and filters_parallel < 1:
        warnings.append("TCO Warning: filters_in_parallel must be >= 1")

    backwash_time = settings.get("backwash_time_hours")
    if backwash_time is not None and backwash_time < 0:
        warnings.append("TCO Warning: backwash_time_hours must be >= 0")

    # Validate cost parameters (must be non-negative)
    cost_fields = [
        ("polymer_price_per_kg", "Polymer price"),
        ("coagulant_price_per_kg", "Coagulant price"),
        ("water_cost_per_m3", "Water cost"),
        ("product_price_per_m3", "Product price"),
        ("disposal_cost_per_ton_wet", "Disposal cost"),
        ("storage_cost_per_kg", "Storage cost"),
        ("handling_cost_per_kg", "Handling cost"),
        ("electricity_price_per_kwh", "Electricity price"),
    ]

    for field_name, display_name in cost_fields:
        value = settings.get(field_name)
        if value is not None and value < 0:
            warnings.append(f"TCO Warning: {display_name} ({field_name}) must be >= 0")

    # Validate dose parameters
    coagulant_dose = settings.get("coagulant_dose_mg_L")
    if coagulant_dose is not None and coagulant_dose < 0:
        warnings.append("TCO Warning: coagulant_dose_mg_L must be >= 0")

    # Sanity checks for realistic ranges
    polymer_price = settings.get("polymer_price_per_kg")
    if polymer_price is not None and polymer_price > 100:
        warnings.append(f"TCO Warning: polymer_price_per_kg ({polymer_price}) seems unusually high (> 100)")

    disposal_cost = settings.get("disposal_cost_per_ton_wet")
    if disposal_cost is not None and disposal_cost > 1000:
        warnings.append(f"TCO Warning: disposal_cost_per_ton_wet ({disposal_cost}) seems unusually high (> 1000)")

    return warnings
