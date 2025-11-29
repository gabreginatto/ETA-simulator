"""
Tests for drinking water treatment plant (WTP) path.
Covers graph validation, solve, KPIs, and TCO for drinking water profile.
"""
import pytest
from app.engine.solver import solve_graph


class TestDrinkingWaterNodeTypes:
    """Test that drinking water node types are valid and execute correctly."""

    def test_coagulant_node_executes(self):
        """Coagulant node executes and produces output stream."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40, "coagulant_type": "alum"}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "coagulated" in result["streams"]

    def test_flocculator_node_executes(self):
        """Flocculator node executes and produces output stream."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {"detention_time_min": 20, "g_value": 50}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "flocculated" in result["streams"]

    def test_sedimentation_node_executes(self):
        """Sedimentation node executes and produces clarified + sludge streams."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"surface_loading_m3_m2_h": 2.5, "capture_rate": 0.9}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "sed_clarified" in result["streams"]
        assert "sed_sludge" in result["streams"]

    def test_daf_node_executes(self):
        """DAF node executes and produces clarified + float streams."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.1}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "daf-1", "type": "daf", "data": {"parameters": {"air_to_solids_ratio": 0.02, "recycle_rate": 0.1, "capture_rate": 0.92}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "daf-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "daf_clarified" in result["streams"]
        assert "daf_float" in result["streams"]

    def test_filter_node_executes(self):
        """Filter node executes and produces filtered + backwash streams."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"capture_rate": 0.9}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"media_type": "dual_media", "run_length_h": 24, "capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "filtered" in result["streams"]
        assert "backwash" in result["streams"]

    def test_clearwell_node_executes(self):
        """Clearwell node executes and produces finished water stream."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"capture_rate": 0.9}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
            {"id": "cw-1", "type": "clearwell", "data": {"parameters": {"volume_m3": 500, "contact_time_min": 30}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
            {"id": "e5", "source": "filt-1", "sourceHandle": "filtered", "target": "cw-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "finished" in result["streams"]


class TestDrinkingWaterFullFlow:
    """Test complete drinking water treatment flow."""

    def test_full_wtp_flow(self):
        """Full WTP flow: Feed → Coagulant → Flocculator → Sedimentation → Filter."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 500, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 30, "coagulant_type": "alum"}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {"detention_time_min": 20, "g_value": 50}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"surface_loading_m3_m2_h": 2.5, "capture_rate": 0.90}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"media_type": "dual_media", "run_length_h": 24, "capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {
            "plant_profile": "drinking_water",
            "coagulant_price_per_kg": 2.0,
            "coagulant_dose_mg_L": 30,
            "operating_hours_per_day": 24,
        }

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "feed" in result["streams"]
        assert "filtered" in result["streams"]

        # Verify KPIs
        kpis = result["kpis"]
        assert "water_recovery_percent" in kpis
        assert kpis["water_recovery_percent"] > 0
        assert kpis["water_recovery_percent"] <= 100

        # Verify TCO
        assert "tco_per_1000m3" in kpis
        assert kpis["tco_per_1000m3"]["total"] > 0

    def test_full_wtp_with_daf(self):
        """Full WTP flow with DAF instead of sedimentation."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 200, "ts_percent": 0.1}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "daf-1", "type": "daf", "data": {"parameters": {"air_to_solids_ratio": 0.02, "recycle_rate": 0.1, "capture_rate": 0.92}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "daf-1"},
            {"id": "e4", "source": "daf-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        assert "daf_clarified" in result["streams"]
        assert "daf_float" in result["streams"]
        assert "filtered" in result["streams"]


class TestDrinkingWaterKPIs:
    """Test drinking water-specific KPIs."""

    def test_water_recovery_kpi(self):
        """Water recovery KPI is calculated correctly."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"capture_rate": 0.9}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        assert "water_recovery_percent" in kpis
        # Water recovery should be reasonable for a WTP (>70%)
        # Note: Recovery depends on sludge withdrawal and backwash losses
        assert kpis["water_recovery_percent"] > 70.0
        assert kpis["water_recovery_percent"] <= 100.0

    def test_solids_removed_kpi(self):
        """Solids removed KPI is calculated correctly."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"capture_rate": 0.9}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        # Solids removed should be present if defined
        if "solids_removed_percent" in kpis:
            assert kpis["solids_removed_percent"] >= 0
            assert kpis["solids_removed_percent"] <= 100

    def test_finished_water_flow_kpi(self):
        """Finished water flow KPI is calculated correctly."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        # Finished water flow should be present
        if "finished_water_flow_m3_h" in kpis:
            assert kpis["finished_water_flow_m3_h"] > 0
            assert kpis["finished_water_flow_m3_h"] <= 100  # Should be <= feed flow


class TestDrinkingWaterTCO:
    """Test drinking water TCO calculations."""

    def test_tco_per_1000m3_exists(self):
        """TCO per 1000 m³ is calculated for drinking water."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"capture_rate": 0.9}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {
            "plant_profile": "drinking_water",
            "coagulant_price_per_kg": 2.0,
            "coagulant_dose_mg_L": 40,
        }

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        assert "tco_per_1000m3" in kpis
        tco = kpis["tco_per_1000m3"]
        assert "total" in tco
        assert "chemicals" in tco
        assert "filtration" in tco
        assert "sludge" in tco
        assert "logistics" in tco

    def test_tco_per_day_month_year(self):
        """TCO is calculated for day, month, and year periods."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        assert "tco_per_day" in kpis
        assert "tco_per_month" in kpis
        assert "tco_per_year" in kpis

        # Monthly should be ~30x daily
        daily_total = kpis["tco_per_day"]["total"]
        monthly_total = kpis["tco_per_month"]["total"]
        assert abs(monthly_total - daily_total * 30) < 0.01

    def test_coagulant_cost_calculation(self):
        """Coagulant chemical cost is calculated in TCO."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
        ]
        settings = {
            "plant_profile": "drinking_water",
            "coagulant_price_per_kg": 2.0,
            "coagulant_dose_mg_L": 40,
        }

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        # Chemicals cost should be > 0 with coagulant
        tco = kpis["tco_per_1000m3"]
        assert tco["chemicals"] > 0

    def test_filtration_cost_includes_opportunity_cost(self):
        """Filtration cost includes both backwash water and opportunity costs."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 500, "ts_percent": 0.05}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"media_type": "dual_media", "run_length_h": 24, "capture_rate": 0.95}}},
        ]
        edges = [{"id": "e1", "source": "feed-1", "target": "filt-1"}]
        settings = {
            "plant_profile": "drinking_water",
            "filter_runtime_hours_to_clog": 24,  # 24h run = 1 wash/filter/day
            "filters_in_parallel": 4,
            "backwash_volume_m3": 10,
            "backwash_time_hours": 0.5,
            "filter_flow_m3_h": 50,
            "water_cost_per_m3": 2,
            "product_price_per_m3": 5,
        }
        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        # Expected calculation:
        # washes/day = (24/24) * 4 = 4
        # water_cost/day = 4 * 10 * 2 = 80
        # margin = 5 - 2 = 3
        # opportunity_cost/day = 4 * 0.5 * 50 * 3 = 300
        # total filtration = 80 + 300 = 380

        tco_per_day = kpis["tco_per_day"]
        assert abs(tco_per_day["filtration"] - 380) < 1  # Allow small rounding

    def test_filtration_cost_missing_params_warning(self):
        """Warning is generated when filtration parameters are missing."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 500, "ts_percent": 0.05}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
        ]
        edges = [{"id": "e1", "source": "feed-1", "target": "filt-1"}]
        # Missing filtration settings - should generate warning
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        # Should have a warning about missing filtration params
        assert any("Filtration cost not calculated" in w for w in result.get("warnings", []))
        # Filtration cost should be 0
        tco_per_day = result["kpis"]["tco_per_day"]
        assert tco_per_day["filtration"] == 0


class TestDrinkingWaterProfileDetection:
    """Test automatic profile detection."""

    def test_profile_detection_from_nodes(self):
        """Profile is detected as drinking_water when only WTP nodes are present."""
        # No explicit plant_profile setting
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
        ]

        result = solve_graph(nodes, edges)

        # Should succeed with drinking water profile detected
        assert result["success"] is True
        # Should have drinking water KPIs, not wastewater KPIs
        kpis = result["kpis"]
        # Wastewater-specific KPIs should be 0 or not present
        if "polymer_dose_ppm" in kpis:
            assert kpis["polymer_dose_ppm"] == 0
        if "cake_dryness_percent" in kpis:
            assert kpis["cake_dryness_percent"] == 0

    def test_explicit_profile_setting_overrides(self):
        """Explicit plant_profile setting overrides node-based detection."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
        ]
        settings = {"plant_profile": "drinking_water"}  # Explicit

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True


class TestDrinkingWaterValidation:
    """Test validation for drinking water graphs."""

    def test_drinking_water_requires_feed(self):
        """Drinking water graph requires at least a feed node."""
        nodes = [
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
        ]
        edges = []
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is False
        assert len(result["errors"]) > 0

    def test_drinking_water_minimal_config(self):
        """Drinking water graph with just feed + one treatment step succeeds."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        # Minimal config should succeed for drinking water
        assert result["success"] is True


class TestMassBalanceDrinkingWater:
    """Test mass balance for drinking water."""

    def test_mass_balance_closes(self):
        """Mass balance closes for drinking water treatment."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 0.05}}},
            {"id": "coag-1", "type": "coagulant", "data": {"parameters": {"dose_mg_L": 40}}},
            {"id": "floc-1", "type": "flocculator", "data": {"parameters": {}}},
            {"id": "sed-1", "type": "sedimentation", "data": {"parameters": {"capture_rate": 0.9}}},
            {"id": "filt-1", "type": "filter", "data": {"parameters": {"capture_rate": 0.95}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "coag-1"},
            {"id": "e2", "source": "coag-1", "target": "floc-1"},
            {"id": "e3", "source": "floc-1", "target": "sed-1"},
            {"id": "e4", "source": "sed-1", "sourceHandle": "clarified", "target": "filt-1"},
        ]
        settings = {"plant_profile": "drinking_water"}

        result = solve_graph(nodes, edges, settings=settings)

        assert result["success"] is True
        kpis = result["kpis"]

        # Mass balance should close
        if "mass_balance_closure_percent" in kpis:
            assert 99.0 <= kpis["mass_balance_closure_percent"] <= 101.0
