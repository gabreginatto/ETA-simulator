"""
Polymer conditioning logic for calculating polymer dosing.

This module calculates the polymer addition to sludge based on
jar test results, equipment shear factors, and safety margins.

Example:
    >>> from app.engine.feed_source import make_feed_stream
    >>> from app.engine.polymer_conditioner import apply_polymer
    >>> feed = make_feed_stream(100.0, 3.0)
    >>> conditioned = apply_polymer(feed, jar_dose_ppm=15.0, shear_factor=1.2, safety_factor=1.1)
    >>> conditioned.polymer_dose_ppm
    19.8
"""
from app.models.stream import Stream


def get_effective_dose_ppm(
    jar_dose_ppm: float,
    shear_factor: float,
    safety_factor: float,
) -> float:
    """
    Calculate the effective polymer dose accounting for equipment factors.

    The effective dose is higher than the jar test optimum because:
    - Shear factor: Full-scale equipment has more shear than jar tests
    - Safety factor: Additional margin for process variability

    Args:
        jar_dose_ppm: Optimum dose from jar test in ppm.
        shear_factor: Equipment shear correction factor (typically 1.0-1.5).
        safety_factor: Safety margin factor (typically 1.0-1.2).

    Returns:
        Effective polymer dose in ppm.

    Example:
        >>> get_effective_dose_ppm(15.0, 1.2, 1.1)
        19.8
    """
    return jar_dose_ppm * shear_factor * safety_factor


def apply_polymer(
    feed: Stream,
    jar_dose_ppm: float,
    shear_factor: float,
    safety_factor: float,
    stream_id: str = "conditioned",
) -> Stream:
    """
    Apply polymer to a feed stream and return the conditioned stream.

    This function does NOT mutate the input stream. It creates a new
    Stream object with the polymer added.

    Args:
        feed: Input Stream (typically the feed sludge).
        jar_dose_ppm: Optimum dose from jar test in ppm.
        shear_factor: Equipment shear correction factor (typically 1.0-1.5).
        safety_factor: Safety margin factor (typically 1.0-1.2).
        stream_id: Identifier for the output stream. Defaults to "conditioned".

    Returns:
        A new Stream object with polymer added.

    Raises:
        ValueError: If jar_dose_ppm is negative.
        ValueError: If shear_factor is not positive.
        ValueError: If safety_factor is not positive.

    Example:
        >>> feed = Stream("feed", 100000.0, 3000.0)
        >>> conditioned = apply_polymer(feed, 15.0, 1.2, 1.1)
        >>> conditioned.polymer_mass_flow_kg_h > 0
        True
    """
    # Validate inputs
    if jar_dose_ppm < 0:
        raise ValueError(f"Jar test dose cannot be negative: {jar_dose_ppm} ppm")

    if shear_factor <= 0:
        raise ValueError(f"Shear factor must be positive: {shear_factor}")

    if safety_factor <= 0:
        raise ValueError(f"Safety factor must be positive: {safety_factor}")

    # Calculate effective dose
    effective_ppm = get_effective_dose_ppm(jar_dose_ppm, shear_factor, safety_factor)

    # Get volumetric flow from feed
    vol_flow_m3_h = feed.volumetric_flow_m3_h

    # Convert ppm to kg/h
    # ppm = mg/L, so: kg/h = ppm * m³/h * 1000 L/m³ / 1e6 mg/kg
    polymer_kg_h = effective_ppm * vol_flow_m3_h * 1000.0 / 1e6

    # Create new stream (don't mutate input)
    return Stream(
        id=stream_id,
        mass_flow_kg_h=feed.mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=feed.dry_solids_mass_flow_kg_h,
        polymer_mass_flow_kg_h=polymer_kg_h,
        temperature_C=feed.temperature_C,
    )


def validate_polymer_parameters(
    jar_dose_ppm: float,
    shear_factor: float,
    safety_factor: float,
) -> list[str]:
    """
    Validate polymer parameters and return list of warning messages.

    Args:
        jar_dose_ppm: Optimum dose from jar test in ppm.
        shear_factor: Equipment shear correction factor.
        safety_factor: Safety margin factor.

    Returns:
        List of warning messages (empty if no warnings).
    """
    warnings = []

    # Dose warnings
    effective_ppm = get_effective_dose_ppm(jar_dose_ppm, shear_factor, safety_factor)

    if effective_ppm < 5:
        warnings.append(
            f"Very low effective dose ({effective_ppm:.1f} ppm) - may result in poor flocculation"
        )
    elif effective_ppm > 50:
        warnings.append(
            f"Very high effective dose ({effective_ppm:.1f} ppm) - verify jar test results"
        )

    # Factor warnings
    if shear_factor < 1.0:
        warnings.append(
            f"Shear factor ({shear_factor}) below 1.0 - typically full-scale needs higher doses"
        )
    elif shear_factor > 2.0:
        warnings.append(
            f"Very high shear factor ({shear_factor}) - verify equipment conditions"
        )

    if safety_factor < 1.0:
        warnings.append(
            f"Safety factor ({safety_factor}) below 1.0 - no safety margin"
        )
    elif safety_factor > 1.5:
        warnings.append(
            f"High safety factor ({safety_factor}) - may result in excess polymer use"
        )

    return warnings


def calculate_polymer_consumption(
    conditioned_stream: Stream,
    operating_hours_per_day: float = 24.0,
) -> dict:
    """
    Calculate polymer consumption metrics.

    Args:
        conditioned_stream: Stream with polymer added.
        operating_hours_per_day: Operating hours per day. Defaults to 24.0.

    Returns:
        Dictionary with consumption metrics.
    """
    polymer_kg_h = conditioned_stream.polymer_mass_flow_kg_h
    dry_solids_kg_h = conditioned_stream.dry_solids_mass_flow_kg_h

    # Calculate metrics
    polymer_kg_per_day = polymer_kg_h * operating_hours_per_day
    polymer_kg_per_month = polymer_kg_per_day * 30

    # kg polymer per ton of dry solids (tDS)
    if dry_solids_kg_h > 0:
        polymer_kg_per_tDS = (polymer_kg_h / dry_solids_kg_h) * 1000.0
    else:
        polymer_kg_per_tDS = 0.0

    return {
        "polymer_kg_per_h": polymer_kg_h,
        "polymer_kg_per_day": polymer_kg_per_day,
        "polymer_kg_per_month": polymer_kg_per_month,
        "polymer_kg_per_tDS": polymer_kg_per_tDS,
    }
