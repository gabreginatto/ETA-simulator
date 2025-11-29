"""
Dissolved Air Flotation (DAF) node for drinking water treatment.

DAF uses micro-bubbles to float flocs to the surface instead of settling.
It's often used for low-density flocs or algae-rich waters.

Produces two outputs:
- Clarified water (low solids) going to filters
- Float (high solids) going to residuals handling

Mass balance similar to sedimentation but may achieve higher capture rates.
"""
from typing import Dict, Any
from ..models.stream import Stream


def simulate_daf(
    feed: Stream,
    capture_rate: float = 0.92,
    float_solids_percent: float = 2.0,
    air_to_solids_ratio: float = 0.02,
    recycle_rate: float = 0.10,
    clarified_id: str = "daf_clarified",
    float_id: str = "daf_float",
) -> Dict[str, Stream]:
    """
    Simulate Dissolved Air Flotation unit.

    Args:
        feed: Input flocculated water stream
        capture_rate: Fraction of solids captured in float (0.85-0.95 typical)
        float_solids_percent: Float concentration (1-4% typical for DAF)
        air_to_solids_ratio: Air to solids ratio (kg air / kg solids, typically 0.01-0.04)
        recycle_rate: Fraction of clarified water recycled for saturation (0.06-0.15)
        clarified_id: ID for clarified water output
        float_id: ID for float output

    Returns:
        Dictionary with 'clarified' and 'float' streams
    """
    if not 0 <= capture_rate <= 1:
        raise ValueError("Capture rate must be between 0 and 1")
    if float_solids_percent <= 0 or float_solids_percent > 10:
        raise ValueError("Float solids percent must be between 0 and 10")

    # Calculate solids split
    feed_solids_kg_h = feed.dry_solids_mass_flow_kg_h
    captured_solids_kg_h = feed_solids_kg_h * capture_rate
    escaped_solids_kg_h = feed_solids_kg_h * (1 - capture_rate)

    # Calculate float mass flow from solids concentration
    float_fraction = float_solids_percent / 100.0
    float_mass_kg_h = captured_solids_kg_h / float_fraction

    # Clarified water is feed minus float
    clarified_mass_kg_h = feed.mass_flow_kg_h - float_mass_kg_h
    if clarified_mass_kg_h < 0:
        # Limit float flow if mass balance would go negative
        float_mass_kg_h = feed.mass_flow_kg_h * 0.08  # Max 8% float
        captured_solids_kg_h = float_mass_kg_h * float_fraction
        clarified_mass_kg_h = feed.mass_flow_kg_h - float_mass_kg_h
        escaped_solids_kg_h = feed_solids_kg_h - captured_solids_kg_h

    # Polymer distribution (most goes with float)
    polymer_to_float = feed.polymer_mass_flow_kg_h * 0.85
    polymer_to_clarified = feed.polymer_mass_flow_kg_h * 0.15

    clarified = Stream(
        id=clarified_id,
        mass_flow_kg_h=clarified_mass_kg_h,
        dry_solids_mass_flow_kg_h=escaped_solids_kg_h,
        polymer_mass_flow_kg_h=polymer_to_clarified,
        temperature_C=feed.temperature_C,
    )

    float_stream = Stream(
        id=float_id,
        mass_flow_kg_h=float_mass_kg_h,
        dry_solids_mass_flow_kg_h=captured_solids_kg_h,
        polymer_mass_flow_kg_h=polymer_to_float,
        temperature_C=feed.temperature_C,
    )

    return {"clarified": clarified, "float": float_stream}
