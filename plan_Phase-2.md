1. Align data contracts front/back

  - Update backend schemas (backend/app/api/schemas.py, backend/app/models/project.py) and frontend types
    (frontend/src/types/index.ts) to match exactly:
      - Use jar_test_id everywhere (remove linked_jar_test_id on the frontend).
      - Include polymer_split_cake in dewatering parameters end-to-end.
      - Settings include polymer_price_per_kg, operating_hours_per_day, and currency.
  - Update API client typings and requests (frontend/src/api/client.ts) accordingly.
  - Update Zustand defaults and parameter updates (frontend/src/store/useStore.ts) to include
    polymer_split_cake and the renamed jar test field.
  - Acceptance: round-trip a project from backend → frontend → save → reload without shape mismatches;
    TypeScript passes; backend validation passes.

  2. Postgres (Cloud SQL) integration for persistence (backend)

  - Add dependencies: sqlalchemy>=2.x, asyncpg, alembic to backend/requirements.txt. Use async SQLAlchemy with
    asyncpg.
  - Config (backend/app/config.py): add database_url env (e.g., postgresql+asyncpg://USER:PASS@HOST:PORT/DB),
    cloud_sql_instance if using the Cloud SQL Proxy, and a use_proxy flag.
  - Create backend/app/db/database.py with async engine/sessionmaker, a Base model, and lifespan startup/
    shutdown hooks to create tables (or run Alembic migrations if present).
  - Create SQLAlchemy models for Project and JarTest matching Pydantic models; for nested structures
    (plant_configuration, doses, analysis), store JSONB columns.
  - Refactor backend/app/api/routes/projects.py and jar_tests.py to use async DB sessions (dependency-injected)
    instead of in-memory dicts: CRUD with SQLAlchemy, UUIDs for projects, JT-YYYY-XXX IDs for jar tests (store
    as string).
  - Seed data: on startup, upsert existing seed jar tests/projects into Postgres if not present (backend/app/
    db/seed_data.py calling DB layer).
  - Local/dev: document using Cloud SQL Auth Proxy or a local Postgres container; update docker-compose.yml to
    include a Postgres service for local dev with matching env vars.
  - Acceptance: with local Postgres running, GET/POST/PUT/DELETE on projects/jar-tests persist; /simulate
    fetches jar test by ID from DB; no in-memory globals remain.

  3. Save/Load UI wiring (frontend)

  - Implement Save/Load dialogs using existing hooks (frontend/src/hooks/useProject.ts) and header buttons in
    frontend/src/App.tsx:
      - Save: if no current project, open modal to name/describe, then create; if existing, update in place.
      - Load: list projects from API (paginated), select to load; delete with confirm.
  - Persist current configuration in localStorage as a draft and hydrate on load if no current project.
  - Acceptance: user can save a new project, reload page, load it back, and see canvas/forms populated; delete
    works; draft survives refresh.

  4. Validation feedback before simulate

  - Backend: ensure /api/simulate/validate returns structured errors (paths + messages) via a shared validator;
    reuse parameter validators.
  - Frontend: on blur/debounce, call validate; surface errors inline in forms and in a summary banner; block or
    confirm simulate when invalid.
  - Acceptance: invalid inputs show immediate inline messages and prevent/confirm simulate; API not spammed
    (debounced).

  5. Warning system and jar-test range checks

  - Backend: extend solver warnings to include dose outside jar-test acceptable range; keep over-capacity, low/
    high dose, low capture, low/high cake dryness, high liquid TSS, mass balance deviation.
  - Frontend: display warning badge on Simulate button after run; show warnings list in ResultsPanel; highlight
    nodes that triggered warnings (e.g., dewatering node border yellow if over capacity).
  - Acceptance: with feed flow > max_flow or dose outside range, warnings appear in response and UI; node
    highlight matches warning type.

  6. Settings & cost + exports

  - Add Settings modal with fields: polymer price, currency (USD/BRL/EUR), operating hours/day. Store in
    Zustand (plantConfiguration.settings) and persist with project save/load.
  - Pass settings into simulate payload; show cost KPIs in ResultsPanel when price set.
  - Export: add “Export Results (JSON/CSV)” and “Export Project (JSON)” actions; implement CSV flattening on
    frontend and download via Blob.
  - Acceptance: changing settings updates KPI cost outputs; exports download correct data.

  7. Keyboard shortcuts and loading/skeleton polish

  - Implement shortcuts: Ctrl/Cmd+Enter simulate, Ctrl/Cmd+S save, Ctrl/Cmd+O load, Esc deselect/close modal, ?
    opens shortcuts modal. Centralize in a hook.
  - Add skeleton/loading states: initial app load, simulate in-flight (canvas pulse, results skeleton), project
    load overlay.
  - Acceptance: shortcuts work across platforms (guard inputs); visible skeletons during async ops.

  8. Testing (backend & frontend)

  - Backend: add integration test hitting /simulate with seed jar test and typical plant; use a test Postgres
    (local container) and transactional rollbacks/fixtures; ensure mass balance ≈100% and warnings/errors
    behave. Keep existing unit tests green.
  - Frontend: add a Vitest + React Testing Library test that mounts forms, triggers simulate via mocked API,
    and asserts results render and warnings show.
  - Acceptance: pytest and npm test pass locally; tests do not require real Cloud SQL (use local Postgres
    container).

  9. Graph and solver prep (post-MVP scaffolding)

  - Add typed ports to plant definition schema (backend and TS types) and enforce connection validation on
    the frontend (edge creation blocked if types mismatch). Keep current fixed topology but structure for
    extensibility.
  - Add solver scaffold for recycles: implement cycle detection and a placeholder iterative solver class with
    tolerances and max iterations, feature-flagged; no UI exposure yet.
  - Acceptance: schema supports port typing; solver detects cycles and returns a clear error/warning instead of
    crashing; UI prevents invalid edges.

  Cloud SQL specifics to include in infra/docs

  - Env vars: DATABASE_URL (for local/testing), CLOUD_SQL_CONNECTION_NAME, DB_USER, DB_PASS, DB_NAME,
    USE_CLOUD_SQL_PROXY=true (optional).
  - Local dev: add Postgres service to docker-compose.yml with matching creds; document alembic upgrade head or
    auto-create tables on startup.
  - GCP deploy: use Cloud SQL Auth Proxy sidecar or Connector; ensure SQLAlchemy URL uses the private IP/
    localhost via proxy. Document how to run migrations in that environment.