"""
Key Performance Indicator (KPI) calculations.

This module computes comprehensive KPIs for sludge dewatering operations,
including polymer metrics, cake production, and cost analysis.

Example:
    >>> from app.engine.kpis import compute_kpis
    >>> kpis = compute_kpis(feed, conditioned, cake, liquid, polymer_price_per_kg=5.0)
    >>> kpis['polymer_cost_per_month']
    7500.0
"""
from typing import Optional, Dict, Any
from app.models.stream import Stream


def compute_kpis(
    feed: Stream,
    conditioned: Stream,
    cake: Stream,
    liquid: Stream,
    polymer_price_per_kg: Optional[float] = None,
    electricity_price_per_kwh: Optional[float] = None,
    operating_hours_per_day: float = 24.0,
    pump_power_kW: float = 0.0,
) -> Dict[str, Any]:
    """
    Compute comprehensive KPIs for the dewatering process.

    Args:
        feed: Raw feed stream (before polymer).
        conditioned: Stream after polymer addition.
        cake: Dewatered cake output stream.
        liquid: Liquid (centrate/filtrate) output stream.
        polymer_price_per_kg: Polymer unit cost (optional).
        electricity_price_per_kwh: Electricity unit cost (optional).
        operating_hours_per_day: Operating hours per day. Defaults to 24.0.
        pump_power_kW: Power consumption of the pump in kW.

    Returns:
        Dictionary containing all calculated KPIs.
    """
    kpis: Dict[str, Any] = {}

    # -------------------------------------------------------------------------
    # 1. Polymer Metrics
    # -------------------------------------------------------------------------
    polymer_kg_h = conditioned.polymer_mass_flow_kg_h
    polymer_dose_ppm = conditioned.polymer_dose_ppm
    dry_solids_kg_h = conditioned.dry_solids_mass_flow_kg_h

    # kg polymer per ton of dry solids (tDS)
    polymer_kg_per_tDS = 0.0
    if dry_solids_kg_h > 0:
        polymer_kg_per_tDS = (polymer_kg_h / dry_solids_kg_h) * 1000.0

    # Daily and monthly consumption
    polymer_kg_per_day = polymer_kg_h * operating_hours_per_day
    polymer_kg_per_month = polymer_kg_per_day * 30

    kpis["polymer_dose_ppm"] = polymer_dose_ppm
    kpis["polymer_kg_per_tDS"] = polymer_kg_per_tDS
    kpis["polymer_kg_per_h"] = polymer_kg_h
    kpis["polymer_kg_per_day"] = polymer_kg_per_day
    kpis["polymer_kg_per_month"] = polymer_kg_per_month

    # -------------------------------------------------------------------------
    # 2. Cake Metrics
    # -------------------------------------------------------------------------
    cake_dryness_percent = cake.dry_solids_percent
    cake_mass_kg_per_h = cake.mass_flow_kg_h
    cake_wet_tons_per_day = cake_mass_kg_per_h * operating_hours_per_day / 1000
    cake_tDS_per_day = cake.dry_solids_mass_flow_kg_h * operating_hours_per_day / 1000

    kpis["cake_dryness_percent"] = cake_dryness_percent
    kpis["cake_mass_kg_per_h"] = cake_mass_kg_per_h
    kpis["cake_wet_tons_per_day"] = cake_wet_tons_per_day
    kpis["cake_tDS_per_day"] = cake_tDS_per_day

    # -------------------------------------------------------------------------
    # 3. Liquid Metrics
    # -------------------------------------------------------------------------
    liquid_flow_m3_h = liquid.volumetric_flow_m3_h

    # TSS estimate (mg/L)
    liquid_tss_estimate_mg_L = 0.0
    if liquid_flow_m3_h > 0:
        liquid_tss_estimate_mg_L = (
            liquid.dry_solids_mass_flow_kg_h * 1e6
            / (liquid_flow_m3_h * 1000)
        )

    kpis["liquid_flow_m3_h"] = liquid_flow_m3_h
    kpis["liquid_tss_estimate_mg_L"] = liquid_tss_estimate_mg_L

    # -------------------------------------------------------------------------
    # 4. Mass Balance
    # -------------------------------------------------------------------------
    total_in = feed.mass_flow_kg_h
    total_out = cake.mass_flow_kg_h + liquid.mass_flow_kg_h

    mass_balance_closure_percent = 0.0
    if total_in > 0:
        mass_balance_closure_percent = (total_out / total_in) * 100

    # Actual solids capture
    solids_capture_actual_percent = 0.0
    if feed.dry_solids_mass_flow_kg_h > 0:
        solids_capture_actual_percent = (
            cake.dry_solids_mass_flow_kg_h / feed.dry_solids_mass_flow_kg_h
        ) * 100

    kpis["mass_balance_closure_percent"] = mass_balance_closure_percent
    kpis["solids_capture_actual_percent"] = solids_capture_actual_percent

    # -------------------------------------------------------------------------
    # 5. Cost Metrics (Polymer)
    # -------------------------------------------------------------------------
    if polymer_price_per_kg is not None and polymer_price_per_kg > 0:
        polymer_cost_per_day = polymer_kg_per_day * polymer_price_per_kg
        polymer_cost_per_month = polymer_kg_per_month * polymer_price_per_kg
        polymer_cost_per_year = polymer_cost_per_day * 365
        polymer_cost_per_tDS = polymer_kg_per_tDS * polymer_price_per_kg

        kpis["polymer_cost_per_day"] = polymer_cost_per_day
        kpis["polymer_cost_per_month"] = polymer_cost_per_month
        kpis["polymer_cost_per_year"] = polymer_cost_per_year
        kpis["polymer_cost_per_tDS"] = polymer_cost_per_tDS
    else:
        kpis["polymer_cost_per_day"] = None
        kpis["polymer_cost_per_month"] = None
        kpis["polymer_cost_per_year"] = None
        kpis["polymer_cost_per_tDS"] = None

    # -------------------------------------------------------------------------
    # 6. Energy Metrics
    # -------------------------------------------------------------------------
    kpis["pump_power_kW"] = pump_power_kW
    energy_kwh_per_day = pump_power_kW * operating_hours_per_day
    energy_kwh_per_month = energy_kwh_per_day * 30
    kpis["energy_kwh_per_month"] = energy_kwh_per_month

    if electricity_price_per_kwh is not None and electricity_price_per_kwh > 0:
        energy_cost_per_day = energy_kwh_per_day * electricity_price_per_kwh
        energy_cost_per_month = energy_cost_per_day * 30
        energy_cost_per_year = energy_cost_per_day * 365
        
        kpis["energy_cost_per_day"] = energy_cost_per_day
        kpis["energy_cost_per_month"] = energy_cost_per_month
        kpis["energy_cost_per_year"] = energy_cost_per_year
    else:
        kpis["energy_cost_per_day"] = None
        kpis["energy_cost_per_month"] = None
        kpis["energy_cost_per_year"] = None

    return kpis


def format_kpis_for_display(kpis: Dict[str, Any]) -> Dict[str, str]:
    """
    Format KPIs for user-friendly display.

    Args:
        kpis: Raw KPI dictionary from compute_kpis().

    Returns:
        Dictionary with formatted string values.
    """
    formatted = {}

    # Polymer metrics
    formatted["polymer_dose_ppm"] = f"{kpis.get('polymer_dose_ppm', 0):.1f} ppm"
    formatted["polymer_kg_per_tDS"] = f"{kpis.get('polymer_kg_per_tDS', 0):.2f} kg/tDS"
    formatted["polymer_kg_per_day"] = f"{kpis.get('polymer_kg_per_day', 0):,.1f} kg/day"
    formatted["polymer_kg_per_month"] = f"{kpis.get('polymer_kg_per_month', 0):,.0f} kg/month"

    # Cake metrics
    formatted["cake_dryness_percent"] = f"{kpis.get('cake_dryness_percent', 0):.1f}%"
    formatted["cake_wet_tons_per_day"] = f"{kpis.get('cake_wet_tons_per_day', 0):.1f} t/day"
    formatted["cake_tDS_per_day"] = f"{kpis.get('cake_tDS_per_day', 0):.2f} tDS/day"

    # Liquid metrics
    formatted["liquid_flow_m3_h"] = f"{kpis.get('liquid_flow_m3_h', 0):.1f} m³/h"
    formatted["liquid_tss_estimate_mg_L"] = f"{kpis.get('liquid_tss_estimate_mg_L', 0):.0f} mg/L"

    # Mass balance
    formatted["mass_balance_closure_percent"] = f"{kpis.get('mass_balance_closure_percent', 0):.1f}%"
    formatted["solids_capture_actual_percent"] = f"{kpis.get('solids_capture_actual_percent', 0):.1f}%"

    # Cost metrics
    cost_per_day = kpis.get("polymer_cost_per_day")
    cost_per_month = kpis.get("polymer_cost_per_month")

    if cost_per_day is not None:
        formatted["polymer_cost_per_day"] = f"${cost_per_day:,.2f}/day"
        formatted["polymer_cost_per_month"] = f"${cost_per_month:,.2f}/month"
    else:
        formatted["polymer_cost_per_day"] = "N/A (no price set)"
        formatted["polymer_cost_per_month"] = "N/A (no price set)"

    # Energy metrics
    formatted["pump_power_kW"] = f"{kpis.get('pump_power_kW', 0):.1f} kW"
    formatted["energy_kwh_per_month"] = f"{kpis.get('energy_kwh_per_month', 0):,.0f} kWh/month"

    energy_cost_day = kpis.get("energy_cost_per_day")
    energy_cost_month = kpis.get("energy_cost_per_month")

    if energy_cost_day is not None:
        formatted["energy_cost_per_day"] = f"${energy_cost_day:,.2f}/day"
        formatted["energy_cost_per_month"] = f"${energy_cost_month:,.2f}/month"
    else:
        formatted["energy_cost_per_day"] = "N/A (no price set)"
        formatted["energy_cost_per_month"] = "N/A (no price set)"

    return formatted


def generate_kpi_warnings(kpis: Dict[str, Any]) -> list[str]:
    """
    Generate warnings based on KPI values.

    Args:
        kpis: KPI dictionary from compute_kpis().

    Returns:
        List of warning messages.
    """
    warnings = []

    # Mass balance warning
    closure = kpis.get("mass_balance_closure_percent", 100)
    if abs(closure - 100) > 1:
        warnings.append(
            f"Mass balance not closed: {closure:.1f}% (should be ~100%)"
        )

    # Liquid TSS warning
    liquid_tss = kpis.get("liquid_tss_estimate_mg_L", 0)
    if liquid_tss > 500:
        warnings.append(
            f"High liquid TSS ({liquid_tss:.0f} mg/L) may require additional treatment"
        )

    # Capture rate warning
    capture = kpis.get("solids_capture_actual_percent", 100)
    if capture < 90:
        warnings.append(
            f"Low solids capture ({capture:.1f}%) - check dewatering performance"
        )

    return warnings
