 1. Productionize the DB path (Alembic + Cloud SQL)

  - Add Alembic to backend/requirements.txt. Initialize Alembic in backend/ (generate alembic.ini, alembic/), configure async engine with DATABASE_URL
    and target metadata from app.db.database.Base.
  - Create an initial migration for existing models (ProjectModel, JarTestModel, JarTestCounterModel), with JSONB for JSON columns when using Postgres.
  - Update CI/test setup to set DATABASE_URL=postgresql+asyncpg://... and run alembic upgrade head before tests.
  - Add docs (README or execution.md) for Cloud SQL deployment: using Cloud SQL Auth Proxy/Connector, required env vars (DATABASE_URL or
    cloud_sql_connection_name, db_user, db_pass, db_name, use_cloud_sql_proxy), and how to run migrations in that environment.
  - Fail-fast on startup if DATABASE_URL is missing/invalid; log which DB is in use.

  2. UX polish for validation/warnings

  - Frontend forms (FeedForm.tsx, PolymerForm.tsx, DewateringForm.tsx): show inline error messages under fields based on validationErrors paths (e.g.,
    feed_source.parameters.flow_m3_h). Highlight inputs with error state.
  - Add a warning badge (count) on the Simulate button when warnings exist. Keep existing confirm flow.
  - Improve node warning mapping: map specific warning substrings to node types and set flags (isOverCapacity, isDoseOutOfRange, etc.), updating node
    borders/icons accordingly.

  3. Testing coverage

  - Backend: add an integration test hitting /api/simulate with Postgres fixture (use docker-compose Postgres). Use transactional rollback or fresh DB
    per test session. Assert mass balance ≈100%, warnings/errors as expected. Ensure tests run after alembic upgrade head.
  - Frontend: add a Vitest + React Testing Library test that mounts the forms (with store/provider), mocks simulate API, sets inputs, triggers
    simulate, and asserts results and warnings render. Include a test for validation errors blocking simulate.

  4. Graph/solver readiness (flagged)

  - Enforce typed port validation on the frontend: use the port definitions from graph.ts to block/flag invalid edge creation in React Flow (no-op in
    current fixed layout, but ready for future palette).
  - In the solver/iterative scaffold, return a clear error when cycles are detected and enable_recycles is false. Surface that error in /simulate
    responses.
  - Add a feature flag (enable_recycles) in config; keep UI unchanged for now.

  5. Deployment hygiene & auth stub

  - Add a minimal auth stub to backend: accept an Authorization header (static token from env) and reject if missing/invalid; document this. Prepare
    schema fields for future tenant_id (optional) in ProjectModel/JarTestModel and Pydantic models, defaulting to null.
  - Update README/execution docs with health checks, env vars, and Postgres service profile for CI; ensure docker-compose includes a test profile for
    running backend tests.