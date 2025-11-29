"""
Sedimentation basin node for drinking water treatment.

The sedimentation basin allows flocculated particles to settle by gravity.
It produces two outputs:
- Clarified water (low solids) going to filters
- Sludge (high solids) going to residuals handling

Mass balance:
- Clarified water = feed - sludge
- Sludge contains captured solids at underflow solids concentration
"""
from typing import Dict, Any
from ..models.stream import Stream


def simulate_sedimentation(
    feed: Stream,
    capture_rate: float = 0.90,
    underflow_solids_percent: float = 1.0,
    clarified_id: str = "sed_clarified",
    sludge_id: str = "sed_sludge",
) -> Dict[str, Stream]:
    """
    Simulate conventional sedimentation basin.

    Args:
        feed: Input flocculated water stream
        capture_rate: Fraction of solids captured in sludge (0.80-0.95 typical)
        underflow_solids_percent: Sludge concentration (0.5-2% typical for WTP)
        clarified_id: ID for clarified water output
        sludge_id: ID for sludge output

    Returns:
        Dictionary with 'clarified' and 'sludge' streams
    """
    if not 0 <= capture_rate <= 1:
        raise ValueError("Capture rate must be between 0 and 1")
    if underflow_solids_percent <= 0 or underflow_solids_percent > 10:
        raise ValueError("Underflow solids percent must be between 0 and 10")

    # Calculate solids split
    feed_solids_kg_h = feed.dry_solids_mass_flow_kg_h
    captured_solids_kg_h = feed_solids_kg_h * capture_rate
    escaped_solids_kg_h = feed_solids_kg_h * (1 - capture_rate)

    # Calculate sludge mass flow from solids concentration
    # sludge_mass = captured_solids / (underflow_solids_percent / 100)
    underflow_fraction = underflow_solids_percent / 100.0
    sludge_mass_kg_h = captured_solids_kg_h / underflow_fraction

    # Clarified water is feed minus sludge
    clarified_mass_kg_h = feed.mass_flow_kg_h - sludge_mass_kg_h
    if clarified_mass_kg_h < 0:
        # Limit sludge flow if mass balance would go negative
        sludge_mass_kg_h = feed.mass_flow_kg_h * 0.05  # Max 5% underflow
        captured_solids_kg_h = sludge_mass_kg_h * underflow_fraction
        clarified_mass_kg_h = feed.mass_flow_kg_h - sludge_mass_kg_h
        escaped_solids_kg_h = feed_solids_kg_h - captured_solids_kg_h

    # Polymer distribution (most goes with sludge)
    polymer_to_sludge = feed.polymer_mass_flow_kg_h * 0.8
    polymer_to_clarified = feed.polymer_mass_flow_kg_h * 0.2

    clarified = Stream(
        id=clarified_id,
        mass_flow_kg_h=clarified_mass_kg_h,
        dry_solids_mass_flow_kg_h=escaped_solids_kg_h,
        polymer_mass_flow_kg_h=polymer_to_clarified,
        temperature_C=feed.temperature_C,
    )

    sludge = Stream(
        id=sludge_id,
        mass_flow_kg_h=sludge_mass_kg_h,
        dry_solids_mass_flow_kg_h=captured_solids_kg_h,
        polymer_mass_flow_kg_h=polymer_to_sludge,
        temperature_C=feed.temperature_C,
    )

    return {"clarified": clarified, "sludge": sludge}
