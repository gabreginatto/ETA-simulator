"""
Unit tests for TCO (Total Cost of Ownership) calculations.
"""
import pytest
from app.models.stream import Stream
from app.engine.tco import compute_tco, TCOBreakdown
from app.engine.tco_validation import validate_tco_settings


class TestTCOBreakdown:
    """Tests for TCOBreakdown dataclass."""

    def test_total_calculation(self):
        """Test that total is correctly computed from pillars."""
        breakdown = TCOBreakdown(
            chemicals=100.0,
            filtration=50.0,
            sludge=30.0,
            logistics=20.0,
        )
        assert breakdown.total == 200.0

    def test_to_dict(self):
        """Test dictionary conversion."""
        breakdown = TCOBreakdown(
            chemicals=100.0,
            filtration=50.0,
            sludge=30.0,
            logistics=20.0,
        )
        result = breakdown.to_dict()
        assert result["chemicals"] == 100.0
        assert result["filtration"] == 50.0
        assert result["sludge"] == 30.0
        assert result["logistics"] == 20.0
        assert result["total"] == 200.0

    def test_scale(self):
        """Test scaling by factor."""
        breakdown = TCOBreakdown(
            chemicals=100.0,
            filtration=50.0,
            sludge=30.0,
            logistics=20.0,
        )
        scaled = breakdown.scale(2.0)
        assert scaled.chemicals == 200.0
        assert scaled.filtration == 100.0
        assert scaled.sludge == 60.0
        assert scaled.logistics == 40.0
        assert scaled.total == 400.0


class TestComputeTCO:
    """Tests for compute_tco function."""

    @pytest.fixture
    def feed_stream(self):
        """Create a sample feed stream."""
        return Stream(
            id="feed",
            mass_flow_kg_h=100000.0,  # 100 t/h
            dry_solids_mass_flow_kg_h=3000.0,  # 3% TS
            polymer_mass_flow_kg_h=0.0,
            temperature_C=20.0,
        )

    @pytest.fixture
    def conditioned_stream(self):
        """Create a sample conditioned stream with polymer."""
        stream = Stream(
            id="conditioned",
            mass_flow_kg_h=100015.0,  # Slight increase from polymer
            dry_solids_mass_flow_kg_h=3000.0,
            polymer_mass_flow_kg_h=15.0,  # ~15 ppm
            temperature_C=20.0,
        )
        return stream

    @pytest.fixture
    def cake_stream(self):
        """Create a sample cake stream."""
        return Stream(
            id="cake",
            mass_flow_kg_h=13000.0,  # ~13 t/h wet cake
            dry_solids_mass_flow_kg_h=2850.0,  # 95% capture
            polymer_mass_flow_kg_h=4.5,
            temperature_C=20.0,
        )

    @pytest.fixture
    def liquid_stream(self):
        """Create a sample liquid stream."""
        return Stream(
            id="liquid",
            mass_flow_kg_h=87015.0,
            dry_solids_mass_flow_kg_h=150.0,
            polymer_mass_flow_kg_h=10.5,
            temperature_C=20.0,
        )

    def test_chemicals_cost_calculation(
        self, feed_stream, conditioned_stream, cake_stream, liquid_stream
    ):
        """Test chemicals cost (polymer) calculation."""
        settings = {
            "polymer_price_per_kg": 5.0,
            "operating_hours_per_day": 24.0,
        }

        result, warnings = compute_tco(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Polymer dose ~15 ppm = 15 mg/L = 0.015 kg/m³
        # Per 1000 m³: 15 kg * $5 = $75
        assert result["per_1000m3"]["chemicals"] > 0
        assert "per_day" in result
        assert "per_month" in result
        assert "per_year" in result

    def test_sludge_cost_calculation(
        self, feed_stream, conditioned_stream, cake_stream, liquid_stream
    ):
        """Test sludge disposal cost calculation."""
        settings = {
            "disposal_cost_per_ton_wet": 100.0,
            "operating_hours_per_day": 24.0,
        }

        result, warnings = compute_tco(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Cake: 13000 kg/h = 13 t/h wet
        # Feed: ~97 m³/h
        # Per 1000 m³: (13/97) * 1000 * $100 = ~$13400
        assert result["per_1000m3"]["sludge"] > 0

    def test_logistics_cost_calculation(
        self, feed_stream, conditioned_stream, cake_stream, liquid_stream
    ):
        """Test logistics (storage + handling) cost calculation."""
        settings = {
            "storage_cost_per_kg": 0.5,
            "handling_cost_per_kg": 0.2,
            "operating_hours_per_day": 24.0,
        }

        result, warnings = compute_tco(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Total logistics = $0.7/kg of chemicals
        # Polymer: ~15 kg per 1000 m³
        # Cost: 15 * 0.7 = ~$10.5
        assert result["per_1000m3"]["logistics"] > 0

    def test_filtration_cost_calculation(
        self, feed_stream, conditioned_stream, cake_stream, liquid_stream
    ):
        """Test filtration cost calculation."""
        settings = {
            "filter_runtime_hours_to_clog": 24.0,
            "filter_flow_m3_h": 50.0,
            "filters_in_parallel": 4,
            "backwash_volume_m3": 10.0,
            "backwash_time_hours": 0.5,
            "water_cost_per_m3": 2.0,
            "product_price_per_m3": 5.0,
            "operating_hours_per_day": 24.0,
        }

        result, warnings = compute_tco(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Total filter capacity per cycle: 24h * 50 m³/h * 4 = 4800 m³
        # Washes per 1000 m³: 1000/4800 = ~0.21
        # Water loss: 0.21 * 10 m³ * $2 = ~$4.2
        # Opportunity cost: 0.21 * 0.5h * 50 m³/h * ($5-$2) = ~$15.6
        assert result["per_1000m3"]["filtration"] > 0

    def test_missing_parameters_warnings(
        self, feed_stream, conditioned_stream, cake_stream, liquid_stream
    ):
        """Test that missing parameters generate warnings."""
        settings = {}  # No settings provided

        result, warnings = compute_tco(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Should have warnings for missing parameters
        assert len(warnings) > 0
        assert any("polymer" in w.lower() for w in warnings)
        assert any("sludge" in w.lower() or "disposal" in w.lower() for w in warnings)
        assert any("filtration" in w.lower() for w in warnings)
        assert any("logistics" in w.lower() for w in warnings)

    def test_period_scaling(
        self, feed_stream, conditioned_stream, cake_stream, liquid_stream
    ):
        """Test that daily/monthly/yearly costs are properly scaled."""
        settings = {
            "polymer_price_per_kg": 5.0,
            "disposal_cost_per_ton_wet": 100.0,
            "operating_hours_per_day": 24.0,
        }

        result, _ = compute_tco(
            feed=feed_stream,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Get unitary cost
        unitary = result["per_1000m3"]["total"]

        # Feed is ~97 m³/h, 24h/day = ~2328 m³/day
        # Daily factor: 2328/1000 = 2.328
        daily = result["per_day"]["total"]

        # Monthly should be 30x daily
        monthly = result["per_month"]["total"]
        assert abs(monthly - daily * 30) < 0.01

        # Yearly should be 365x daily
        yearly = result["per_year"]["total"]
        assert abs(yearly - daily * 365) < 0.01

    def test_zero_feed_flow(self, conditioned_stream, cake_stream, liquid_stream):
        """Test handling of zero feed flow."""
        zero_feed = Stream(
            id="feed",
            mass_flow_kg_h=0.0,
            dry_solids_mass_flow_kg_h=0.0,
        )

        settings = {
            "polymer_price_per_kg": 5.0,
            "operating_hours_per_day": 24.0,
        }

        result, warnings = compute_tco(
            feed=zero_feed,
            conditioned=conditioned_stream,
            cake=cake_stream,
            liquid=liquid_stream,
            settings=settings,
        )

        # Should return zero costs and a warning
        assert result["per_1000m3"]["total"] == 0.0
        assert any("no feed flow" in w.lower() for w in warnings)


class TestTCOValidation:
    """Tests for TCO validation."""

    def test_valid_settings(self):
        """Test that valid settings produce no warnings."""
        settings = {
            "polymer_price_per_kg": 5.0,
            "disposal_cost_per_ton_wet": 100.0,
            "filter_runtime_hours_to_clog": 24.0,
            "filter_flow_m3_h": 50.0,
            "filters_in_parallel": 4,
            "backwash_volume_m3": 10.0,
        }

        warnings = validate_tco_settings(settings)
        assert len(warnings) == 0

    def test_negative_cost_warning(self):
        """Test warning for negative cost values."""
        settings = {
            "polymer_price_per_kg": -5.0,
        }

        warnings = validate_tco_settings(settings)
        assert len(warnings) > 0
        assert any("polymer" in w.lower() for w in warnings)

    def test_zero_backwash_volume_warning(self):
        """Test warning for zero backwash volume."""
        settings = {
            "backwash_volume_m3": 0,
        }

        warnings = validate_tco_settings(settings)
        assert len(warnings) > 0
        assert any("backwash" in w.lower() for w in warnings)

    def test_zero_runtime_warning(self):
        """Test warning for zero filter runtime."""
        settings = {
            "filter_runtime_hours_to_clog": 0,
        }

        warnings = validate_tco_settings(settings)
        assert len(warnings) > 0
        assert any("runtime" in w.lower() for w in warnings)

    def test_high_polymer_price_warning(self):
        """Test warning for unusually high polymer price."""
        settings = {
            "polymer_price_per_kg": 150.0,  # > 100
        }

        warnings = validate_tco_settings(settings)
        assert len(warnings) > 0
        assert any("high" in w.lower() and "polymer" in w.lower() for w in warnings)

    def test_empty_settings(self):
        """Test that empty settings produce no warnings."""
        warnings = validate_tco_settings({})
        assert len(warnings) == 0

    def test_none_settings(self):
        """Test handling of None settings."""
        warnings = validate_tco_settings(None)
        assert len(warnings) == 0
