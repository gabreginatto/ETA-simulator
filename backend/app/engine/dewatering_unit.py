"""
Dewatering unit mass balance calculations.

This module implements the mass balance for a dewatering unit (e.g., centrifuge,
belt filter press) that separates conditioned sludge into cake and liquid streams.

Example:
    >>> from app.models.stream import Stream
    >>> from app.engine.dewatering_unit import dewatering_unit
    >>> feed = Stream("cond", 100000.0, 3000.0, polymer_mass_flow_kg_h=2.0)
    >>> cake, liquid = dewatering_unit(feed, capture_rate=0.95, cake_dryness_percent=23.0)
    >>> cake.dry_solids_percent
    23.0
"""
from typing import Tuple
from app.models.stream import Stream


def dewatering_unit(
    feed: Stream,
    capture_rate: float,
    cake_dryness_percent: float,
    polymer_split_cake: float = 0.3,
    cake_stream_id: str = "cake",
    liquid_stream_id: str = "liquid",
) -> Tuple[Stream, Stream]:
    """
    Calculate mass balance for a dewatering unit.

    Separates conditioned sludge into cake (dewatered solids) and liquid
    (centrate/filtrate) streams based on capture rate and target cake dryness.

    Args:
        feed: Conditioned sludge input Stream.
        capture_rate: Fraction of solids captured in cake (e.g., 0.95 for 95%).
        cake_dryness_percent: Target dry solids percentage in cake (e.g., 23.0).
        polymer_split_cake: Fraction of polymer going to cake (default 0.3).
        cake_stream_id: Identifier for cake output stream.
        liquid_stream_id: Identifier for liquid output stream.

    Returns:
        Tuple of (cake_stream, liquid_stream).

    Raises:
        ValueError: If capture_rate is not in (0, 1].
        ValueError: If cake_dryness_percent is not in (0, 100].
        ValueError: If polymer_split_cake is not in [0, 1].
        ValueError: If mass balance cannot be closed (insufficient water).

    Example:
        >>> feed = Stream("cond", 100000.0, 3000.0, 2.0)
        >>> cake, liquid = dewatering_unit(feed, 0.95, 23.0)
        >>> abs(cake.mass_flow_kg_h + liquid.mass_flow_kg_h - feed.mass_flow_kg_h) < 1
        True
    """
    # Validate inputs
    if capture_rate <= 0 or capture_rate > 1:
        raise ValueError(
            f"Capture rate must be in range (0, 1]: {capture_rate}"
        )

    if cake_dryness_percent <= 0 or cake_dryness_percent > 100:
        raise ValueError(
            f"Cake dryness must be in range (0, 100]: {cake_dryness_percent}%"
        )

    if polymer_split_cake < 0 or polymer_split_cake > 1:
        raise ValueError(
            f"Polymer split to cake must be in range [0, 1]: {polymer_split_cake}"
        )

    # Input mass flows
    solids_in = feed.dry_solids_mass_flow_kg_h
    water_in = feed.water_mass_flow_kg_h
    polymer_in = feed.polymer_mass_flow_kg_h

    # Solids distribution
    solids_to_cake = solids_in * capture_rate
    solids_to_liquid = solids_in - solids_to_cake

    # Calculate cake mass from target dryness
    # cake_dryness = solids_to_cake / cake_mass_flow
    cake_ds_frac = cake_dryness_percent / 100.0
    cake_mass_flow_kg_h = solids_to_cake / cake_ds_frac

    # Water in cake
    cake_water_kg_h = cake_mass_flow_kg_h - solids_to_cake

    # Check if mass balance is feasible
    if cake_water_kg_h > water_in:
        raise ValueError(
            f"Cannot achieve {cake_dryness_percent}% cake dryness: "
            f"requires {cake_water_kg_h:.1f} kg/h water in cake, "
            f"but only {water_in:.1f} kg/h water available in feed. "
            f"Either increase feed TS% or reduce target cake dryness."
        )

    # Liquid stream mass balance
    liquid_water_kg_h = water_in - cake_water_kg_h
    liquid_mass_flow_kg_h = liquid_water_kg_h + solids_to_liquid

    # Polymer distribution
    polymer_to_cake = polymer_in * polymer_split_cake
    polymer_to_liquid = polymer_in - polymer_to_cake

    # Create output streams
    cake_stream = Stream(
        id=cake_stream_id,
        mass_flow_kg_h=cake_mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=solids_to_cake,
        polymer_mass_flow_kg_h=polymer_to_cake,
        temperature_C=feed.temperature_C,
    )

    liquid_stream = Stream(
        id=liquid_stream_id,
        mass_flow_kg_h=liquid_mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=solids_to_liquid,
        polymer_mass_flow_kg_h=polymer_to_liquid,
        temperature_C=feed.temperature_C,
    )

    return cake_stream, liquid_stream


def validate_dewatering_parameters(
    feed_flow_m3_h: float,
    max_flow_m3_h: float,
    capture_rate: float,
    cake_dryness_percent: float,
) -> list[str]:
    """
    Validate dewatering parameters and return list of warning messages.

    Args:
        feed_flow_m3_h: Actual feed flow rate.
        max_flow_m3_h: Maximum equipment capacity.
        capture_rate: Fraction of solids captured.
        cake_dryness_percent: Target cake dryness.

    Returns:
        List of warning messages (empty if no warnings).
    """
    warnings = []

    # Capacity warning
    if feed_flow_m3_h > max_flow_m3_h:
        warnings.append(
            f"Feed flow ({feed_flow_m3_h:.1f} m³/h) exceeds dewatering capacity "
            f"({max_flow_m3_h:.1f} m³/h)"
        )

    # Capture rate warnings
    if capture_rate < 0.90:
        warnings.append(
            f"Capture rate ({capture_rate*100:.1f}%) below 90% may indicate equipment issues"
        )

    # Cake dryness warnings
    if cake_dryness_percent < 18:
        warnings.append(
            f"Low cake dryness ({cake_dryness_percent}%) may increase disposal costs"
        )
    elif cake_dryness_percent > 30:
        warnings.append(
            f"Very high cake dryness ({cake_dryness_percent}%) - verify equipment capability"
        )

    return warnings


def calculate_dewatering_metrics(
    feed: Stream,
    cake: Stream,
    liquid: Stream,
    operating_hours_per_day: float = 24.0,
) -> dict:
    """
    Calculate dewatering performance metrics.

    Args:
        feed: Feed stream to dewatering unit.
        cake: Cake output stream.
        liquid: Liquid output stream.
        operating_hours_per_day: Operating hours per day.

    Returns:
        Dictionary with performance metrics.
    """
    # Mass balance closure
    total_out = cake.mass_flow_kg_h + liquid.mass_flow_kg_h
    closure_percent = (total_out / feed.mass_flow_kg_h) * 100 if feed.mass_flow_kg_h > 0 else 0

    # Actual capture rate
    actual_capture = (
        cake.dry_solids_mass_flow_kg_h / feed.dry_solids_mass_flow_kg_h
        if feed.dry_solids_mass_flow_kg_h > 0
        else 0
    )

    # Liquid TSS estimate (mg/L)
    liquid_tss_mg_L = 0.0
    if liquid.volumetric_flow_m3_h > 0:
        # Convert kg/h to mg/L: kg/h * 1e6 mg/kg / (m³/h * 1000 L/m³)
        liquid_tss_mg_L = (
            liquid.dry_solids_mass_flow_kg_h * 1e6
            / (liquid.volumetric_flow_m3_h * 1000)
        )

    # Daily metrics
    cake_wet_tons_per_day = cake.mass_flow_kg_h * operating_hours_per_day / 1000
    cake_tDS_per_day = cake.dry_solids_mass_flow_kg_h * operating_hours_per_day / 1000

    return {
        "mass_balance_closure_percent": closure_percent,
        "solids_capture_actual_percent": actual_capture * 100,
        "cake_dryness_percent": cake.dry_solids_percent,
        "cake_mass_kg_per_h": cake.mass_flow_kg_h,
        "cake_wet_tons_per_day": cake_wet_tons_per_day,
        "cake_tDS_per_day": cake_tDS_per_day,
        "liquid_flow_m3_h": liquid.volumetric_flow_m3_h,
        "liquid_tss_estimate_mg_L": liquid_tss_mg_L,
    }
