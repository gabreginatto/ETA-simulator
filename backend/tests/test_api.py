"""
Unit tests for API endpoints.
Uses httpx async client for testing async FastAPI app.
Fixtures are provided by conftest.py for transactional isolation.
"""
import pytest


class TestHealthEndpoint:
    """Test health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test that health endpoint returns healthy status."""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestRootEndpoint:
    """Test root endpoint."""

    @pytest.mark.asyncio
    async def test_root(self, client):
        """Test root endpoint returns API info."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "SludgeSim" in data["message"]
        assert "docs" in data


class TestSimulateEndpoint:
    """Test simulation endpoint."""

    @pytest.mark.asyncio
    async def test_simulate_success(self, client):
        """Test successful simulation."""
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
            "settings": {"polymer_price_per_kg": 5.0},
        }

        response = await client.post("/api/simulate", json={"plant_definition": plant_definition})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "feed" in data["streams"]
        assert "cake" in data["streams"]
        assert "polymer_dose_ppm" in data["kpis"]

    @pytest.mark.asyncio
    async def test_simulate_missing_section(self, client):
        """Test simulation with missing section."""
        plant_definition = {
            "feed_source": {"parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}},
        }

        response = await client.post("/api/simulate", json={"plant_definition": plant_definition})

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_simulate_with_jar_test(self, client):
        """Test simulation using a jar test ID."""
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

        response = await client.post(
            "/api/simulate",
            json={"plant_definition": plant_definition, "jar_test_id": "JT-2024-001"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_simulate_nonexistent_jar_test(self, client):
        """Test simulation with nonexistent jar test ID."""
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

        response = await client.post(
            "/api/simulate",
            json={"plant_definition": plant_definition, "jar_test_id": "nonexistent"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_simulate_graph_based(self, client):
        """Test simulation with graph-based nodes/edges payload."""
        nodes = [
            {
                "id": "feed-1",
                "type": "feed",
                "data": {
                    "parameters": {
                        "flow_m3_h": 100.0,
                        "ts_percent": 3.0,
                        "temperature_C": 20.0,
                    }
                },
            },
            {
                "id": "polymer-1",
                "type": "polymer",
                "data": {
                    "parameters": {
                        "jar_test_optimum_ppm": 15.0,
                        "shear_factor": 1.2,
                        "safety_factor": 1.1,
                    }
                },
            },
            {
                "id": "dew-1",
                "type": "dewatering",
                "data": {
                    "parameters": {
                        "max_flow_m3_h": 150.0,
                        "capture_rate": 0.95,
                        "cake_dryness_percent": 23.0,
                    }
                },
            },
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "sourceHandle": "output", "target": "polymer-1", "targetHandle": "input"},
            {"id": "e2", "source": "polymer-1", "sourceHandle": "output", "target": "dew-1", "targetHandle": "input"},
        ]

        response = await client.post(
            "/api/simulate",
            json={
                "nodes": nodes,
                "edges": edges,
                "plant_definition": {"settings": {"polymer_price_per_kg": 5.0}},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "feed" in data["streams"]
        assert "cake" in data["streams"]
        assert "polymer_dose_ppm" in data["kpis"]

    @pytest.mark.asyncio
    async def test_simulate_graph_with_pump(self, client):
        """Test graph-based simulation with pump node."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}}},
            {"id": "pump-1", "type": "pump", "data": {"parameters": {"head_m": 20.0, "efficiency_pump": 0.7, "efficiency_motor": 0.9}}},
            {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15.0, "shear_factor": 1.2, "safety_factor": 1.1}}},
            {"id": "dew-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23.0}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "pump-1"},
            {"id": "e2", "source": "pump-1", "target": "polymer-1"},
            {"id": "e3", "source": "polymer-1", "target": "dew-1"},
        ]

        response = await client.post("/api/simulate", json={"nodes": nodes, "edges": edges})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "pump_out" in data["streams"]

    @pytest.mark.asyncio
    async def test_simulate_graph_invalid_node_type(self, client):
        """Test graph-based simulation with invalid node type."""
        nodes = [
            {"id": "bad-1", "type": "unknown_type", "data": {"parameters": {}}},
        ]
        edges = []

        response = await client.post("/api/simulate", json={"nodes": nodes, "edges": edges})

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_simulate_no_payload(self, client):
        """Test simulation with no payload returns error."""
        response = await client.post("/api/simulate", json={})

        assert response.status_code == 400


class TestJarTestsEndpoint:
    """Test jar tests endpoints."""

    @pytest.mark.asyncio
    async def test_list_jar_tests(self, client):
        """Test listing jar tests."""
        response = await client.get("/api/jar-tests")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 3  # Seed data has 3 jar tests

    @pytest.mark.asyncio
    async def test_get_jar_test(self, client):
        """Test getting a specific jar test."""
        response = await client.get("/api/jar-tests/JT-2024-001")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "JT-2024-001"
        assert data["polymer"]["name"] == "PAM-855"

    @pytest.mark.asyncio
    async def test_get_nonexistent_jar_test(self, client):
        """Test getting a nonexistent jar test."""
        response = await client.get("/api/jar-tests/nonexistent")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_jar_test(self, client):
        """Test creating a new jar test."""
        new_test = {
            "date": "2024-04-01",
            "sample": {"source": "Test sludge", "initial_ts_percent": 2.5},
            "polymer": {"name": "Test Polymer", "type": "cationic"},
            "doses": [
                {"dose_ppm": 10.0, "cst_s": 15.0, "floc_score": 3},
                {"dose_ppm": 15.0, "cst_s": 10.0, "floc_score": 5},
            ],
            "analysis": {"optimum_dose_ppm": 15.0},
        }

        response = await client.post("/api/jar-tests", json=new_test)
        assert response.status_code == 201
        data = response.json()
        assert "JT-" in data["id"]
        assert data["polymer"]["name"] == "Test Polymer"


class TestProjectsEndpoint:
    """Test projects endpoints."""

    @pytest.mark.asyncio
    async def test_list_projects(self, client):
        """Test listing projects."""
        response = await client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 2  # Seed data has 2 projects

    @pytest.mark.asyncio
    async def test_get_project(self, client):
        """Test getting a specific project."""
        response = await client.get("/api/projects/demo-sabesp-001")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Sabesp Demo Plant"

    @pytest.mark.asyncio
    async def test_get_nonexistent_project(self, client):
        """Test getting a nonexistent project."""
        response = await client.get("/api/projects/nonexistent")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_create_project(self, client):
        """Test creating a new project."""
        new_project = {
            "name": "Test Project",
            "description": "A test project",
            "plant_configuration": {
                "feed_source": {
                    "parameters": {"flow_m3_h": 50.0, "ts_percent": 2.0}
                },
                "polymer_conditioner": {
                    "parameters": {
                        "jar_test_optimum_ppm": 10.0,
                        "shear_factor": 1.1,
                        "safety_factor": 1.05,
                    }
                },
                "dewatering_unit": {
                    "parameters": {"capture_rate": 0.9, "cake_dryness_percent": 20.0}
                },
                "settings": {},
            },
        }

        response = await client.post("/api/projects", json=new_project)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Project"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_update_project(self, client):
        """Test updating a project."""
        # First create a project
        new_project = {
            "name": "Update Test",
            "plant_configuration": {
                "feed_source": {"parameters": {"flow_m3_h": 50.0, "ts_percent": 2.0}},
                "polymer_conditioner": {
                    "parameters": {
                        "jar_test_optimum_ppm": 10.0,
                        "shear_factor": 1.1,
                        "safety_factor": 1.05,
                    }
                },
                "dewatering_unit": {
                    "parameters": {"capture_rate": 0.9, "cake_dryness_percent": 20.0}
                },
                "settings": {},
            },
        }

        create_response = await client.post("/api/projects", json=new_project)
        project_id = create_response.json()["id"]

        # Then update it
        update_response = await client.put(
            f"/api/projects/{project_id}",
            json={"name": "Updated Name"},
        )

        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_project(self, client):
        """Test deleting a project."""
        # First create a project
        new_project = {
            "name": "Delete Test",
            "plant_configuration": {
                "feed_source": {"parameters": {"flow_m3_h": 50.0, "ts_percent": 2.0}},
                "polymer_conditioner": {
                    "parameters": {
                        "jar_test_optimum_ppm": 10.0,
                        "shear_factor": 1.1,
                        "safety_factor": 1.05,
                    }
                },
                "dewatering_unit": {
                    "parameters": {"capture_rate": 0.9, "cake_dryness_percent": 20.0}
                },
                "settings": {},
            },
        }

        create_response = await client.post("/api/projects", json=new_project)
        project_id = create_response.json()["id"]

        # Then delete it
        delete_response = await client.delete(f"/api/projects/{project_id}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = await client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 404


class TestValidateEndpoint:
    """Test validation endpoint."""

    @pytest.mark.asyncio
    async def test_validate_valid_config(self, client):
        """Test validation with valid configuration."""
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

        response = await client.post(
            "/api/simulate/validate", json={"plant_definition": plant_definition}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0

    @pytest.mark.asyncio
    async def test_validate_invalid_flow(self, client):
        """Test validation with invalid flow rate."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": -50.0, "ts_percent": 3.0}
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

        response = await client.post(
            "/api/simulate/validate", json={"plant_definition": plant_definition}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0
        assert any("flow" in e["path"].lower() for e in data["errors"])

    @pytest.mark.asyncio
    async def test_validate_returns_warnings(self, client):
        """Test validation returns warnings for edge cases."""
        plant_definition = {
            "feed_source": {
                "parameters": {"flow_m3_h": 15000.0, "ts_percent": 3.0}  # Very high flow
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

        response = await client.post(
            "/api/simulate/validate", json={"plant_definition": plant_definition}
        )

        assert response.status_code == 200
        data = response.json()
        # High flow should generate warning but still be valid
        assert data["valid"] is True
        assert len(data["warnings"]) > 0


class TestDefaultConfigEndpoint:
    """Test default configuration endpoint."""

    @pytest.mark.asyncio
    async def test_get_default_config(self, client):
        """Test getting default configuration."""
        response = await client.get("/api/default-config")
        assert response.status_code == 200
        data = response.json()
        assert "feed_source" in data
        assert "polymer_conditioner" in data
        assert "dewatering_unit" in data
