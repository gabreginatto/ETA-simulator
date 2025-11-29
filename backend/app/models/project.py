"""
Project model for saving plant configurations.

A Project represents a saved plant configuration that can be
loaded and modified for repeated simulations.
"""
from datetime import datetime
from typing import Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
import uuid


# Plant profile type
PlantProfileType = Literal["wastewater", "drinking_water"]


class FeedSourceParams(BaseModel):
    """Feed source parameters."""

    flow_m3_h: float = Field(..., gt=0, description="Volumetric flow in m³/h")
    ts_percent: float = Field(..., gt=0, le=100, description="Total solids percentage")
    temperature_C: float = Field(default=20.0, description="Temperature in °C")


class PolymerConditionerParams(BaseModel):
    """Polymer conditioner parameters."""

    jar_test_optimum_ppm: float = Field(..., ge=0, description="Jar test optimum dose in ppm")
    shear_factor: float = Field(default=1.2, gt=0, description="Equipment shear factor")
    safety_factor: float = Field(default=1.1, gt=0, description="Safety margin factor")


class DewateringUnitParams(BaseModel):
    """Dewatering unit parameters."""

    max_flow_m3_h: float = Field(default=100.0, gt=0, description="Maximum flow capacity")
    capture_rate: float = Field(default=0.95, gt=0, le=1, description="Solids capture rate")
    cake_dryness_percent: float = Field(default=23.0, gt=0, le=100, description="Target cake dryness")
    polymer_split_cake: float = Field(default=0.3, ge=0, le=1, description="Polymer fraction to cake")


class PumpParams(BaseModel):
    """Transfer pump parameters."""

    head_m: float = Field(default=20.0, gt=0, description="Pump head in meters")
    efficiency_pump: float = Field(default=0.7, gt=0, le=1, description="Pump hydraulic efficiency")
    efficiency_motor: float = Field(default=0.9, gt=0, le=1, description="Motor efficiency")


class PlantSettings(BaseModel):
    """Plant operating settings including TCO parameters."""

    # Plant profile - determines available node types and default settings
    plant_profile: PlantProfileType = Field(
        default="wastewater",
        description="Plant profile: wastewater (sludge dewatering) or drinking_water (WTP)"
    )

    # Existing fields
    polymer_price_per_kg: Optional[float] = Field(None, ge=0, description="Polymer cost per kg")
    electricity_price_per_kwh: Optional[float] = Field(None, ge=0, description="Electricity cost per kWh")
    operating_hours_per_day: float = Field(default=24.0, gt=0, le=24, description="Operating hours")
    currency: str = Field(default="BRL", description="Currency for cost display")

    # Coagulant settings
    coagulant_price_per_kg: Optional[float] = Field(None, ge=0, description="Coagulant cost per kg")
    coagulant_dose_mg_L: Optional[float] = Field(None, ge=0, description="Coagulant dose in mg/L")

    # Filtration settings
    filter_runtime_hours_to_clog: Optional[float] = Field(None, gt=0, description="Filter runtime until clogging (hours)")
    filter_flow_m3_h: Optional[float] = Field(None, gt=0, description="Flow per filter (m³/h)")
    filters_in_parallel: Optional[int] = Field(None, ge=1, description="Number of filters in parallel")
    backwash_volume_m3: Optional[float] = Field(None, gt=0, description="Backwash volume per cycle (m³)")
    backwash_time_hours: Optional[float] = Field(None, ge=0, description="Backwash duration (hours)")
    water_cost_per_m3: Optional[float] = Field(None, ge=0, description="Water cost per m³")
    product_price_per_m3: Optional[float] = Field(None, ge=0, description="Product selling price per m³")

    # Sludge disposal settings
    disposal_cost_per_ton_wet: Optional[float] = Field(None, ge=0, description="Sludge disposal cost per wet ton")

    # Logistics settings
    storage_cost_per_kg: Optional[float] = Field(None, ge=0, description="Chemical storage cost per kg")
    handling_cost_per_kg: Optional[float] = Field(None, ge=0, description="Chemical handling cost per kg")


class PlantConfiguration(BaseModel):
    """Complete plant configuration."""

    feed_source: Dict[str, Any] = Field(..., description="Feed source configuration")
    transfer_pump: Optional[Dict[str, Any]] = Field(None, description="Transfer pump configuration")
    polymer_conditioner: Dict[str, Any] = Field(..., description="Polymer conditioner configuration")
    dewatering_unit: Dict[str, Any] = Field(..., description="Dewatering unit configuration")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Plant settings")

    @classmethod
    def from_params(
        cls,
        feed: FeedSourceParams,
        polymer: PolymerConditionerParams,
        dewatering: DewateringUnitParams,
        pump: Optional[PumpParams] = None,
        settings: Optional[PlantSettings] = None,
    ) -> "PlantConfiguration":
        """Create configuration from parameter objects."""
        return cls(
            feed_source={"parameters": feed.model_dump()},
            transfer_pump={"parameters": pump.model_dump()} if pump else None,
            polymer_conditioner={"parameters": polymer.model_dump()},
            dewatering_unit={"parameters": dewatering.model_dump()},
            settings=settings.model_dump() if settings else {},
        )

    def to_solver_format(self) -> Dict[str, Any]:
        """Convert to format expected by solve_plant."""
        return {
            "feed_source": self.feed_source,
            "transfer_pump": self.transfer_pump,
            "polymer_conditioner": self.polymer_conditioner,
            "dewatering_unit": self.dewatering_unit,
            "settings": self.settings,
        }


class Project(BaseModel):
    """Project model for saving plant configurations."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique project ID")
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    plant_configuration: PlantConfiguration
    jar_test_id: Optional[str] = Field(None, description="Linked jar test ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Sabesp Demo Plant",
                "description": "Demo configuration for Sabesp presentation",
                "plant_configuration": {
                    "feed_source": {
                        "parameters": {
                            "flow_m3_h": 100.0,
                            "ts_percent": 2.8,
                            "temperature_C": 20.0,
                        }
                    },
                    "polymer_conditioner": {
                        "parameters": {
                            "jar_test_optimum_ppm": 15.0,
                            "shear_factor": 1.2,
                            "safety_factor": 1.1,
                        }
                    },
                    "dewatering_unit": {
                        "parameters": {
                            "max_flow_m3_h": 150.0,
                            "capture_rate": 0.95,
                            "cake_dryness_percent": 23.0,
                            "polymer_split_cake": 0.3,
                        }
                    },
                    "settings": {
                        "polymer_price_per_kg": 5.0,
                        "operating_hours_per_day": 24.0,
                        "currency": "USD",
                    },
                },
                "jar_test_id": "JT-2024-001",
            }
        }
    }


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    plant_configuration: PlantConfiguration
    jar_test_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    plant_configuration: Optional[PlantConfiguration] = None
    jar_test_id: Optional[str] = None


def get_default_plant_configuration() -> PlantConfiguration:
    """Get a default plant configuration for new projects."""
    return PlantConfiguration(
        feed_source={
            "parameters": {
                "flow_m3_h": 100.0,
                "ts_percent": 3.0,
                "temperature_C": 20.0,
            }
        },
        polymer_conditioner={
            "parameters": {
                "jar_test_optimum_ppm": 15.0,
                "shear_factor": 1.2,
                "safety_factor": 1.1,
            }
        },
        dewatering_unit={
            "parameters": {
                "max_flow_m3_h": 150.0,
                "capture_rate": 0.95,
                "cake_dryness_percent": 23.0,
                "polymer_split_cake": 0.3,
            }
        },
        transfer_pump={
            "parameters": {
                "head_m": 20.0,
                "efficiency_pump": 0.7,
                "efficiency_motor": 0.9,
            }
        },
        settings={
            "plant_profile": "wastewater",
            "polymer_price_per_kg": None,
            "electricity_price_per_kwh": None,
            "operating_hours_per_day": 24.0,
            "currency": "BRL",
            # TCO defaults
            "water_cost_per_m3": 2.0,
            "disposal_cost_per_ton_wet": 100.0,
            "storage_cost_per_kg": 0.5,
            "handling_cost_per_kg": 0.2,
        },
    )
