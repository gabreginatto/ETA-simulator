"""
Rapid filter node for drinking water treatment.

Rapid sand/dual media filters remove remaining suspended solids after
sedimentation or DAF. They require periodic backwashing.

Produces two outputs:
- Filtered water (very low solids) going to clearwell or distribution
- Backwash waste (contains captured solids) going to residuals

Mass balance:
- Filtered water = feed - backwash waste
- Backwash is modeled as an average waste stream (not the actual pulse)
"""
from typing import Dict, Any
from ..models.stream import Stream


def simulate_filter(
    feed: Stream,
    capture_rate: float = 0.95,
    run_length_h: float = 24.0,
    backwash_rate_m3_m2_min: float = 0.8,
    backwash_time_min: float = 10.0,
    filter_area_m2: float = 50.0,
    filtered_id: str = "filtered",
    backwash_id: str = "backwash",
) -> Dict[str, Stream]:
    """
    Simulate rapid filter operation.

    The backwash waste is modeled as an average flow over the run cycle,
    not as a pulse during actual backwash.

    Args:
        feed: Input clarified water stream
        capture_rate: Fraction of remaining solids captured (0.90-0.99 typical)
        run_length_h: Filter run time between backwashes (12-48 hours)
        backwash_rate_m3_m2_min: Backwash rate (0.6-1.0 m³/m²/min typical)
        backwash_time_min: Duration of backwash (5-15 minutes)
        filter_area_m2: Filter bed area (for backwash volume calculation)
        filtered_id: ID for filtered water output
        backwash_id: ID for backwash waste output

    Returns:
        Dictionary with 'filtered' and 'backwash' streams
    """
    if not 0 <= capture_rate <= 1:
        raise ValueError("Capture rate must be between 0 and 1")
    if run_length_h <= 0:
        raise ValueError("Run length must be positive")

    # Calculate solids split
    feed_solids_kg_h = feed.dry_solids_mass_flow_kg_h
    captured_solids_kg_h = feed_solids_kg_h * capture_rate
    passed_solids_kg_h = feed_solids_kg_h * (1 - capture_rate)

    # Calculate backwash water volume per cycle
    backwash_volume_m3 = backwash_rate_m3_m2_min * filter_area_m2 * backwash_time_min

    # Calculate number of backwashes per hour
    backwashes_per_hour = 1.0 / run_length_h

    # Average backwash water flow rate
    backwash_water_m3_h = backwash_volume_m3 * backwashes_per_hour

    # Backwash water density (approximately water)
    backwash_water_kg_h = backwash_water_m3_h * 1000.0

    # Total backwash stream includes captured solids and wash water
    backwash_mass_kg_h = backwash_water_kg_h + captured_solids_kg_h

    # Backwash solids concentration (check it's reasonable)
    if backwash_mass_kg_h > 0:
        backwash_solids_percent = (captured_solids_kg_h / backwash_mass_kg_h) * 100
    else:
        backwash_solids_percent = 0

    # Filtered water is feed minus captured solids (backwash water is added)
    # Net filtered water = feed water - backwash water
    filtered_mass_kg_h = feed.mass_flow_kg_h - backwash_water_kg_h
    if filtered_mass_kg_h < 0:
        # Limit backwash flow
        backwash_water_kg_h = feed.mass_flow_kg_h * 0.05
        filtered_mass_kg_h = feed.mass_flow_kg_h - backwash_water_kg_h
        backwash_mass_kg_h = backwash_water_kg_h + captured_solids_kg_h

    # Polymer distribution (most goes with backwash)
    polymer_to_backwash = feed.polymer_mass_flow_kg_h * 0.90
    polymer_to_filtered = feed.polymer_mass_flow_kg_h * 0.10

    filtered = Stream(
        id=filtered_id,
        mass_flow_kg_h=filtered_mass_kg_h,
        dry_solids_mass_flow_kg_h=passed_solids_kg_h,
        polymer_mass_flow_kg_h=polymer_to_filtered,
        temperature_C=feed.temperature_C,
    )

    backwash = Stream(
        id=backwash_id,
        mass_flow_kg_h=backwash_mass_kg_h,
        dry_solids_mass_flow_kg_h=captured_solids_kg_h,
        polymer_mass_flow_kg_h=polymer_to_backwash,
        temperature_C=feed.temperature_C,
    )

    return {"filtered": filtered, "backwash": backwash}
