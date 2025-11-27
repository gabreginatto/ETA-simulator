"""
Jar test data models for polymer dosing optimization.

Jar tests are laboratory procedures used to determine the optimum
polymer dose for sludge conditioning before dewatering.
"""
from datetime import date as DateType, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class JarTestDose(BaseModel):
    """Individual dose point in a jar test."""

    dose_ppm: float = Field(..., ge=0, description="Polymer dose in ppm")
    supernatant_tss_mg_L: Optional[float] = Field(
        None, ge=0, description="Supernatant TSS in mg/L"
    )
    cst_s: Optional[float] = Field(
        None, ge=0, description="Capillary suction time in seconds"
    )
    floc_score: Optional[int] = Field(
        None, ge=1, le=5, description="Visual floc score (1-5 scale)"
    )

    model_config = {"json_schema_extra": {"example": {"dose_ppm": 15.0, "cst_s": 12.5, "floc_score": 4}}}


class JarTestSample(BaseModel):
    """Information about the sludge sample tested."""

    source: str = Field(..., min_length=1, description="Sample source (e.g., 'Primary sludge')")
    initial_ts_percent: float = Field(
        ..., gt=0, le=100, description="Initial total solids percentage"
    )

    model_config = {"json_schema_extra": {"example": {"source": "Primary sludge", "initial_ts_percent": 3.2}}}


class JarTestPolymer(BaseModel):
    """Information about the polymer tested."""

    name: str = Field(..., min_length=1, description="Polymer product name")
    type: str = Field(
        ...,
        description="Polymer type: 'cationic', 'anionic', or 'nonionic'"
    )

    @field_validator("type")
    @classmethod
    def validate_polymer_type(cls, v: str) -> str:
        valid_types = ["cationic", "anionic", "nonionic"]
        if v.lower() not in valid_types:
            raise ValueError(f"Polymer type must be one of: {valid_types}")
        return v.lower()

    model_config = {"json_schema_extra": {"example": {"name": "PAM-855", "type": "cationic"}}}


class JarTestAnalysis(BaseModel):
    """Analysis results from the jar test."""

    optimum_dose_ppm: float = Field(..., ge=0, description="Determined optimum dose in ppm")
    acceptable_range_min_ppm: Optional[float] = Field(
        None, ge=0, description="Lower bound of acceptable dose range"
    )
    acceptable_range_max_ppm: Optional[float] = Field(
        None, ge=0, description="Upper bound of acceptable dose range"
    )

    @field_validator("acceptable_range_max_ppm")
    @classmethod
    def validate_range(cls, v: Optional[float], info) -> Optional[float]:
        if v is not None:
            min_val = info.data.get("acceptable_range_min_ppm")
            if min_val is not None and v < min_val:
                raise ValueError("Max range must be >= min range")
        return v

    model_config = {"json_schema_extra": {"example": {"optimum_dose_ppm": 15.0, "acceptable_range_min_ppm": 12.0, "acceptable_range_max_ppm": 18.0}}}


class JarTest(BaseModel):
    """Complete jar test record."""

    id: str = Field(..., description="Unique identifier (e.g., 'JT-2024-001')")
    date: DateType = Field(..., description="Date the jar test was performed")
    sample: JarTestSample
    polymer: JarTestPolymer
    doses: List[JarTestDose] = Field(..., min_length=1, description="List of dose points tested")
    analysis: JarTestAnalysis
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def is_dose_in_range(self, dose_ppm: float) -> bool:
        """Check if a dose is within the acceptable range."""
        min_val = self.analysis.acceptable_range_min_ppm
        max_val = self.analysis.acceptable_range_max_ppm

        if min_val is not None and dose_ppm < min_val:
            return False
        if max_val is not None and dose_ppm > max_val:
            return False
        return True

    def get_display_name(self) -> str:
        """Get a display-friendly name for the jar test."""
        return f"{self.polymer.name} ({self.analysis.optimum_dose_ppm:.0f} ppm)"

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "JT-2024-001",
                "date": "2024-01-15",
                "sample": {"source": "Primary sludge", "initial_ts_percent": 3.2},
                "polymer": {"name": "PAM-855", "type": "cationic"},
                "doses": [
                    {"dose_ppm": 10.0, "cst_s": 18.0, "floc_score": 2},
                    {"dose_ppm": 15.0, "cst_s": 12.0, "floc_score": 4},
                    {"dose_ppm": 20.0, "cst_s": 13.5, "floc_score": 4},
                ],
                "analysis": {
                    "optimum_dose_ppm": 15.0,
                    "acceptable_range_min_ppm": 12.0,
                    "acceptable_range_max_ppm": 18.0,
                },
                "notes": "Good floc formation at 15 ppm",
            }
        }
    }


class JarTestCreate(BaseModel):
    """Schema for creating a new jar test."""

    date: DateType
    sample: JarTestSample
    polymer: JarTestPolymer
    doses: List[JarTestDose] = Field(..., min_length=1)
    analysis: JarTestAnalysis
    notes: Optional[str] = None


class JarTestUpdate(BaseModel):
    """Schema for updating a jar test."""

    date: Optional[DateType] = None
    sample: Optional[JarTestSample] = None
    polymer: Optional[JarTestPolymer] = None
    doses: Optional[List[JarTestDose]] = None
    analysis: Optional[JarTestAnalysis] = None
    notes: Optional[str] = None
