"""
Tests for tenant isolation on Project CRUD endpoints.
Verifies that when auth_enabled=True, projects are filtered by tenant_id.
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.database import get_db
from app.auth.security import get_current_user, User


# Tenant IDs for testing
TENANT_A = "tenant-a-uuid"
TENANT_B = "tenant-b-uuid"


def make_user(tenant_id: str) -> User:
    """Create a mock user with the given tenant_id."""
    return User(
        user_id=f"user-{tenant_id}",
        email=f"user@{tenant_id}.com",
        tenant_id=tenant_id,
    )


@pytest.fixture
def user_tenant_a():
    """User belonging to Tenant A."""
    return make_user(TENANT_A)


@pytest.fixture
def user_tenant_b():
    """User belonging to Tenant B."""
    return make_user(TENANT_B)


@pytest.fixture
def project_data():
    """Sample project data for testing."""
    return {
        "name": "Test Project",
        "description": "A test project",
        "plant_configuration": {
            "feed_source": {"parameters": {"flow_m3_h": 100.0, "ts_percent": 3.0}},
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


@pytest.mark.asyncio
async def test_tenant_isolation_list_projects(
    test_engine, db_session, user_tenant_a, user_tenant_b, project_data
):
    """Tenant A cannot see projects belonging to Tenant B."""
    # Override get_db
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    # Patch auth_enabled to True and create user override
    with patch("app.api.routes.projects.settings") as mock_settings:
        mock_settings.auth_enabled = True

        # User A creates a project
        async def get_user_a():
            return user_tenant_a

        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post("/api/projects", json=project_data)
            assert create_resp.status_code == 201
            project_a = create_resp.json()
            # Note: tenant_id is not exposed in API response schema

        # User B tries to list projects - should not see A's project
        async def get_user_b():
            return user_tenant_b

        app.dependency_overrides[get_current_user] = get_user_b

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            list_resp = await client.get("/api/projects")
            assert list_resp.status_code == 200
            data = list_resp.json()
            # Should not see tenant A's project
            project_ids = [p["id"] for p in data["items"]]
            assert project_a["id"] not in project_ids

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_tenant_isolation_get_project_returns_404(
    test_engine, db_session, user_tenant_a, user_tenant_b, project_data
):
    """Getting a project from another tenant returns 404."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    with patch("app.api.routes.projects.settings") as mock_settings:
        mock_settings.auth_enabled = True

        # User A creates a project
        async def get_user_a():
            return user_tenant_a

        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post("/api/projects", json=project_data)
            assert create_resp.status_code == 201
            project_a = create_resp.json()

        # User B tries to get A's project - should get 404
        async def get_user_b():
            return user_tenant_b

        app.dependency_overrides[get_current_user] = get_user_b

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            get_resp = await client.get(f"/api/projects/{project_a['id']}")
            assert get_resp.status_code == 404

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_tenant_isolation_update_project_returns_404(
    test_engine, db_session, user_tenant_a, user_tenant_b, project_data
):
    """Updating a project from another tenant returns 404."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    with patch("app.api.routes.projects.settings") as mock_settings:
        mock_settings.auth_enabled = True

        # User A creates a project
        async def get_user_a():
            return user_tenant_a

        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post("/api/projects", json=project_data)
            assert create_resp.status_code == 201
            project_a = create_resp.json()

        # User B tries to update A's project - should get 404
        async def get_user_b():
            return user_tenant_b

        app.dependency_overrides[get_current_user] = get_user_b

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            update_resp = await client.put(
                f"/api/projects/{project_a['id']}",
                json={"name": "Hacked Project"},
            )
            assert update_resp.status_code == 404

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_tenant_isolation_delete_project_returns_404(
    test_engine, db_session, user_tenant_a, user_tenant_b, project_data
):
    """Deleting a project from another tenant returns 404."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    with patch("app.api.routes.projects.settings") as mock_settings:
        mock_settings.auth_enabled = True

        # User A creates a project
        async def get_user_a():
            return user_tenant_a

        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post("/api/projects", json=project_data)
            assert create_resp.status_code == 201
            project_a = create_resp.json()

        # User B tries to delete A's project - should get 404
        async def get_user_b():
            return user_tenant_b

        app.dependency_overrides[get_current_user] = get_user_b

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            delete_resp = await client.delete(f"/api/projects/{project_a['id']}")
            assert delete_resp.status_code == 404

        # Verify project still exists (switch back to user A)
        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            get_resp = await client.get(f"/api/projects/{project_a['id']}")
            assert get_resp.status_code == 200

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_auth_disabled_no_tenant_filtering(
    test_engine, db_session, user_tenant_a, user_tenant_b, project_data
):
    """When auth_enabled=False, no tenant filtering occurs."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    with patch("app.api.routes.projects.settings") as mock_settings:
        mock_settings.auth_enabled = False

        # User A creates a project (still gets tenant_id from user)
        async def get_user_a():
            return user_tenant_a

        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            create_resp = await client.post("/api/projects", json=project_data)
            assert create_resp.status_code == 201
            project_a = create_resp.json()

        # User B CAN see and access A's project when auth is disabled
        async def get_user_b():
            return user_tenant_b

        app.dependency_overrides[get_current_user] = get_user_b

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Can list and see the project
            list_resp = await client.get("/api/projects")
            assert list_resp.status_code == 200
            project_ids = [p["id"] for p in list_resp.json()["items"]]
            assert project_a["id"] in project_ids

            # Can get the project
            get_resp = await client.get(f"/api/projects/{project_a['id']}")
            assert get_resp.status_code == 200

            # Can update the project
            update_resp = await client.put(
                f"/api/projects/{project_a['id']}",
                json={"name": "Updated by B"},
            )
            assert update_resp.status_code == 200

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_tenant_can_access_own_projects(
    test_engine, db_session, user_tenant_a, project_data
):
    """Tenant can perform all CRUD operations on their own projects."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    with patch("app.api.routes.projects.settings") as mock_settings:
        mock_settings.auth_enabled = True

        async def get_user_a():
            return user_tenant_a

        app.dependency_overrides[get_current_user] = get_user_a

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Create
            create_resp = await client.post("/api/projects", json=project_data)
            assert create_resp.status_code == 201
            project = create_resp.json()
            # Note: tenant_id is not exposed in API response schema

            # List - should see own project
            list_resp = await client.get("/api/projects")
            assert list_resp.status_code == 200
            assert any(p["id"] == project["id"] for p in list_resp.json()["items"])

            # Get
            get_resp = await client.get(f"/api/projects/{project['id']}")
            assert get_resp.status_code == 200

            # Update
            update_resp = await client.put(
                f"/api/projects/{project['id']}",
                json={"name": "Updated Project"},
            )
            assert update_resp.status_code == 200
            assert update_resp.json()["name"] == "Updated Project"

            # Delete
            delete_resp = await client.delete(f"/api/projects/{project['id']}")
            assert delete_resp.status_code == 204

            # Verify deleted
            get_resp = await client.get(f"/api/projects/{project['id']}")
            assert get_resp.status_code == 404

    app.dependency_overrides.clear()
