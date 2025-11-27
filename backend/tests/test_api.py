"""
Unit tests for API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import seed_data
from app.api.routes.jar_tests import jar_tests_db
from app.api.routes.projects import projects_db

# Load seed data for tests
jar_tests_db.update(seed_data.jar_tests_db)
projects_db.update(seed_data.projects_db)

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test that health endpoint returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root(self):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "SludgeSim" in data["message"]
        assert "docs" in data


class TestSimulateEndpoint:
    """Test simulation endpoint."""

    def test_simulate_success(self):
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

        response = client.post("/api/simulate", json={"plant_definition": plant_definition})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "feed" in data["streams"]
        assert "cake" in data["streams"]
        assert "polymer_dose_ppm" in data["kpis"]

    def test_simulate_missing_section(self):
        """Test simulation with missing section."""
        plant_definition = {
            "feed_source": {"parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}},
        }

        response = client.post("/api/simulate", json={"plant_definition": plant_definition})

        assert response.status_code == 422

    def test_simulate_with_jar_test(self):
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

        response = client.post(
            "/api/simulate",
            json={"plant_definition": plant_definition, "jar_test_id": "JT-2024-001"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_simulate_nonexistent_jar_test(self):
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

        response = client.post(
            "/api/simulate",
            json={"plant_definition": plant_definition, "jar_test_id": "nonexistent"},
        )

        assert response.status_code == 404


class TestJarTestsEndpoint:
    """Test jar tests endpoints."""

    def test_list_jar_tests(self):
        """Test listing jar tests."""
        response = client.get("/api/jar-tests")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 3  # Seed data has 3 jar tests

    def test_get_jar_test(self):
        """Test getting a specific jar test."""
        response = client.get("/api/jar-tests/JT-2024-001")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "JT-2024-001"
        assert data["polymer"]["name"] == "PAM-855"

    def test_get_nonexistent_jar_test(self):
        """Test getting a nonexistent jar test."""
        response = client.get("/api/jar-tests/nonexistent")
        assert response.status_code == 404

    def test_create_jar_test(self):
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

        response = client.post("/api/jar-tests", json=new_test)
        assert response.status_code == 201
        data = response.json()
        assert "JT-" in data["id"]
        assert data["polymer"]["name"] == "Test Polymer"


class TestProjectsEndpoint:
    """Test projects endpoints."""

    def test_list_projects(self):
        """Test listing projects."""
        response = client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 2  # Seed data has 2 projects

    def test_get_project(self):
        """Test getting a specific project."""
        response = client.get("/api/projects/demo-sabesp-001")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Sabesp Demo Plant"

    def test_get_nonexistent_project(self):
        """Test getting a nonexistent project."""
        response = client.get("/api/projects/nonexistent")
        assert response.status_code == 404

    def test_create_project(self):
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

        response = client.post("/api/projects", json=new_project)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Project"
        assert "id" in data

    def test_update_project(self):
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

        create_response = client.post("/api/projects", json=new_project)
        project_id = create_response.json()["id"]

        # Then update it
        update_response = client.put(
            f"/api/projects/{project_id}",
            json={"name": "Updated Name"},
        )

        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Name"

    def test_delete_project(self):
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

        create_response = client.post("/api/projects", json=new_project)
        project_id = create_response.json()["id"]

        # Then delete it
        delete_response = client.delete(f"/api/projects/{project_id}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 404


class TestDefaultConfigEndpoint:
    """Test default configuration endpoint."""

    def test_get_default_config(self):
        """Test getting default configuration."""
        response = client.get("/api/default-config")
        assert response.status_code == 200
        data = response.json()
        assert "feed_source" in data
        assert "polymer_conditioner" in data
        assert "dewatering_unit" in data
