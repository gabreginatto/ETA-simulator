"""
Coagulant dosing node for drinking water treatment.

The coagulant node adds coagulant (alum, ferric chloride, PAC, etc.) to the
raw water stream. The coagulant forms flocs with turbidity/suspended solids.

Mass balance:
- Coagulant adds a small mass to the stream (coagulant dose in mg/L)
- Dry solids increase by the coagulant mass added
- The main stream flow remains essentially unchanged
"""
from typing import Dict, Any
from ..models.stream import Stream


def simulate_coagulant(
    feed: Stream,
    dose_mg_L: float = 30.0,
    coagulant_type: str = "alum",
    stream_id: str = "coagulated",
) -> Stream:
    """
    Simulate coagulant addition to raw water.

    Args:
        feed: Input water stream
        dose_mg_L: Coagulant dose in mg/L (typical 20-60 mg/L for alum)
        coagulant_type: Type of coagulant (alum, ferric_chloride, pac, other)
        stream_id: ID for the output stream

    Returns:
        Stream with coagulant added
    """
    if dose_mg_L < 0:
        raise ValueError("Coagulant dose must be non-negative")

    # Calculate coagulant mass flow
    # dose_mg_L * flow_m3_h * 1000 L/m3 / 1e6 mg/kg = kg/h
    vol_flow_m3_h = feed.volumetric_flow_m3_h
    coagulant_mass_kg_h = dose_mg_L * vol_flow_m3_h * 1000.0 / 1e6

    # Coagulant adds to dry solids (it becomes part of the floc)
    new_dry_solids = feed.dry_solids_mass_flow_kg_h + coagulant_mass_kg_h
    new_total_mass = feed.mass_flow_kg_h + coagulant_mass_kg_h

    return Stream(
        id=stream_id,
        mass_flow_kg_h=new_total_mass,
        dry_solids_mass_flow_kg_h=new_dry_solids,
        polymer_mass_flow_kg_h=feed.polymer_mass_flow_kg_h,
        temperature_C=feed.temperature_C,
    )
