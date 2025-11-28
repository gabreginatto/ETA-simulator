  ## Prompt A: Tenant Isolation on Project CRUD

  Goal
  Ensure all project CRUD endpoints are tenant-scoped when auth is enabled, preventing cross-tenant access.

  Requirements

  - If settings.auth_enabled is true, all /api/projects operations must filter by tenant_id == current_user.tenant_id. If auth is disabled, behavior
    stays unchanged (no filtering).
  - Endpoints affected: list, get by id, update, delete.
  - Keep create behavior: set tenant_id to current_user.tenant_id when auth is enabled; leave as-is when disabled.
  - Return 404 when a project exists but belongs to a different tenant (instead of leaking presence).
  - Tests:
      - Add tests (e.g., in backend/tests/test_api.py or new) that simulate auth_enabled=True with two different tenant_ids and ensure isolation on
        list/get/update/delete.
      - Keep existing tests passing when auth is disabled.

  Files to touch

  - backend/app/api/routes/projects.py (query filters and 404 behavior)
  - Possibly test helpers to toggle settings.auth_enabled and inject tenant_id

  ———

  ## Prompt B: Test Isolation for Integration Suite

  Goal
  Make integration tests run against an isolated database with rollback between tests (no persistence across runs).

  Requirements

  - Use a dedicated test database (e.g., SQLite in-memory or a temporary file) for integration tests.
  - Ensure each test either:
      - Runs inside a transaction that is rolled back after the test, or
      - Uses a fresh DB (create/drop or recreate schema) per test function/session.
  - Override get_db in tests to use the isolated session/engine.
  - Avoid mutating the production sludgesim.db.
  - Update integration tests to use the isolated DB fixture.
  - Keep existing test expectations intact; tests should pass without needing manual cleanup.

  Implementation hints

  - Create a pytest fixture (e.g., in backend/tests/conftest.py or alongside integration tests) that:
      - Builds an async engine pointing to sqlite+aiosqlite:///:memory: (or a tmp file).
      - Creates tables and seeds data as needed.
      - Overrides app.dependency_overrides[get_db] to yield sessions from this engine, wrapping each test in a transaction and rolling back in
        teardown.
  - Ensure Alembic is not invoked during tests; rely on Base.metadata.create_all for the test engine.

  Files to touch

  - backend/tests/conftest.py (or create if missing)
  - backend/tests/test_integration.py (wire to fixtures)