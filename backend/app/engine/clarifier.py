"""
Clarifier (Sedimentation Tank) logic.

Separates a feed stream into a clarified supernatant (overflow)
and a thickened sludge (underflow) based on capture efficiency
and hydraulic settings.
"""
from typing import Dict, List

from app.models.stream import Stream


def simulate_clarifier(
    feed: Stream,
    underflow_rate_m3_h: float,
    capture_rate: float = 0.98,
    overflow_id: str = "clarifier_overflow",
    underflow_id: str = "clarifier_underflow",
) -> Dict[str, Stream]:
    """
    Simulate a clarifier splitting one stream into two.

    Args:
        feed: Input stream.
        underflow_rate_m3_h: The volume pumped out the bottom (m3/h).
        capture_rate: Fraction of solids that settle to the bottom (0.0-1.0).

    Returns:
        Dict with keys 'overflow' (liquid) and 'underflow' (sludge).

    Raises:
        ValueError: If underflow rate exceeds total feed flow.
    """
    solids_in_kg_h = feed.dry_solids_mass_flow_kg_h
    solids_to_underflow = solids_in_kg_h * capture_rate
    solids_to_overflow = solids_in_kg_h - solids_to_underflow

    # Estimate density of underflow sludge based on solids concentration
    rho_sludge_est = (
        1000.0 + (solids_to_underflow / underflow_rate_m3_h * 0.6)
        if underflow_rate_m3_h > 0
        else 1000.0
    )
    total_mass_underflow = underflow_rate_m3_h * rho_sludge_est

    if total_mass_underflow > feed.mass_flow_kg_h:
        raise ValueError(
            f"Underflow rate ({underflow_rate_m3_h} m3/h) exceeds total feed flow!"
        )

    # Split polymer proportionally with solids
    poly_in = feed.polymer_mass_flow_kg_h
    poly_to_underflow = poly_in * capture_rate
    poly_to_overflow = poly_in - poly_to_underflow

    underflow = Stream(
        id=underflow_id,
        mass_flow_kg_h=total_mass_underflow,
        dry_solids_mass_flow_kg_h=solids_to_underflow,
        polymer_mass_flow_kg_h=poly_to_underflow,
        temperature_C=feed.temperature_C,
    )

    overflow = Stream(
        id=overflow_id,
        mass_flow_kg_h=feed.mass_flow_kg_h - total_mass_underflow,
        dry_solids_mass_flow_kg_h=solids_to_overflow,
        polymer_mass_flow_kg_h=poly_to_overflow,
        temperature_C=feed.temperature_C,
    )

    return {"overflow": overflow, "underflow": underflow}


def validate_clarifier_params(feed_flow_m3_h: float, surface_area_m2: float) -> List[str]:
    """
    Check hydraulic loading rates for clarifier design.

    Args:
        feed_flow_m3_h: Feed volumetric flow rate.
        surface_area_m2: Clarifier surface area.

    Returns:
        List of warning messages (empty if parameters are acceptable).
    """
    warnings: List[str] = []
    if surface_area_m2 <= 0:
        return warnings

    sor = feed_flow_m3_h / surface_area_m2
    if sor > 30.0:
        warnings.append(
            f"High Surface Overflow Rate ({sor:.1f} m/h) - Risk of solids washout"
        )

    return warnings
