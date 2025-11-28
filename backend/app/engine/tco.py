"""
TCO (Total Cost of Ownership) Calculator Module.

Calculates operating costs across four pillars:
1. Chemicals - Polymer and coagulant costs
2. Filtration - Water loss and opportunity costs from filter backwashing
3. Sludge - Disposal costs for wet sludge cake
4. Logistics - Storage and handling costs for chemicals

Provides both unitary costs (per 1000 m³) for benchmarking and
total plant costs (per day/month/year) for operational budgeting.
"""
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass

from app.models.stream import Stream


@dataclass
class TCOBreakdown:
    """Breakdown of TCO by pillar."""
    chemicals: float = 0.0
    filtration: float = 0.0
    sludge: float = 0.0
    logistics: float = 0.0

    @property
    def total(self) -> float:
        """Total cost across all pillars."""
        return self.chemicals + self.filtration + self.sludge + self.logistics

    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary."""
        return {
            "chemicals": self.chemicals,
            "filtration": self.filtration,
            "sludge": self.sludge,
            "logistics": self.logistics,
            "total": self.total,
        }

    def scale(self, factor: float) -> "TCOBreakdown":
        """Return a new breakdown scaled by factor."""
        return TCOBreakdown(
            chemicals=self.chemicals * factor,
            filtration=self.filtration * factor,
            sludge=self.sludge * factor,
            logistics=self.logistics * factor,
        )


def _get_treated_m3_per_h(feed: Stream) -> float:
    """Get volumetric flow rate of treated water in m³/h."""
    return feed.volumetric_flow_m3_h


def _calculate_chemicals_cost_per_1000m3(
    settings: Dict[str, Any],
    conditioned: Stream,
    treated_m3_h: float,
) -> Tuple[float, List[str]]:
    """
    Calculate chemicals cost per 1000 m³ treated.

    Includes polymer and optional coagulant costs.
    Formula: dose_mg_L * 1e-3 (kg/m³) * 1000 m³ * price_per_kg

    Returns:
        Tuple of (cost per 1000 m³, warnings list)
    """
    warnings = []
    cost = 0.0

    # Polymer cost
    polymer_price = settings.get("polymer_price_per_kg")
    if polymer_price is not None and polymer_price > 0:
        polymer_dose_ppm = conditioned.polymer_dose_ppm
        # ppm ≈ mg/L, so mg/L * 1e-3 = kg/m³
        polymer_kg_per_1000m3 = polymer_dose_ppm * 1e-3 * 1000
        cost += polymer_kg_per_1000m3 * polymer_price
    else:
        warnings.append("Polymer cost not calculated: polymer_price_per_kg not set")

    # Coagulant cost
    coagulant_price = settings.get("coagulant_price_per_kg")
    coagulant_dose = settings.get("coagulant_dose_mg_L")
    if coagulant_price is not None and coagulant_dose is not None:
        if coagulant_price > 0 and coagulant_dose > 0:
            coagulant_kg_per_1000m3 = coagulant_dose * 1e-3 * 1000
            cost += coagulant_kg_per_1000m3 * coagulant_price

    return cost, warnings


def _calculate_filtration_cost_per_1000m3(
    settings: Dict[str, Any],
    treated_m3_h: float,
) -> Tuple[float, List[str]]:
    """
    Calculate filtration cost per 1000 m³ treated.

    Includes:
    - Water loss cost from backwashing
    - Opportunity cost from production loss during backwash

    Returns:
        Tuple of (cost per 1000 m³, warnings list)
    """
    warnings = []

    # Required filtration parameters
    runtime_h = settings.get("filter_runtime_hours_to_clog")
    flow_per_filter = settings.get("filter_flow_m3_h")
    filters_in_parallel = settings.get("filters_in_parallel")
    backwash_volume = settings.get("backwash_volume_m3")
    backwash_time = settings.get("backwash_time_hours", 0)
    water_cost = settings.get("water_cost_per_m3")
    product_price = settings.get("product_price_per_m3")

    # Check for required parameters
    missing_params = []
    if runtime_h is None:
        missing_params.append("filter_runtime_hours_to_clog")
    if flow_per_filter is None:
        missing_params.append("filter_flow_m3_h")
    if filters_in_parallel is None:
        missing_params.append("filters_in_parallel")
    if backwash_volume is None:
        missing_params.append("backwash_volume_m3")
    if water_cost is None:
        missing_params.append("water_cost_per_m3")

    if missing_params:
        warnings.append(f"Filtration cost not calculated: missing {', '.join(missing_params)}")
        return 0.0, warnings

    # Calculate number of washes per 1000 m³ treated
    # Total filter capacity per cycle = runtime_h * flow_per_filter * filters_in_parallel
    filter_capacity_per_cycle = runtime_h * flow_per_filter * filters_in_parallel
    if filter_capacity_per_cycle <= 0:
        warnings.append("Filtration cost not calculated: invalid filter parameters")
        return 0.0, warnings

    washes_per_1000m3 = 1000 / filter_capacity_per_cycle

    # Water loss cost
    water_loss_cost = washes_per_1000m3 * backwash_volume * water_cost

    # Opportunity cost (production loss during backwash)
    opportunity_cost = 0.0
    if backwash_time > 0 and product_price is not None:
        # Revenue lost = time * flow * (product_price - water_cost)
        # We lose production from one filter at a time during backwash
        margin_per_m3 = product_price - water_cost
        if margin_per_m3 > 0:
            opportunity_cost = washes_per_1000m3 * backwash_time * flow_per_filter * margin_per_m3

    total_cost = water_loss_cost + opportunity_cost
    return total_cost, warnings


def _calculate_sludge_cost_per_1000m3(
    cake: Stream,
    settings: Dict[str, Any],
    treated_m3_h: float,
) -> Tuple[float, List[str]]:
    """
    Calculate sludge disposal cost per 1000 m³ treated.

    Based on wet cake mass and disposal cost per wet ton.

    Returns:
        Tuple of (cost per 1000 m³, warnings list)
    """
    warnings = []

    disposal_cost = settings.get("disposal_cost_per_ton_wet")
    if disposal_cost is None:
        warnings.append("Sludge cost not calculated: disposal_cost_per_ton_wet not set")
        return 0.0, warnings

    if treated_m3_h <= 0:
        return 0.0, warnings

    # Cake mass flow in kg/h -> wet tons per hour
    cake_mass_kg_h = cake.mass_flow_kg_h
    wet_tons_per_h = cake_mass_kg_h / 1000  # kg to tons

    # Wet tons per 1000 m³ = (wet_tons_per_h / treated_m3_h) * 1000
    wet_tons_per_1000m3 = (wet_tons_per_h / treated_m3_h) * 1000

    cost = wet_tons_per_1000m3 * disposal_cost
    return cost, warnings


def _calculate_logistics_cost_per_1000m3(
    settings: Dict[str, Any],
    conditioned: Stream,
    treated_m3_h: float,
) -> Tuple[float, List[str]]:
    """
    Calculate logistics cost per 1000 m³ treated.

    Based on storage and handling costs for chemicals (polymer + coagulant).

    Returns:
        Tuple of (cost per 1000 m³, warnings list)
    """
    warnings = []

    storage_cost = settings.get("storage_cost_per_kg")
    handling_cost = settings.get("handling_cost_per_kg")

    if storage_cost is None and handling_cost is None:
        warnings.append("Logistics cost not calculated: storage_cost_per_kg and handling_cost_per_kg not set")
        return 0.0, warnings

    storage = storage_cost or 0.0
    handling = handling_cost or 0.0
    total_logistics_per_kg = storage + handling

    if total_logistics_per_kg <= 0:
        return 0.0, warnings

    # Calculate total chemical kg per 1000 m³
    total_chemical_kg = 0.0

    # Polymer kg per 1000 m³
    polymer_dose_ppm = conditioned.polymer_dose_ppm
    polymer_kg_per_1000m3 = polymer_dose_ppm * 1e-3 * 1000
    total_chemical_kg += polymer_kg_per_1000m3

    # Coagulant kg per 1000 m³ (if used)
    coagulant_dose = settings.get("coagulant_dose_mg_L")
    if coagulant_dose is not None and coagulant_dose > 0:
        coagulant_kg_per_1000m3 = coagulant_dose * 1e-3 * 1000
        total_chemical_kg += coagulant_kg_per_1000m3

    cost = total_chemical_kg * total_logistics_per_kg
    return cost, warnings


def compute_tco(
    feed: Stream,
    conditioned: Stream,
    cake: Stream,
    liquid: Stream,
    settings: Dict[str, Any],
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Compute TCO (Total Cost of Ownership) breakdown.

    Args:
        feed: Feed stream
        conditioned: Conditioned stream (after polymer addition)
        cake: Cake stream (dewatered sludge)
        liquid: Liquid stream (filtrate/centrate)
        settings: Plant settings dictionary

    Returns:
        Tuple of (tco_results dict, warnings list)

        tco_results contains:
        - per_1000m3: TCO breakdown per 1000 m³ (unitary cost for benchmarking)
        - per_day: TCO breakdown per day
        - per_month: TCO breakdown per month
        - per_year: TCO breakdown per year
    """
    settings = settings or {}
    warnings: List[str] = []

    # Get treated volume flow
    treated_m3_h = _get_treated_m3_per_h(feed)

    if treated_m3_h <= 0:
        warnings.append("TCO not calculated: no feed flow")
        empty_breakdown = TCOBreakdown().to_dict()
        return {
            "per_1000m3": empty_breakdown,
            "per_day": empty_breakdown,
            "per_month": empty_breakdown,
            "per_year": empty_breakdown,
        }, warnings

    # Calculate each pillar cost per 1000 m³
    chemicals_cost, chem_warnings = _calculate_chemicals_cost_per_1000m3(
        settings, conditioned, treated_m3_h
    )
    warnings.extend(chem_warnings)

    filtration_cost, filt_warnings = _calculate_filtration_cost_per_1000m3(
        settings, treated_m3_h
    )
    warnings.extend(filt_warnings)

    sludge_cost, sludge_warnings = _calculate_sludge_cost_per_1000m3(
        cake, settings, treated_m3_h
    )
    warnings.extend(sludge_warnings)

    logistics_cost, log_warnings = _calculate_logistics_cost_per_1000m3(
        settings, conditioned, treated_m3_h
    )
    warnings.extend(log_warnings)

    # Create unitary breakdown (per 1000 m³)
    per_1000m3 = TCOBreakdown(
        chemicals=chemicals_cost,
        filtration=filtration_cost,
        sludge=sludge_cost,
        logistics=logistics_cost,
    )

    # Scale to time periods
    operating_hours = settings.get("operating_hours_per_day", 24.0)
    daily_m3 = treated_m3_h * operating_hours

    # Factor to convert from per-1000m³ to per-day
    daily_factor = daily_m3 / 1000.0

    per_day = per_1000m3.scale(daily_factor)
    per_month = per_1000m3.scale(daily_factor * 30)
    per_year = per_1000m3.scale(daily_factor * 365)

    return {
        "per_1000m3": per_1000m3.to_dict(),
        "per_day": per_day.to_dict(),
        "per_month": per_month.to_dict(),
        "per_year": per_year.to_dict(),
    }, warnings
