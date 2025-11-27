"""
Pydantic request/response schemas for the API.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.models.jar_test import JarTestSample, JarTestPolymer, JarTestDose, JarTestAnalysis
from app.models.project import PlantConfiguration


# =============================================================================
# Request Schemas
# =============================================================================

class SimulateRequest(BaseModel):
    """Request body for POST /simulate."""

    plant_definition: Dict[str, Any] = Field(
        ..., description="Plant configuration for simulation"
    )
    jar_test_id: Optional[str] = Field(
        None, description="Optional jar test ID to use for polymer dose"
    )
    jar_test_optimum_ppm: Optional[float] = Field(
        None, ge=0, description="Optional override for jar test optimum dose"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "plant_definition": {
                    "feed_source": {
                        "parameters": {
                            "flow_m3_h": 100.0,
                            "ts_percent": 3.0,
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
                        }
                    },
                    "settings": {"polymer_price_per_kg": 5.0},
                }
            }
        }
    }


class ProjectCreate(BaseModel):
    """Request body for POST /projects."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    plant_configuration: PlantConfiguration
    jar_test_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Request body for PUT /projects/{id}."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    plant_configuration: Optional[PlantConfiguration] = None
    jar_test_id: Optional[str] = None


class JarTestCreate(BaseModel):
    """Request body for POST /jar-tests."""

    date: str = Field(..., description="Test date (YYYY-MM-DD)")
    sample: JarTestSample
    polymer: JarTestPolymer
    doses: List[JarTestDose] = Field(..., min_length=1)
    analysis: JarTestAnalysis
    notes: Optional[str] = None


# =============================================================================
# Response Schemas
# =============================================================================

class StreamResponse(BaseModel):
    """Stream data in response."""

    id: str
    mass_flow_kg_h: float
    dry_solids_mass_flow_kg_h: float
    polymer_mass_flow_kg_h: float
    temperature_C: float
    dry_solids_fraction: float
    dry_solids_percent: float
    density_kg_m3: float
    volumetric_flow_m3_h: float
    polymer_dose_ppm: float
    water_mass_flow_kg_h: float


class SimulationResponse(BaseModel):
    """Response from POST /simulate."""

    success: bool
    streams: Dict[str, StreamResponse]
    kpis: Dict[str, Any]
    warnings: List[str]
    errors: List[str]

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "streams": {
                    "feed": {
                        "id": "feed",
                        "mass_flow_kg_h": 100000.0,
                        "dry_solids_mass_flow_kg_h": 3000.0,
                        "polymer_mass_flow_kg_h": 0.0,
                        "temperature_C": 20.0,
                        "dry_solids_fraction": 0.03,
                        "dry_solids_percent": 3.0,
                        "density_kg_m3": 1009.0,
                        "volumetric_flow_m3_h": 99.11,
                        "polymer_dose_ppm": 0.0,
                        "water_mass_flow_kg_h": 97000.0,
                    }
                },
                "kpis": {
                    "polymer_dose_ppm": 19.8,
                    "polymer_kg_per_tDS": 6.6,
                    "cake_dryness_percent": 23.0,
                },
                "warnings": [],
                "errors": [],
            }
        }
    }


class ProjectResponse(BaseModel):
    """Response for project data."""

    id: str
    name: str
    description: Optional[str]
    plant_configuration: PlantConfiguration
    jar_test_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    """Response for GET /projects (list)."""

    items: List[ProjectResponse]
    total: int


class JarTestResponse(BaseModel):
    """Response for jar test data."""

    id: str
    date: str
    sample: JarTestSample
    polymer: JarTestPolymer
    doses: List[JarTestDose]
    analysis: JarTestAnalysis
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class JarTestListResponse(BaseModel):
    """Response for GET /jar-tests (list)."""

    items: List[JarTestResponse]
    total: int


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    errors: Optional[List[str]] = None
    code: Optional[str] = None


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str
