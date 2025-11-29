"""
Flocculator node for drinking water treatment.

The flocculator provides gentle mixing to allow coagulated particles to
aggregate into larger flocs. This is a pass-through node for mass balance
purposes - it doesn't change the stream composition, just provides
detention time for floc growth.

Parameters:
- detention_time_min: Typical 15-30 minutes
- g_value: Velocity gradient in s⁻¹ (typically 20-70 s⁻¹)
"""
from typing import Dict, Any
from ..models.stream import Stream


def simulate_flocculator(
    feed: Stream,
    detention_time_min: float = 20.0,
    g_value: float = 50.0,
    stream_id: str = "flocculated",
) -> Stream:
    """
    Simulate flocculation - pass-through with detention time.

    The flocculator doesn't change mass balance but provides parameters
    for process design calculations (Gt value for flocculation).

    Args:
        feed: Input coagulated water stream
        detention_time_min: Hydraulic detention time in minutes
        g_value: Velocity gradient in s⁻¹ (for Gt calculation)
        stream_id: ID for the output stream

    Returns:
        Stream (unchanged from input, just relabeled)
    """
    if detention_time_min <= 0:
        raise ValueError("Detention time must be positive")

    # Calculate Gt value (dimensionless) for reference
    # Typical Gt values: 10,000 - 100,000 for good flocculation
    detention_time_s = detention_time_min * 60.0
    gt_value = g_value * detention_time_s

    # Pass-through - flocculation doesn't change mass balance
    return Stream(
        id=stream_id,
        mass_flow_kg_h=feed.mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=feed.dry_solids_mass_flow_kg_h,
        polymer_mass_flow_kg_h=feed.polymer_mass_flow_kg_h,
        temperature_C=feed.temperature_C,
    )
