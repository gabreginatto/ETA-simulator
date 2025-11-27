"""
Stream dataclass for representing sludge/water streams.

A Stream represents a flow of material (sludge, water, cake, etc.) in the
dewatering process. It contains mass flow rates and calculated properties
for process simulation.

Example:
    >>> stream = Stream(
    ...     id="feed_1",
    ...     mass_flow_kg_h=100000.0,
    ...     dry_solids_mass_flow_kg_h=3000.0,
    ...     polymer_mass_flow_kg_h=0.0,
    ...     temperature_C=20.0
    ... )
    >>> stream.dry_solids_fraction
    0.03
    >>> stream.volumetric_flow_m3_h
    97.09...
"""
from dataclasses import dataclass, field
from typing import Dict, Any, Optional


@dataclass
class Stream:
    """
    Represents a process stream with mass flows and calculated properties.

    Attributes:
        id: Unique identifier for the stream (e.g., "feed_1", "cake_1")
        mass_flow_kg_h: Total mass flow rate in kg/h
        dry_solids_mass_flow_kg_h: Mass flow rate of dry solids in kg/h
        polymer_mass_flow_kg_h: Mass flow rate of active polymer in kg/h
        temperature_C: Temperature in degrees Celsius
    """
    id: str
    mass_flow_kg_h: float
    dry_solids_mass_flow_kg_h: float
    polymer_mass_flow_kg_h: float = 0.0
    temperature_C: float = 20.0

    @property
    def dry_solids_fraction(self) -> float:
        """
        Calculate the dry solids fraction (mass fraction).

        Returns:
            Fraction of dry solids (0.0 to 1.0), or 0.0 if mass_flow is zero.

        Example:
            >>> stream = Stream("test", 1000.0, 30.0)
            >>> stream.dry_solids_fraction
            0.03
        """
        if self.mass_flow_kg_h <= 0:
            return 0.0
        return self.dry_solids_mass_flow_kg_h / self.mass_flow_kg_h

    @property
    def dry_solids_percent(self) -> float:
        """
        Calculate the dry solids percentage.

        Returns:
            Percentage of dry solids (0.0 to 100.0).
        """
        return self.dry_solids_fraction * 100.0

    @property
    def density_kg_m3(self) -> float:
        """
        Calculate approximate density based on solids content.

        Uses a simple linear approximation:
        density = 1000 + 300 * dry_solids_fraction

        This approximation assumes:
        - Pure water density: 1000 kg/m³
        - Maximum sludge density increase: ~300 kg/m³ at 100% solids

        Returns:
            Estimated density in kg/m³.
        """
        return 1000.0 + 300.0 * self.dry_solids_fraction

    @property
    def volumetric_flow_m3_h(self) -> float:
        """
        Calculate volumetric flow rate from mass flow and density.

        Returns:
            Volumetric flow rate in m³/h.
        """
        if self.density_kg_m3 <= 0:
            return 0.0
        return self.mass_flow_kg_h / self.density_kg_m3

    @property
    def polymer_dose_ppm(self) -> float:
        """
        Calculate polymer concentration in parts per million (ppm).

        Approximates mg/L based on:
        ppm = (polymer_kg_h * 1e6) / (volumetric_flow_m3_h * 1000)

        Returns:
            Polymer concentration in ppm (approximately mg/L).
        """
        vol_flow = self.volumetric_flow_m3_h
        if vol_flow <= 0:
            return 0.0
        # Convert kg/h to mg/h, divide by volume in liters
        return (self.polymer_mass_flow_kg_h * 1e6) / (vol_flow * 1000.0)

    @property
    def water_mass_flow_kg_h(self) -> float:
        """
        Calculate water mass flow rate.

        Returns:
            Water mass flow in kg/h.
        """
        return self.mass_flow_kg_h - self.dry_solids_mass_flow_kg_h

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize the stream to a dictionary for JSON conversion.

        Returns:
            Dictionary containing all stream properties.
        """
        return {
            "id": self.id,
            "mass_flow_kg_h": self.mass_flow_kg_h,
            "dry_solids_mass_flow_kg_h": self.dry_solids_mass_flow_kg_h,
            "polymer_mass_flow_kg_h": self.polymer_mass_flow_kg_h,
            "temperature_C": self.temperature_C,
            # Computed properties
            "dry_solids_fraction": self.dry_solids_fraction,
            "dry_solids_percent": self.dry_solids_percent,
            "density_kg_m3": self.density_kg_m3,
            "volumetric_flow_m3_h": self.volumetric_flow_m3_h,
            "polymer_dose_ppm": self.polymer_dose_ppm,
            "water_mass_flow_kg_h": self.water_mass_flow_kg_h,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Stream":
        """
        Create a Stream instance from a dictionary.

        Args:
            data: Dictionary containing stream data. Must include:
                  id, mass_flow_kg_h, dry_solids_mass_flow_kg_h.
                  Optional: polymer_mass_flow_kg_h, temperature_C.

        Returns:
            A new Stream instance.

        Example:
            >>> data = {"id": "feed", "mass_flow_kg_h": 1000, "dry_solids_mass_flow_kg_h": 30}
            >>> stream = Stream.from_dict(data)
            >>> stream.id
            'feed'
        """
        return cls(
            id=data["id"],
            mass_flow_kg_h=data["mass_flow_kg_h"],
            dry_solids_mass_flow_kg_h=data["dry_solids_mass_flow_kg_h"],
            polymer_mass_flow_kg_h=data.get("polymer_mass_flow_kg_h", 0.0),
            temperature_C=data.get("temperature_C", 20.0),
        )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"Stream(id='{self.id}', "
            f"flow={self.mass_flow_kg_h:.1f} kg/h, "
            f"DS={self.dry_solids_percent:.2f}%, "
            f"polymer={self.polymer_dose_ppm:.1f} ppm)"
        )
