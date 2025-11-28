"""
Unit tests for simulation engine.
"""
import pytest
from app.models.stream import Stream
from app.engine.feed_source import make_feed_stream
from app.engine.polymer_conditioner import apply_polymer, get_effective_dose_ppm
from app.engine.dewatering_unit import dewatering_unit
from app.engine.kpis import compute_kpis
from app.engine.solver import solve_plant


class TestFeedSource:
    """Test cases for feed source engine."""

    def test_make_feed_stream_typical(self):
        """Test feed stream creation with typical values."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)

        assert feed.id == "feed"
        assert feed.mass_flow_kg_h == 100000.0  # 100 m³/h * 1000 kg/m³
        assert feed.dry_solids_mass_flow_kg_h == 3000.0  # 3% of 100000
        assert feed.polymer_mass_flow_kg_h == 0.0
        assert feed.temperature_C == 20.0

    def test_make_feed_stream_custom_id(self):
        """Test feed stream with custom ID."""
        feed = make_feed_stream(flow_m3_h=50.0, ts_percent=2.5, stream_id="custom_feed")

        assert feed.id == "custom_feed"

    def test_make_feed_stream_custom_temperature(self):
        """Test feed stream with custom temperature."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0, temperature_C=25.0)

        assert feed.temperature_C == 25.0

    def test_make_feed_stream_negative_flow(self):
        """Test that negative flow raises ValueError."""
        with pytest.raises(ValueError, match="cannot be negative"):
            make_feed_stream(flow_m3_h=-10.0, ts_percent=3.0)

    def test_make_feed_stream_invalid_ts_percent(self):
        """Test that invalid TS percentage raises ValueError."""
        with pytest.raises(ValueError, match="between 0 and 100"):
            make_feed_stream(flow_m3_h=100.0, ts_percent=150.0)

        with pytest.raises(ValueError, match="between 0 and 100"):
            make_feed_stream(flow_m3_h=100.0, ts_percent=-5.0)


class TestPolymerConditioner:
    """Test cases for polymer conditioner engine."""

    def test_get_effective_dose_ppm(self):
        """Test effective dose calculation."""
        effective = get_effective_dose_ppm(
            jar_dose_ppm=15.0,
            shear_factor=1.2,
            safety_factor=1.1,
        )

        assert effective == pytest.approx(19.8, rel=1e-6)

    def test_apply_polymer(self):
        """Test polymer application to stream."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)
        conditioned = apply_polymer(
            feed=feed,
            jar_dose_ppm=15.0,
            shear_factor=1.2,
            safety_factor=1.1,
        )

        assert conditioned.id == "conditioned"
        assert conditioned.mass_flow_kg_h == feed.mass_flow_kg_h
        assert conditioned.dry_solids_mass_flow_kg_h == feed.dry_solids_mass_flow_kg_h
        assert conditioned.polymer_mass_flow_kg_h > 0
        assert conditioned.polymer_dose_ppm == pytest.approx(19.8, rel=0.05)

    def test_apply_polymer_no_mutation(self):
        """Test that apply_polymer doesn't mutate the input stream."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)
        original_polymer = feed.polymer_mass_flow_kg_h

        apply_polymer(feed=feed, jar_dose_ppm=15.0, shear_factor=1.2, safety_factor=1.1)

        assert feed.polymer_mass_flow_kg_h == original_polymer

    def test_apply_polymer_negative_dose(self):
        """Test that negative dose raises ValueError."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)

        with pytest.raises(ValueError, match="cannot be negative"):
            apply_polymer(feed=feed, jar_dose_ppm=-5.0, shear_factor=1.2, safety_factor=1.1)

    def test_apply_polymer_invalid_factors(self):
        """Test that invalid factors raise ValueError."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)

        with pytest.raises(ValueError, match="must be positive"):
            apply_polymer(feed=feed, jar_dose_ppm=15.0, shear_factor=0, safety_factor=1.1)

        with pytest.raises(ValueError, match="must be positive"):
            apply_polymer(feed=feed, jar_dose_ppm=15.0, shear_factor=1.2, safety_factor=-0.5)


class TestDewateringUnit:
    """Test cases for dewatering unit engine."""

    def test_dewatering_mass_balance(self):
        """Test that mass balance closes in dewatering."""
        feed = Stream(
            id="conditioned",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
            polymer_mass_flow_kg_h=2.0,
        )

        cake, liquid = dewatering_unit(
            feed=feed,
            capture_rate=0.95,
            cake_dryness_percent=23.0,
        )

        # Total mass should be conserved
        total_out = cake.mass_flow_kg_h + liquid.mass_flow_kg_h
        assert total_out == pytest.approx(feed.mass_flow_kg_h, rel=1e-6)

        # Solids should be conserved
        solids_out = cake.dry_solids_mass_flow_kg_h + liquid.dry_solids_mass_flow_kg_h
        assert solids_out == pytest.approx(feed.dry_solids_mass_flow_kg_h, rel=1e-6)

        # Polymer should be conserved
        polymer_out = cake.polymer_mass_flow_kg_h + liquid.polymer_mass_flow_kg_h
        assert polymer_out == pytest.approx(feed.polymer_mass_flow_kg_h, rel=1e-6)

    def test_dewatering_capture_rate(self):
        """Test that capture rate is respected."""
        feed = Stream(
            id="conditioned",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        cake, liquid = dewatering_unit(
            feed=feed,
            capture_rate=0.95,
            cake_dryness_percent=23.0,
        )

        actual_capture = cake.dry_solids_mass_flow_kg_h / feed.dry_solids_mass_flow_kg_h
        assert actual_capture == pytest.approx(0.95, rel=1e-6)

    def test_dewatering_cake_dryness(self):
        """Test that cake dryness is achieved."""
        feed = Stream(
            id="conditioned",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        cake, _ = dewatering_unit(
            feed=feed,
            capture_rate=0.95,
            cake_dryness_percent=23.0,
        )

        assert cake.dry_solids_percent == pytest.approx(23.0, rel=1e-6)

    def test_dewatering_various_capture_rates(self):
        """Test dewatering with various capture rates."""
        feed = Stream(
            id="conditioned",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        for capture_rate in [0.90, 0.95, 0.98]:
            cake, liquid = dewatering_unit(
                feed=feed,
                capture_rate=capture_rate,
                cake_dryness_percent=23.0,
            )

            actual_capture = cake.dry_solids_mass_flow_kg_h / feed.dry_solids_mass_flow_kg_h
            assert actual_capture == pytest.approx(capture_rate, rel=1e-6)

    def test_dewatering_invalid_capture_rate(self):
        """Test that invalid capture rate raises ValueError."""
        feed = Stream(
            id="conditioned",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        with pytest.raises(ValueError, match="Capture rate"):
            dewatering_unit(feed=feed, capture_rate=0, cake_dryness_percent=23.0)

        with pytest.raises(ValueError, match="Capture rate"):
            dewatering_unit(feed=feed, capture_rate=1.5, cake_dryness_percent=23.0)

    def test_dewatering_invalid_dryness(self):
        """Test that invalid cake dryness raises ValueError."""
        feed = Stream(
            id="conditioned",
            mass_flow_kg_h=100000.0,
            dry_solids_mass_flow_kg_h=3000.0,
        )

        with pytest.raises(ValueError, match="Cake dryness"):
            dewatering_unit(feed=feed, capture_rate=0.95, cake_dryness_percent=0)


class TestKPIs:
    """Test cases for KPI calculations."""

    def test_compute_kpis(self):
        """Test KPI computation."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)
        conditioned = apply_polymer(
            feed=feed, jar_dose_ppm=15.0, shear_factor=1.2, safety_factor=1.1
        )
        cake, liquid = dewatering_unit(
            feed=conditioned, capture_rate=0.95, cake_dryness_percent=23.0
        )

        kpis = compute_kpis(
            feed=feed,
            conditioned=conditioned,
            cake=cake,
            liquid=liquid,
            polymer_price_per_kg=5.0,
            operating_hours_per_day=24.0,
        )

        assert "polymer_dose_ppm" in kpis
        assert "polymer_kg_per_tDS" in kpis
        assert "cake_dryness_percent" in kpis
        assert "mass_balance_closure_percent" in kpis
        assert "polymer_cost_per_month" in kpis

        # Mass balance should close at ~100%
        assert kpis["mass_balance_closure_percent"] == pytest.approx(100.0, rel=0.01)

    def test_compute_kpis_no_price(self):
        """Test KPI computation without polymer price."""
        feed = make_feed_stream(flow_m3_h=100.0, ts_percent=3.0)
        conditioned = apply_polymer(
            feed=feed, jar_dose_ppm=15.0, shear_factor=1.2, safety_factor=1.1
        )
        cake, liquid = dewatering_unit(
            feed=conditioned, capture_rate=0.95, cake_dryness_percent=23.0
        )

        kpis = compute_kpis(
            feed=feed,
            conditioned=conditioned,
            cake=cake,
            liquid=liquid,
        )

        assert kpis["polymer_cost_per_month"] is None


class TestSolver:
    """Test cases for main solver."""

    def test_solve_plant_success(self):
        """Test successful plant simulation."""
        plant_definition = {
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
            "settings": {},
        }

        result = solve_plant(plant_definition)

        assert result["success"] is True
        assert "feed" in result["streams"]
        assert "conditioned" in result["streams"]
        assert "cake" in result["streams"]
        assert "liquid" in result["streams"]
        assert result["kpis"]["cake_dryness_percent"] == pytest.approx(23.0, rel=0.01)

    def test_solve_plant_with_jar_test_override(self):
        """Test solver with jar test dose override."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}
            },
            "polymer_conditioner": {
                "parameters": {
                    "jar_test_optimum_ppm": 15.0,
                    "shear_factor": 1.2,
                    "safety_factor": 1.1,
                }
            },
            "dewatering_unit": {
                "parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23.0}
            },
            "settings": {},
        }

        result = solve_plant(plant_definition, jar_test_optimum_ppm=20.0)

        assert result["success"] is True
        # Effective dose should be 20 * 1.2 * 1.1 = 26.4 ppm
        assert result["kpis"]["polymer_dose_ppm"] == pytest.approx(26.4, rel=0.05)

    def test_solve_plant_missing_section(self):
        """Test solver with missing configuration section."""
        plant_definition = {
            "feed_source": {"parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}},
        }

        result = solve_plant(plant_definition)

        assert result["success"] is False
        assert len(result["errors"]) > 0

    def test_solve_plant_generates_warnings(self):
        """Test that solver generates appropriate warnings."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 200.0, "ts_percent": 3.0}  # Exceeds max
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
                    "max_flow_m3_h": 100.0,  # Less than feed flow
                    "capture_rate": 0.95,
                    "cake_dryness_percent": 23.0,
                }
            },
            "settings": {},
        }

        result = solve_plant(plant_definition)

        assert result["success"] is True
        assert len(result["warnings"]) > 0
        assert any("exceeds" in w.lower() for w in result["warnings"])

    def test_solve_plant_jar_test_range_below_min(self):
        """Test warning when effective dose is below jar test range."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}
            },
            "polymer_conditioner": {
                "parameters": {
                    "jar_test_optimum_ppm": 5.0,  # Very low dose
                    "shear_factor": 1.0,
                    "safety_factor": 1.0,
                }
            },
            "dewatering_unit": {
                "parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23.0}
            },
            "settings": {},
        }

        jar_test_range = {
            "acceptable_range_min_ppm": 10.0,
            "acceptable_range_max_ppm": 25.0,
        }

        result = solve_plant(plant_definition, jar_test_range=jar_test_range)

        assert result["success"] is True
        assert any("below jar test acceptable range" in w.lower() for w in result["warnings"])

    def test_solve_plant_jar_test_range_above_max(self):
        """Test warning when effective dose exceeds jar test range."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}
            },
            "polymer_conditioner": {
                "parameters": {
                    "jar_test_optimum_ppm": 25.0,  # High dose
                    "shear_factor": 1.5,  # Will result in 37.5 ppm
                    "safety_factor": 1.0,
                }
            },
            "dewatering_unit": {
                "parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23.0}
            },
            "settings": {},
        }

        jar_test_range = {
            "acceptable_range_min_ppm": 10.0,
            "acceptable_range_max_ppm": 30.0,  # 37.5 exceeds this
        }

        result = solve_plant(plant_definition, jar_test_range=jar_test_range)

        assert result["success"] is True
        assert any("exceeds jar test acceptable range" in w.lower() for w in result["warnings"])

    def test_solve_plant_jar_test_range_within_range(self):
        """Test no range warning when dose is within acceptable range."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}
            },
            "polymer_conditioner": {
                "parameters": {
                    "jar_test_optimum_ppm": 15.0,
                    "shear_factor": 1.2,
                    "safety_factor": 1.1,
                }  # Effective = 19.8 ppm
            },
            "dewatering_unit": {
                "parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23.0}
            },
            "settings": {},
        }

        jar_test_range = {
            "acceptable_range_min_ppm": 10.0,
            "acceptable_range_max_ppm": 25.0,  # 19.8 is within range
        }

        result = solve_plant(plant_definition, jar_test_range=jar_test_range)

        assert result["success"] is True
        # Should not have range-related warnings
        assert not any("jar test acceptable range" in w.lower() for w in result["warnings"])

    def test_solve_plant_mass_balance_closes(self):
        """Test that mass balance closes at approximately 100%."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}
            },
            "polymer_conditioner": {
                "parameters": {
                    "jar_test_optimum_ppm": 15.0,
                    "shear_factor": 1.2,
                    "safety_factor": 1.1,
                }
            },
            "dewatering_unit": {
                "parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23.0}
            },
            "settings": {},
        }

        result = solve_plant(plant_definition)

        assert result["success"] is True
        # Mass balance should be very close to 100%
        assert result["kpis"]["mass_balance_closure_percent"] == pytest.approx(100.0, rel=0.01)
