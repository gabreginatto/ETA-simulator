"""
Pump unit simulation.

This module implements the hydraulic power calculations for a pump.
"""
from app.models.stream import Stream

def simulate_pump(
    stream: Stream,
    head_m: float,
    efficiency: float,
    output_stream_id: str = "pump_out"
) -> Stream:
    """
    Simulate a pump by calculating energy consumption.
    
    Power (kW) = (Flow (m3/h) * Head (m) * Density * g) / (3.6e6 * efficiency)
    
    Args:
        stream: Input stream.
        head_m: Pump head in meters.
        efficiency: Pump efficiency (0-1).
        output_stream_id: ID for the output stream.
        
    Returns:
        A new Stream instance (identical mass flows) with added 'power_kW' metadata.
    """
    if efficiency <= 0 or efficiency > 1:
        raise ValueError(f"Efficiency must be in (0, 1]: {efficiency}")

    # Create a copy of the stream
    # We use the same mass flows, just potentially different ID
    out_stream = Stream(
        id=output_stream_id,
        mass_flow_kg_h=stream.mass_flow_kg_h,
        dry_solids_mass_flow_kg_h=stream.dry_solids_mass_flow_kg_h,
        polymer_mass_flow_kg_h=stream.polymer_mass_flow_kg_h,
        temperature_C=stream.temperature_C
    )
    
    # Physics calculation
    # g = 9.81 m/s^2
    # Density is in kg/m^3
    # Flow is in m^3/h
    # Power (kW) = (Q * H * rho * g) / (3.6e6 * eta)
    
    g = 9.81
    rho = stream.density_kg_m3
    q_m3_h = stream.volumetric_flow_m3_h
    
    # Avoid division by zero if efficiency is somehow checked but passed as zero (though validated above)
    power_kW = (q_m3_h * head_m * rho * g) / (3.6e6 * efficiency)
    
    # Attach metadata to the instance
    # This attribute is dynamic and used by the solver for energy calculations
    out_stream.power_kW = power_kW
    
    return out_stream
