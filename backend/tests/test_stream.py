"""
Unit tests for Stream model.
"""
import pytest
from app.models.stream import Stream


class TestStream:
    """Test cases for Stream dataclass."""

    def test_stream_initialization(self):
        """Test basic stream initialization with valid values."""
        stream = Stream(
            id="test_stream",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
            polymer_mass_flow_kg_h=2.0,
            temperature_C=25.0,
        )

        assert stream.id == "test_stream"
        assert stream.mass_flow_kg_h == 100000.0
        assert stream.dry_solids_mass_flow_kg_h == 3000.0
        assert stream.polymer_mass_flow_kg_h == 2.0
        assert stream.temperature_C == 25.0

    def test_default_values(self):
        """Test default values for optional fields."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=1000.0,
            dry_solids_mass_flow_kg_h=30.0,
        )

        assert stream.polymer_mass_flow_kg_h == 0.0
        assert stream.temperature_C == 20.0

    def test_dry_solids_fraction(self):
        """Test dry solids fraction calculation."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        assert stream.dry_solids_fraction == pytest.approx(0.03, rel=1e-6)

    def test_dry_solids_percent(self):
        """Test dry solids percentage calculation."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        assert stream.dry_solids_percent == pytest.approx(3.0, rel=1e-6)

    def test_dry_solids_fraction_zero_flow(self):
        """Test dry solids fraction with zero mass flow."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=0.0,
            dry_solids_mass_flow_kg_h=0.0,
        )

        assert stream.dry_solids_fraction == 0.0

    def test_density_calculation(self):
        """Test density calculation."""
        # 3% solids should give density of 1000 + 300*0.03 = 1009 kg/m³
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        assert stream.density_kg_m3 == pytest.approx(1009.0, rel=1e-6)

    def test_volumetric_flow(self):
        """Test volumetric flow calculation."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        # 100000 kg/h / 1009 kg/m³ ≈ 99.11 m³/h
        expected_vol_flow = 100000.0 / 1009.0
        assert stream.volumetric_flow_m3_h == pytest.approx(expected_vol_flow, rel=1e-4)

    def test_polymer_dose_ppm(self):
        """Test polymer dose calculation in ppm."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
            polymer_mass_flow_kg_h=2.0,
        )

        # ppm = (2.0 * 1e6) / (vol_flow * 1000)
        vol_flow = stream.volumetric_flow_m3_h
        expected_ppm = (2.0 * 1e6) / (vol_flow * 1000.0)
        assert stream.polymer_dose_ppm == pytest.approx(expected_ppm, rel=1e-4)

    def test_polymer_dose_zero_polymer(self):
        """Test polymer dose with no polymer."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        assert stream.polymer_dose_ppm == 0.0

    def test_water_mass_flow(self):
        """Test water mass flow calculation."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        assert stream.water_mass_flow_kg_h == pytest.approx(97000.0, rel=1e-6)

    def test_to_dict(self):
        """Test serialization to dictionary."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
            polymer_mass_flow_kg_h=2.0,
            temperature_C=25.0,
        )

        data = stream.to_dict()

        assert data["id"] == "test"
        assert data["mass_flow_kg_h"] == 100000.0
        assert data["dry_solids_mass_flow_kg_h"] == 3000.0
        assert data["polymer_mass_flow_kg_h"] == 2.0
        assert data["temperature_C"] == 25.0
        assert "dry_solids_fraction" in data
        assert "density_kg_m3" in data
        assert "volumetric_flow_m3_h" in data
        assert "polymer_dose_ppm" in data

    def test_from_dict(self):
        """Test deserialization from dictionary."""
        data = {
            "id": "test",
            "mass_flow_kg_h": 100000.0,
            "dry_solids_mass_flow_kg_h": 3000.0,
            "polymer_mass_flow_kg_h": 2.0,
            "temperature_C": 25.0,
        }

        stream = Stream.from_dict(data)

        assert stream.id == "test"
        assert stream.mass_flow_kg_h == 100000.0
        assert stream.dry_solids_mass_flow_kg_h == 3000.0
        assert stream.polymer_mass_flow_kg_h == 2.0
        assert stream.temperature_C == 25.0

    def test_from_dict_defaults(self):
        """Test deserialization with default values."""
        data = {
            "id": "test",
            "mass_flow_kg_h": 1000.0,
            "dry_solids_mass_flow_kg_h": 30.0,
        }

        stream = Stream.from_dict(data)

        assert stream.polymer_mass_flow_kg_h == 0.0
        assert stream.temperature_C == 20.0

    def test_round_trip_serialization(self):
        """Test that to_dict/from_dict roundtrip preserves data."""
        original = Stream(
            id="roundtrip",
            mass_flow_kg_h=50000.0,
            dry_solids_mass_flow_kg_h=2500.0,
            polymer_mass_flow_kg_h=1.5,
            temperature_C=22.0,
        )

        data = original.to_dict()
        restored = Stream.from_dict(data)

        assert restored.id == original.id
        assert restored.mass_flow_kg_h == original.mass_flow_kg_h
        assert restored.dry_solids_mass_flow_kg_h == original.dry_solids_mass_flow_kg_h
        assert restored.polymer_mass_flow_kg_h == original.polymer_mass_flow_kg_h
        assert restored.temperature_C == original.temperature_C

    def test_repr(self):
        """Test string representation."""
        stream = Stream(
            id="test",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
            polymer_mass_flow_kg_h=2.0,
        )

        repr_str = repr(stream)
        assert "test" in repr_str
        assert "100000" in repr_str
        assert "3.00%" in repr_str
