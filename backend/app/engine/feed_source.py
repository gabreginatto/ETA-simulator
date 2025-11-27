"""
Feed source logic for creating feed streams.

This module provides functions to create Stream objects representing
the sludge feed entering the dewatering process.

Example:
    >>> from app.engine.feed_source import make_feed_stream
    >>> feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)
    >>> feed.mass_flow_kg_h
    100000.0
    >>> feed.dry_solids_percent
    3.0
"""
from app.models.stream import Stream


def make_feed_stream(
    flow_m3_h: float,
    ts_percent: float,
    temperature_C: float = 20.0,
    stream_id: str = "feed",
) -> Stream:
    """
    Create a feed stream from volumetric flow and total solids percentage.

    Args:
        flow_m3_h: Volumetric flow rate in m³/h.
        ts_percent: Total solids percentage (e.g., 3.0 for 3%).
        temperature_C: Temperature in degrees Celsius. Defaults to 20.0.
        stream_id: Unique identifier for the stream. Defaults to "feed".

    Returns:
        A Stream object representing the feed sludge.

    Raises:
        ValueError: If flow_m3_h is negative.
        ValueError: If ts_percent is outside the range [0, 100].

    Example:
        >>> feed = make_feed_stream(100.0, 3.0)
        >>> feed.volumetric_flow_m3_h
        99.12...
        >>> feed.dry_solids_mass_flow_kg_h
        3000.0
    """
    # Validate inputs
    if flow_m3_h < 0:
        raise ValueError(f"Flow rate cannot be negative: {flow_m3_h} m³/h")

    if ts_percent < 0 or ts_percent > 100:
        raise ValueError(
            f"Total solids percentage must be between 0 and 100: {ts_percent}%"
        )

    # Assume water-like density for initial calculation
    # (more accurate density comes from the Stream properties)
    initial_density_kg_m3 = 1000.0

    # Calculate mass flow from volumetric flow
    mass_flow_kg_h = flow_m3_h * initial_density_kg_m3

    # Calculate dry solids mass flow
    dry_solids_mass_flow_kg_h = mass_flow_kg_h * (ts_percent / 100.0)

    # Create and return the stream
    return Stream(
        id=stream_id,
        mass_flow_kg_h=mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=dry_solids_mass_flow_kg_h,
        polymer_mass_flow_kg_h=0.0,  # No polymer in feed
        temperature_C=temperature_C,
    )


def validate_feed_parameters(
    flow_m3_h: float,
    ts_percent: float,
    temperature_C: float = 20.0,
) -> list[str]:
    """
    Validate feed parameters and return list of warning messages.

    Args:
        flow_m3_h: Volumetric flow rate in m³/h.
        ts_percent: Total solids percentage.
        temperature_C: Temperature in degrees Celsius.

    Returns:
        List of warning messages (empty if no warnings).
    """
    warnings = []

    # Flow warnings
    if flow_m3_h <= 0:
        warnings.append("Flow rate is zero or negative - no flow will occur")
    elif flow_m3_h > 500:
        warnings.append(f"Very high flow rate ({flow_m3_h} m³/h) - verify input")

    # Solids warnings
    if ts_percent < 0.5:
        warnings.append(f"Very low solids ({ts_percent}%) - dilute feed")
    elif ts_percent > 8.0:
        warnings.append(f"High solids ({ts_percent}%) - may affect pumpability")

    # Temperature warnings
    if temperature_C < 5:
        warnings.append(f"Low temperature ({temperature_C}°C) - may affect viscosity")
    elif temperature_C > 40:
        warnings.append(f"High temperature ({temperature_C}°C) - verify process conditions")

    return warnings
