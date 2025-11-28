"""
Gravity Thickener logic.

Compacts sludge to a target solids percentage by removing water
to the supernatant stream.
"""
from typing import Dict

from app.models.stream import Stream


def simulate_thickener(
    feed: Stream,
    target_thickened_ts_percent: float,
    capture_rate: float = 0.95,
    supernatant_id: str = "thickener_supernatant",
    thickened_id: str = "thickener_sludge",
) -> Dict[str, Stream]:
    """
    Simulate a gravity thickener based on a target output concentration.

    Args:
        feed: Input stream.
        target_thickened_ts_percent: Target total solids in thickened output (%).
        capture_rate: Fraction of solids captured in thickened output (0.0-1.0).
        supernatant_id: Stream ID for supernatant output.
        thickened_id: Stream ID for thickened sludge output.

    Returns:
        Dict with keys 'thickened' (concentrated sludge) and 'supernatant' (liquid).

    Raises:
        ValueError: If target TS is unrealistic (<= 0 or > 20%).
        ValueError: If feed is too dilute to reach target concentration.
    """
    if target_thickened_ts_percent <= 0 or target_thickened_ts_percent > 20:
        raise ValueError(
            f"Unrealistic thickener target: {target_thickened_ts_percent}%"
        )

    solids_in = feed.dry_solids_mass_flow_kg_h
    solids_captured = solids_in * capture_rate
    solids_lost = solids_in - solids_captured

    # Calculate required total mass to achieve target concentration
    target_fraction = target_thickened_ts_percent / 100.0
    required_thickened_total_mass = solids_captured / target_fraction

    if required_thickened_total_mass > feed.mass_flow_kg_h:
        raise ValueError(
            f"Feed too dilute to reach {target_thickened_ts_percent}% solids "
            "even with 100% water removal."
        )

    thickened_sludge = Stream(
        id=thickened_id,
        mass_flow_kg_h=required_thickened_total_mass,
        dry_solids_mass_flow_kg_h=solids_captured,
        polymer_mass_flow_kg_h=feed.polymer_mass_flow_kg_h * capture_rate,
        temperature_C=feed.temperature_C,
    )

    supernatant_total_mass = feed.mass_flow_kg_h - required_thickened_total_mass
    supernatant = Stream(
        id=supernatant_id,
        mass_flow_kg_h=supernatant_total_mass,
        dry_solids_mass_flow_kg_h=solids_lost,
        polymer_mass_flow_kg_h=feed.polymer_mass_flow_kg_h * (1 - capture_rate),
        temperature_C=feed.temperature_C,
    )

    return {"thickened": thickened_sludge, "supernatant": supernatant}
