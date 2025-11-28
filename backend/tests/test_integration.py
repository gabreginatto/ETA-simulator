"""
Integration tests for end-to-end simulation workflows.
Tests full simulate flow with mass balance verification.

NOTE: These tests use the `client` fixture from conftest.py which provides:
- In-memory SQLite database with transactional isolation
- Each test runs in a transaction that is rolled back after completion
- No mutations persist between tests
"""
import pytest


@pytest.fixture
def default_plant_config():
    """Default plant configuration for testing."""
    return {
        "feed_source": {
            "parameters": {
                "flow_m3_h": 100.0,
                "ts_percent": 3.0,
                "temperature_C": 20.0,
            }
        },
        "transfer_pump": {
            "parameters": {
                "head_m": 20.0,
                "efficiency_pump": 0.7,
                "efficiency_motor": 0.9,
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
                "capture_rate": 0.95,
                "cake_dryness_percent": 23.0,
                "polymer_split_cake": 0.3,
            }
        },
        "settings": {
            "polymer_price_per_kg": 5.0,
            "electricity_price_per_kwh": 0.12,
            "operating_hours_per_day": 24.0,
        },
    }


@pytest.mark.asyncio
async def test_simulate_end_to_end(client, default_plant_config):
    """Test full simulation flow with typical plant configuration."""
    response = await client.post(
        "/api/simulate",
        json={"plant_definition": default_plant_config},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    # Verify streams exist
    assert "streams" in data
    streams = data["streams"]
    assert "feed" in streams
    assert "conditioned" in streams
    assert "cake" in streams
    assert "liquid" in streams

    # Verify KPIs exist and have expected fields
    assert "kpis" in data
    kpis = data["kpis"]
    assert "polymer_dose_ppm" in kpis
    assert "cake_dryness_percent" in kpis
    assert "mass_balance_closure_percent" in kpis
    assert "solids_capture_actual_percent" in kpis

    # Verify mass balance closure is ~100%
    assert 99.5 <= kpis["mass_balance_closure_percent"] <= 100.5


@pytest.mark.asyncio
async def test_simulate_mass_balance_closes(client, default_plant_config):
    """Verify mass balance closes correctly for various configurations."""
    # Test with different flow rates
    for flow_rate in [50.0, 100.0, 200.0]:
        default_plant_config["feed_source"]["parameters"]["flow_m3_h"] = flow_rate

        response = await client.post(
            "/api/simulate",
            json={"plant_definition": default_plant_config},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        kpis = data["kpis"]
        # Mass balance should always close within 0.5%
        assert (
            99.5 <= kpis["mass_balance_closure_percent"] <= 100.5
        ), f"Mass balance failed at flow rate {flow_rate}: {kpis['mass_balance_closure_percent']}%"


@pytest.mark.asyncio
async def test_simulate_different_solids_content(client, default_plant_config):
    """Verify simulation works across different solids content."""
    # Test with different TS percentages
    for ts_percent in [1.0, 3.0, 5.0, 8.0]:
        default_plant_config["feed_source"]["parameters"]["ts_percent"] = ts_percent

        response = await client.post(
            "/api/simulate",
            json={"plant_definition": default_plant_config},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify cake dryness is greater than feed TS
        kpis = data["kpis"]
        assert (
            kpis["cake_dryness_percent"]
            > default_plant_config["feed_source"]["parameters"]["ts_percent"]
        ), f"Cake dryness should exceed feed TS at {ts_percent}%"


@pytest.mark.asyncio
async def test_simulate_with_warnings(client, default_plant_config):
    """Test that simulation returns warnings for edge cases."""
    # Set a very low polymer dose to trigger a warning
    default_plant_config["polymer_conditioner"]["parameters"][
        "jar_test_optimum_ppm"
    ] = 1.0

    response = await client.post(
        "/api/simulate",
        json={"plant_definition": default_plant_config},
    )

    assert response.status_code == 200
    data = response.json()
    # Simulation should still succeed but may have warnings
    assert data["success"] is True
    # The result may include warnings for unusual parameters
    assert "warnings" in data


@pytest.mark.asyncio
async def test_simulate_pump_power_calculation(client, default_plant_config):
    """Test that pump power is calculated correctly."""
    response = await client.post(
        "/api/simulate",
        json={"plant_definition": default_plant_config},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    kpis = data["kpis"]
    # Pump power should be present and positive
    assert "pump_power_kW" in kpis
    assert kpis["pump_power_kW"] > 0


@pytest.mark.asyncio
async def test_simulate_polymer_calculations(client, default_plant_config):
    """Test polymer dose and consumption calculations."""
    response = await client.post(
        "/api/simulate",
        json={"plant_definition": default_plant_config},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    kpis = data["kpis"]

    # Verify polymer KPIs
    assert "polymer_dose_ppm" in kpis
    assert "polymer_kg_per_tDS" in kpis
    assert "polymer_kg_per_h" in kpis
    assert "polymer_kg_per_day" in kpis

    # Effective dose should be jar_test_optimum * shear * safety
    expected_dose = 15.0 * 1.2 * 1.1  # 19.8 ppm
    assert abs(kpis["polymer_dose_ppm"] - expected_dose) < 0.1


@pytest.mark.asyncio
async def test_validate_endpoint(client, default_plant_config):
    """Test the validation endpoint."""
    response = await client.post(
        "/api/simulate/validate",
        json={"plant_definition": default_plant_config},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["errors"] == []


@pytest.mark.asyncio
async def test_validate_invalid_config(client):
    """Test validation catches invalid configurations."""
    # Test with invalid flow rate
    invalid_config = {
        "feed_source": {
            "parameters": {
                "flow_m3_h": -100.0,  # Invalid: negative
                "ts_percent": 3.0,
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
                "capture_rate": 0.95,
                "cake_dryness_percent": 23.0,
            }
        },
    }

    response = await client.post(
        "/api/simulate/validate",
        json={"plant_definition": invalid_config},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


@pytest.mark.asyncio
async def test_project_crud_workflow(client):
    """Test complete project CRUD workflow."""
    # Create a project
    project_data = {
        "name": "Test Project",
        "description": "Integration test project",
        "plant_configuration": {
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
        },
    }

    create_response = await client.post("/api/projects", json=project_data)
    assert create_response.status_code == 201
    created = create_response.json()
    project_id = created["id"]
    assert created["name"] == "Test Project"

    # Read the project
    get_response = await client.get(f"/api/projects/{project_id}")
    assert get_response.status_code == 200
    retrieved = get_response.json()
    assert retrieved["name"] == "Test Project"

    # Update the project
    update_data = {"name": "Updated Project", "description": "Updated description"}
    update_response = await client.put(
        f"/api/projects/{project_id}", json=update_data
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "Updated Project"

    # List projects
    list_response = await client.get("/api/projects")
    assert list_response.status_code == 200
    projects = list_response.json()
    assert projects["total"] >= 1

    # Delete the project
    delete_response = await client.delete(f"/api/projects/{project_id}")
    assert delete_response.status_code == 204

    # Verify deletion
    get_after_delete = await client.get(f"/api/projects/{project_id}")
    assert get_after_delete.status_code == 404
