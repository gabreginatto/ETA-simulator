"""
Clearwell (contact tank) node for drinking water treatment.

The clearwell provides contact time for disinfection (CT concept) before
distribution. It's a pass-through node for mass balance purposes.

Parameters:
- volume_m3: Tank volume for CT calculation
- contact_time_min: Theoretical detention time (placeholder for CT calculation)
"""
from typing import Dict, Any
from ..models.stream import Stream


def simulate_clearwell(
    feed: Stream,
    volume_m3: float = 500.0,
    contact_time_min: float = 30.0,
    stream_id: str = "finished",
) -> Stream:
    """
    Simulate clearwell / contact tank - pass-through with CT parameters.

    The clearwell doesn't change mass balance but provides parameters
    for CT (concentration × time) disinfection calculations.

    Args:
        feed: Input filtered water stream
        volume_m3: Tank volume in m³
        contact_time_min: Theoretical contact time in minutes
        stream_id: ID for the output stream (finished water)

    Returns:
        Stream (unchanged from input, relabeled as finished water)
    """
    if volume_m3 <= 0:
        raise ValueError("Volume must be positive")

    # Calculate actual detention time based on flow
    # detention_time_h = volume_m3 / volumetric_flow_m3_h
    if feed.volumetric_flow_m3_h > 0:
        actual_detention_min = (volume_m3 / feed.volumetric_flow_m3_h) * 60.0
    else:
        actual_detention_min = 0.0

    # CT calculation would go here if chlorine dose was modeled
    # CT = chlorine_mg_L * contact_time_min

    # Pass-through - clearwell doesn't change mass balance
    return Stream(
        id=stream_id,
        mass_flow_kg_h=feed.mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=feed.dry_solids_mass_flow_kg_h,
        polymer_mass_flow_kg_h=feed.polymer_mass_flow_kg_h,
        temperature_C=feed.temperature_C,
    )
