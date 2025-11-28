from app.models.stream import Stream
from app.engine.pump import simulate_pump
from app.engine.solver import solve_plant
import pytest

def test_pump_simulation():
    stream = Stream("test", 100000, 3000) # 100 m3/h approx (density ~1009)
    
    # Flow = 100000 / 1009 ~= 99.1 m3/h
    # Head = 20m
    # Efficiency = 0.7
    # Power = (99.1 * 20 * 1009 * 9.81) / (3.6e6 * 0.7)
    # Power ~= (19600000) / 2520000 ~= 7.7 kW
    
    pumped = simulate_pump(stream, head_m=20.0, efficiency=0.7)
    
    assert pumped.mass_flow_kg_h == stream.mass_flow_kg_h
    assert hasattr(pumped, "power_kW")
    assert pumped.power_kW > 0
    assert 7.0 < pumped.power_kW < 8.5

def test_solver_integration():
    plant_def = {
        "feed_source": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}},
        "polymer_conditioner": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}},
        "dewatering_unit": {"parameters": {"max_flow_m3_h": 150, "capture_rate": 0.95, "cake_dryness_percent": 23}},
        "transfer_pump": {"parameters": {"head_m": 20, "efficiency_pump": 0.7, "efficiency_motor": 1.0}},
        "settings": {"electricity_price_per_kwh": 0.1}
    }
    
    result = solve_plant(plant_def)
    assert result["success"] is True
    kpis = result["kpis"]
    assert "pump_power_kW" in kpis
    assert kpis["pump_power_kW"] > 0
    assert "energy_cost_per_month" in kpis
    assert kpis["energy_cost_per_month"] > 0
