# Claude Code Prompts: Sludge Dewatering Simulation MVP

This document contains all the prompts you need to pass to Claude Code to build your sludge dewatering simulation platform. Execute them in order, phase by phase.

---

## Phase 0: Project Scaffolding & Initial Setup

### Prompt 0.1: Initialize Project Structure

```
Create a full-stack monorepo for a sludge dewatering simulation platform called "SludgeSim" with the following structure:

sludge-sim/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config.py               # Settings and configuration
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── stream.py           # Stream dataclass
│   │   │   ├── equipment.py        # Equipment models
│   │   │   ├── jar_test.py         # JarTest model
│   │   │   └── project.py          # Project/plant configuration
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   ├── feed_source.py      # Feed stream creation
│   │   │   ├── polymer_conditioner.py  # Polymer dosing logic
│   │   │   ├── dewatering_unit.py  # Dewatering mass balance
│   │   │   ├── solver.py           # Main simulation solver
│   │   │   └── kpis.py             # KPI calculations
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── simulate.py     # POST /simulate endpoint
│   │   │   │   ├── projects.py     # Project CRUD endpoints
│   │   │   │   └── jar_tests.py    # JarTest CRUD endpoints
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   └── db/
│   │       ├── __init__.py
│   │       └── database.py         # Database connection (SQLite for MVP)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_stream.py
│   │   ├── test_engine.py
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   ├── FlowCanvas.tsx      # React Flow canvas
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── FeedNode.tsx
│   │   │   │   │   ├── PolymerNode.tsx
│   │   │   │   │   └── DewateringNode.tsx
│   │   │   │   └── edges/
│   │   │   │       └── StreamEdge.tsx
│   │   │   ├── panels/
│   │   │   │   ├── PropertiesPanel.tsx
│   │   │   │   └── ResultsPanel.tsx
│   │   │   ├── forms/
│   │   │   │   ├── FeedForm.tsx
│   │   │   │   ├── PolymerForm.tsx
│   │   │   │   └── DewateringForm.tsx
│   │   │   └── ui/
│   │   │       └── (shadcn components)
│   │   ├── hooks/
│   │   │   ├── useSimulation.ts
│   │   │   └── useProject.ts
│   │   ├── stores/
│   │   │   └── plantStore.ts       # Zustand store
│   │   ├── api/
│   │   │   └── client.ts           # API client
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript types
│   │   └── lib/
│   │       └── utils.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml
├── .gitignore
└── README.md

Use:
- Backend: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy (SQLite for MVP)
- Frontend: React 18, TypeScript, Vite, React Flow, Zustand, TanStack Query, Tailwind CSS, shadcn/ui

Create all the files with proper imports and placeholder implementations. Include proper type hints throughout.
```

### Prompt 0.2: Backend Dependencies Setup

```
In the backend/ directory, create a complete requirements.txt with these dependencies:

fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
sqlalchemy>=2.0.25
aiosqlite>=0.19.0
python-multipart>=0.0.6
httpx>=0.26.0
pytest>=7.4.0
pytest-asyncio>=0.23.0

Also create a pyproject.toml with proper project metadata for "sludge-sim-backend" version 0.1.0.
```

### Prompt 0.3: Frontend Dependencies Setup

```
In the frontend/ directory, initialize the package.json with these dependencies:

Dependencies:
- react: ^18.2.0
- react-dom: ^18.2.0
- @xyflow/react: ^12.0.0 (React Flow v12)
- zustand: ^4.5.0
- @tanstack/react-query: ^5.17.0
- axios: ^1.6.0
- lucide-react: ^0.312.0
- clsx: ^2.1.0
- tailwind-merge: ^2.2.0

Dev Dependencies:
- typescript: ^5.3.0
- vite: ^5.0.0
- @vitejs/plugin-react: ^4.2.0
- tailwindcss: ^3.4.0
- postcss: ^8.4.0
- autoprefixer: ^10.4.0
- @types/react: ^18.2.0
- @types/react-dom: ^18.2.0

Configure Vite for React with TypeScript and set up Tailwind CSS with a professional color palette suitable for industrial/engineering software (slate grays, blue accents, clear status colors for warnings/errors).
```

---

## Phase 1: Backend Core Models & Engine (Weeks 1-2)

### Prompt 1.1: Stream Model Implementation

```
Implement the Stream model in backend/app/models/stream.py:

Create a Python dataclass called Stream with these exact fields:
- id: str (e.g., "feed_1", "cake_1")
- mass_flow_kg_h: float (total mass flow, kg/h)
- dry_solids_mass_flow_kg_h: float (dry solids mass flow, kg/h)
- polymer_mass_flow_kg_h: float (active polymer, kg/h, default 0.0)
- temperature_C: float (default 20.0)

Add these calculated properties:
1. dry_solids_fraction: returns dry_solids_mass_flow_kg_h / mass_flow_kg_h (handle division by zero)
2. density_kg_m3: returns 1000.0 + 300.0 * dry_solids_fraction (simple approximation)
3. volumetric_flow_m3_h: returns mass_flow_kg_h / density_kg_m3
4. polymer_dose_ppm: returns (polymer_mass_flow_kg_h * 1e6) / (volumetric_flow_m3_h * 1000.0) - approximate mg/L

Also add:
- A to_dict() method for JSON serialization
- A from_dict() classmethod for deserialization
- Proper docstrings explaining each field and property

Include comprehensive type hints using Python's typing module.
```

### Prompt 1.2: Feed Source Engine

```
Implement the feed source logic in backend/app/engine/feed_source.py:

Create a function called make_feed_stream with these parameters:
- flow_m3_h: float (volumetric flow in m³/h)
- ts_percent: float (total solids percentage, e.g., 3.0 for 3%)
- temperature_C: float = 20.0
- stream_id: str = "feed"

The function should:
1. Calculate density as 1000.0 kg/m³ (assume water-like for MVP)
2. Calculate mass_flow_kg_h = flow_m3_h * density
3. Calculate dry_solids_mass_flow_kg_h = mass_flow_kg_h * (ts_percent / 100.0)
4. Return a Stream object with polymer_mass_flow_kg_h = 0.0

Include validation:
- Raise ValueError if flow_m3_h < 0
- Raise ValueError if ts_percent < 0 or > 100

Add docstrings with usage examples.
```

### Prompt 1.3: Polymer Conditioner Engine

```
Implement the polymer conditioning logic in backend/app/engine/polymer_conditioner.py:

Create a function called apply_polymer with these parameters:
- feed: Stream (the input stream)
- jar_dose_ppm: float (optimum dose from jar test)
- shear_factor: float (equipment empirical factor, typically 1.0-1.5)
- safety_factor: float (margin, typically 1.0-1.2)
- stream_id: str = "conditioned"

The function should:
1. Calculate effective_ppm = jar_dose_ppm * shear_factor * safety_factor
2. Get volumetric flow from feed.volumetric_flow_m3_h
3. Convert ppm to kg/h: polymer_kg_h = effective_ppm * vol_flow_m3_h * 1000.0 / 1e6
4. Return a NEW Stream object (don't mutate the input) with:
   - Same mass_flow_kg_h as feed
   - Same dry_solids_mass_flow_kg_h as feed
   - New polymer_mass_flow_kg_h
   - Same temperature_C as feed
   - New stream_id

Include validation:
- Raise ValueError if jar_dose_ppm < 0
- Raise ValueError if shear_factor <= 0
- Raise ValueError if safety_factor <= 0

Add a helper function get_effective_dose_ppm(jar_dose_ppm, shear_factor, safety_factor) for use in displays.
```

### Prompt 1.4: Dewatering Unit Engine

```
Implement the dewatering unit logic in backend/app/engine/dewatering_unit.py:

Create a function called dewatering_unit with these parameters:
- feed: Stream (conditioned sludge input)
- capture_rate: float (fraction of solids to cake, e.g., 0.95)
- cake_dryness_percent: float (% dry solids in cake, e.g., 23.0)
- polymer_split_cake: float = 0.3 (fraction of polymer going to cake)
- cake_stream_id: str = "cake"
- liquid_stream_id: str = "liquid"

Returns: Tuple[Stream, Stream] (cake_stream, liquid_stream)

Implement this mass balance:
1. solids_in = feed.dry_solids_mass_flow_kg_h
2. water_in = feed.mass_flow_kg_h - solids_in
3. solids_to_cake = solids_in * capture_rate
4. solids_to_liquid = solids_in - solids_to_cake
5. cake_ds_frac = cake_dryness_percent / 100.0
6. cake_mass_flow_kg_h = solids_to_cake / cake_ds_frac
7. cake_water_kg_h = cake_mass_flow_kg_h - solids_to_cake
8. liquid_water_kg_h = water_in - cake_water_kg_h
9. liquid_mass_flow_kg_h = liquid_water_kg_h + solids_to_liquid
10. Split polymer between cake and liquid using polymer_split_cake

Create the two output Stream objects and return them.

Include validation:
- Raise ValueError if capture_rate not in (0, 1]
- Raise ValueError if cake_dryness_percent not in (0, 100]
- Raise ValueError if polymer_split_cake not in [0, 1]
- Raise ValueError if calculated cake_water_kg_h > water_in (would mean negative liquid water - physically impossible)
```

### Prompt 1.5: KPI Calculations

```
Implement KPI calculations in backend/app/engine/kpis.py:

Create a function called compute_kpis with these parameters:
- feed: Stream
- conditioned: Stream
- cake: Stream
- liquid: Stream
- polymer_price_per_kg: Optional[float] = None
- operating_hours_per_day: float = 24.0

Returns: dict with the following KPIs:

1. Polymer Metrics:
   - polymer_dose_ppm: effective dose in the conditioned stream
   - polymer_kg_per_tDS: kg polymer per metric ton of dry solids processed
   - polymer_kg_per_day: daily polymer consumption
   - polymer_kg_per_month: monthly polymer consumption (30 days)
   - polymer_cost_per_day: if price provided
   - polymer_cost_per_month: if price provided

2. Cake Metrics:
   - cake_dryness_percent: actual % DS in cake
   - cake_mass_kg_per_h: total cake mass flow
   - cake_tDS_per_day: tons of dry solids in cake per day
   - cake_wet_tons_per_day: total wet cake per day

3. Liquid Metrics:
   - liquid_tss_estimate_mg_L: approximate TSS in liquid (from solids_to_liquid)
   - liquid_flow_m3_h: volumetric flow of liquid

4. Mass Balance:
   - mass_balance_closure_percent: should be ~100% if balanced
   - solids_capture_actual_percent: actual capture rate achieved

Include a helper function format_kpis_for_display(kpis: dict) -> dict that formats numbers nicely (2 decimal places, thousands separators, etc.)
```

### Prompt 1.6: Main Solver

```
Implement the main solver in backend/app/engine/solver.py:

Create a function called solve_plant with these parameters:
- plant_definition: dict (JSON-like plant configuration)
- jar_test_optimum_ppm: Optional[float] = None (override from jar test)

The plant_definition structure:
{
    "feed_source": {
        "parameters": {
            "flow_m3_h": float,
            "ts_percent": float,
            "temperature_C": float (optional, default 20.0)
        }
    },
    "polymer_conditioner": {
        "parameters": {
            "jar_test_optimum_ppm": float,
            "shear_factor": float,
            "safety_factor": float
        }
    },
    "dewatering_unit": {
        "parameters": {
            "max_flow_m3_h": float,
            "capture_rate": float,
            "cake_dryness_percent": float,
            "polymer_split_cake": float (optional, default 0.3)
        }
    },
    "settings": {
        "polymer_price_per_kg": float (optional),
        "operating_hours_per_day": float (optional, default 24.0)
    }
}

The function should:
1. Validate the plant_definition structure
2. Build the feed stream using make_feed_stream
3. Apply polymer using apply_polymer (use jar_test_optimum_ppm override if provided)
4. Run dewatering_unit to get cake and liquid streams
5. Compute KPIs
6. Return a SimulationResult dict:
{
    "success": true,
    "streams": {
        "feed": {...},
        "conditioned": {...},
        "cake": {...},
        "liquid": {...}
    },
    "kpis": {...},
    "warnings": [],  # List of warning messages
    "errors": []     # List of error messages
}

Add warnings for:
- Feed flow exceeds max_flow_m3_h of dewatering unit
- Very high or low polymer doses (outside typical 5-50 ppm range)

Handle errors gracefully and return them in the errors list rather than raising exceptions.
```

### Prompt 1.7: JarTest Model

```
Implement the JarTest model in backend/app/models/jar_test.py:

Create a Pydantic model called JarTestDose:
- dose_ppm: float
- supernatant_tss_mg_L: Optional[float] = None
- cst_s: Optional[float] = None (capillary suction time in seconds)
- floc_score: Optional[int] = None (1-5 scale)

Create a Pydantic model called JarTestSample:
- source: str (e.g., "Primary sludge")
- initial_ts_percent: float

Create a Pydantic model called JarTestPolymer:
- name: str (e.g., "PAM-855")
- type: str (e.g., "cationic", "anionic", "nonionic")

Create a Pydantic model called JarTestAnalysis:
- optimum_dose_ppm: float
- acceptable_range_min_ppm: Optional[float] = None
- acceptable_range_max_ppm: Optional[float] = None

Create the main JarTest model:
- id: str
- date: date
- sample: JarTestSample
- polymer: JarTestPolymer
- doses: List[JarTestDose]
- analysis: JarTestAnalysis
- notes: Optional[str] = None
- created_at: datetime
- updated_at: datetime

Add a method to validate that optimum_dose_ppm is within the acceptable range if specified.

Also create SQLAlchemy models for database persistence (use JSONB-like storage for the nested structures in SQLite using JSON columns).
```

### Prompt 1.8: Project Model

```
Implement the Project model in backend/app/models/project.py:

Create a Pydantic model called PlantConfiguration:
- feed_source: dict (parameters for feed)
- polymer_conditioner: dict (parameters for polymer)
- dewatering_unit: dict (parameters for dewatering)
- settings: dict (polymer price, operating hours, etc.)

Create the main Project model:
- id: str (UUID)
- name: str
- description: Optional[str] = None
- plant_configuration: PlantConfiguration
- jar_test_id: Optional[str] = None (reference to linked jar test)
- created_at: datetime
- updated_at: datetime

Also create SQLAlchemy models for database persistence.

Add validation for the plant_configuration to ensure all required fields are present.
```

### Prompt 1.9: API Schemas

```
Create all Pydantic schemas for the API in backend/app/api/schemas.py:

Request Schemas:
1. SimulateRequest:
   - plant_definition: dict
   - jar_test_id: Optional[str] = None
   - jar_test_optimum_ppm: Optional[float] = None

2. ProjectCreate:
   - name: str
   - description: Optional[str]
   - plant_configuration: dict

3. ProjectUpdate:
   - name: Optional[str]
   - description: Optional[str]
   - plant_configuration: Optional[dict]
   - jar_test_id: Optional[str]

4. JarTestCreate:
   - date: date
   - sample: JarTestSample
   - polymer: JarTestPolymer
   - doses: List[JarTestDose]
   - analysis: JarTestAnalysis
   - notes: Optional[str]

Response Schemas:
1. StreamResponse (from Stream.to_dict())

2. SimulationResponse:
   - success: bool
   - streams: Dict[str, StreamResponse]
   - kpis: dict
   - warnings: List[str]
   - errors: List[str]

3. ProjectResponse:
   - id: str
   - name: str
   - description: Optional[str]
   - plant_configuration: dict
   - jar_test_id: Optional[str]
   - created_at: datetime
   - updated_at: datetime

4. JarTestResponse (full jar test data)

5. ProjectListResponse:
   - items: List[ProjectResponse]
   - total: int

Use Pydantic v2 syntax with model_config for JSON serialization settings.
```

### Prompt 1.10: API Routes - Simulate

```
Implement the simulation endpoint in backend/app/api/routes/simulate.py:

Create a FastAPI router with:

POST /simulate
- Request body: SimulateRequest
- Response: SimulationResponse
- Logic:
  1. If jar_test_id provided, fetch the jar test and use its optimum_dose_ppm
  2. Call solve_plant with the plant_definition
  3. Return the simulation results

Include proper error handling:
- 400 Bad Request for validation errors
- 404 Not Found if jar_test_id doesn't exist
- 500 Internal Server Error for unexpected errors

Add OpenAPI documentation with examples.
```

### Prompt 1.11: API Routes - Projects

```
Implement project CRUD endpoints in backend/app/api/routes/projects.py:

Create a FastAPI router with:

GET /projects
- Query params: skip, limit (pagination)
- Response: ProjectListResponse

GET /projects/{project_id}
- Response: ProjectResponse
- 404 if not found

POST /projects
- Request: ProjectCreate
- Response: ProjectResponse
- Generate UUID for id
- Set created_at and updated_at

PUT /projects/{project_id}
- Request: ProjectUpdate
- Response: ProjectResponse
- Update updated_at
- 404 if not found

DELETE /projects/{project_id}
- Response: 204 No Content
- 404 if not found

For MVP, use an in-memory dictionary to store projects. Add a TODO comment for database integration.
```

### Prompt 1.12: API Routes - JarTests

```
Implement jar test CRUD endpoints in backend/app/api/routes/jar_tests.py:

Create a FastAPI router with:

GET /jar-tests
- Query params: skip, limit (pagination)
- Response: List of JarTestResponse

GET /jar-tests/{jar_test_id}
- Response: JarTestResponse
- 404 if not found

POST /jar-tests
- Request: JarTestCreate
- Response: JarTestResponse
- Generate ID like "JT-YYYY-XXX" where YYYY is year and XXX is sequential

PUT /jar-tests/{jar_test_id}
- Request: partial update
- Response: JarTestResponse
- 404 if not found

DELETE /jar-tests/{jar_test_id}
- Response: 204 No Content
- 404 if not found

For MVP, use an in-memory dictionary. Add seed data with 2-3 example jar tests for testing.
```

### Prompt 1.13: FastAPI Main App

```
Implement the FastAPI application in backend/app/main.py:

Create the FastAPI app with:
- Title: "SludgeSim API"
- Description: "Sludge Dewatering Simulation Platform API"
- Version: "0.1.0"

Configure:
- CORS middleware (allow localhost:5173 for Vite dev server)
- Include all routers with appropriate prefixes:
  - /api/simulate
  - /api/projects
  - /api/jar-tests

Add a health check endpoint:
GET /health -> {"status": "healthy"}

Add a root endpoint:
GET / -> {"message": "Welcome to SludgeSim API", "docs": "/docs"}

Include lifespan context manager for startup/shutdown events (prepare for database connections later).
```

### Prompt 1.14: Unit Tests - Stream and Engine

```
Create comprehensive unit tests in backend/tests/:

test_stream.py:
- Test Stream initialization with valid values
- Test all computed properties (dry_solids_fraction, density, volumetric_flow, polymer_dose_ppm)
- Test edge cases (zero flow, zero solids)
- Test to_dict() and from_dict() round-trip

test_engine.py:
- Test make_feed_stream with typical values (100 m³/h, 3% TS)
- Test make_feed_stream validation (negative flow, invalid TS)
- Test apply_polymer with known jar test dose
- Test that apply_polymer doesn't mutate input
- Test dewatering_unit mass balance closes (inputs = outputs)
- Test dewatering_unit with various capture rates
- Test compute_kpis produces expected values
- Test solve_plant end-to-end with a complete plant definition

test_api.py:
- Test POST /simulate with valid plant definition
- Test POST /simulate with missing fields (expect 422)
- Test GET /health returns 200
- Test project CRUD operations
- Test jar test CRUD operations

Use pytest-asyncio for async tests. Include fixtures for common test data.
```

### Prompt 1.15: Seed Data

```
Create a seed data module in backend/app/db/seed_data.py:

Create example data for testing and demos:

1. Example Jar Tests (3):
   - JT-2024-001: Primary sludge, PAM-855 cationic, doses 10/15/20 ppm, optimum 15 ppm
   - JT-2024-002: Secondary sludge, PAM-810 anionic, doses 8/12/16 ppm, optimum 12 ppm  
   - JT-2024-003: Mixed sludge, PAM-855 cationic, doses 12/18/24 ppm, optimum 18 ppm

2. Example Projects (2):
   - "Sabesp Demo Plant": 100 m³/h, 2.8% TS, linked to JT-2024-001
   - "Compesa Pilot": 50 m³/h, 3.5% TS, linked to JT-2024-002

3. Default Plant Configuration Template:
   - Feed: 100 m³/h, 3.0% TS, 20°C
   - Polymer: 15 ppm, shear 1.2, safety 1.1
   - Dewatering: 40 m³/h max, 95% capture, 23% cake DS

Create a function load_seed_data() that populates the in-memory stores.
```

---

## Phase 2: Frontend Core (Weeks 3-4)

### Prompt 2.1: TypeScript Types

```
Create comprehensive TypeScript types in frontend/src/types/index.ts:

// Stream types
interface Stream {
  id: string;
  mass_flow_kg_h: number;
  dry_solids_mass_flow_kg_h: number;
  polymer_mass_flow_kg_h: number;
  temperature_C: number;
  // Computed (from API)
  dry_solids_fraction?: number;
  density_kg_m3?: number;
  volumetric_flow_m3_h?: number;
  polymer_dose_ppm?: number;
}

// Equipment types
interface FeedSourceParams {
  flow_m3_h: number;
  ts_percent: number;
  temperature_C: number;
}

interface PolymerConditionerParams {
  jar_test_optimum_ppm: number;
  shear_factor: number;
  safety_factor: number;
}

interface DewateringUnitParams {
  max_flow_m3_h: number;
  capture_rate: number;
  cake_dryness_percent: number;
  polymer_split_cake: number;
}

interface PlantConfiguration {
  feed_source: { parameters: FeedSourceParams };
  polymer_conditioner: { parameters: PolymerConditionerParams };
  dewatering_unit: { parameters: DewateringUnitParams };
  settings: {
    polymer_price_per_kg?: number;
    operating_hours_per_day: number;
  };
}

// Jar Test types
interface JarTestDose {
  dose_ppm: number;
  supernatant_tss_mg_L?: number;
  cst_s?: number;
  floc_score?: number;
}

interface JarTest {
  id: string;
  date: string;
  sample: { source: string; initial_ts_percent: number };
  polymer: { name: string; type: string };
  doses: JarTestDose[];
  analysis: {
    optimum_dose_ppm: number;
    acceptable_range_min_ppm?: number;
    acceptable_range_max_ppm?: number;
  };
}

// Project types
interface Project {
  id: string;
  name: string;
  description?: string;
  plant_configuration: PlantConfiguration;
  jar_test_id?: string;
  created_at: string;
  updated_at: string;
}

// Simulation types
interface SimulationKPIs {
  polymer_dose_ppm: number;
  polymer_kg_per_tDS: number;
  polymer_kg_per_day: number;
  polymer_kg_per_month: number;
  polymer_cost_per_day?: number;
  polymer_cost_per_month?: number;
  cake_dryness_percent: number;
  cake_mass_kg_per_h: number;
  cake_tDS_per_day: number;
  cake_wet_tons_per_day: number;
  liquid_tss_estimate_mg_L: number;
  liquid_flow_m3_h: number;
  mass_balance_closure_percent: number;
  solids_capture_actual_percent: number;
}

interface SimulationResult {
  success: boolean;
  streams: Record<string, Stream>;
  kpis: SimulationKPIs;
  warnings: string[];
  errors: string[];
}

// React Flow node types
type EquipmentNodeType = 'feed' | 'polymer' | 'dewatering';

interface EquipmentNodeData {
  type: EquipmentNodeType;
  label: string;
  parameters: FeedSourceParams | PolymerConditionerParams | DewateringUnitParams;
  isSelected?: boolean;
}

Export all types.
```

### Prompt 2.2: Zustand Store

```
Create the Zustand store in frontend/src/stores/plantStore.ts:

Use Zustand with TypeScript to manage:

State:
- nodes: Node<EquipmentNodeData>[] (React Flow nodes)
- edges: Edge[] (React Flow edges)
- selectedNodeId: string | null
- plantConfiguration: PlantConfiguration
- currentProject: Project | null
- simulationResult: SimulationResult | null
- isSimulating: boolean
- jarTests: JarTest[]
- selectedJarTestId: string | null

Actions:
- initializeDefaultPlant(): Set up the default 3-node layout
- updateNodeParameters(nodeId: string, params: Partial<any>): Update equipment params
- selectNode(nodeId: string | null): Set selected node
- setPlantConfiguration(config: PlantConfiguration): Update full config
- setSimulationResult(result: SimulationResult | null): Store results
- setIsSimulating(value: boolean): Loading state
- setCurrentProject(project: Project | null): Current working project
- loadProject(project: Project): Load a project into the canvas
- resetToDefault(): Clear and reset everything
- setJarTests(tests: JarTest[]): Store available jar tests
- selectJarTest(id: string | null): Select a jar test

The store should automatically sync node parameters with plantConfiguration when either changes.

Use immer middleware for easier state updates.
```

### Prompt 2.3: API Client

```
Create the API client in frontend/src/api/client.ts:

Use axios with TypeScript:

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

Create typed API functions:

// Simulation
async function simulate(
  plantDefinition: PlantConfiguration,
  jarTestId?: string,
  jarTestOptimumPpm?: number
): Promise<SimulationResult>

// Projects
async function getProjects(skip?: number, limit?: number): Promise<{ items: Project[]; total: number }>
async function getProject(id: string): Promise<Project>
async function createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project>
async function updateProject(id: string, data: Partial<Project>): Promise<Project>
async function deleteProject(id: string): Promise<void>

// Jar Tests
async function getJarTests(): Promise<JarTest[]>
async function getJarTest(id: string): Promise<JarTest>
async function createJarTest(data: Omit<JarTest, 'id'>): Promise<JarTest>

Include error handling that extracts error messages from API responses.
Add request/response interceptors for logging in development.
```

### Prompt 2.4: Custom Hooks

```
Create custom hooks in frontend/src/hooks/:

useSimulation.ts:
- Use TanStack Query mutation for the simulate endpoint
- Track loading state, error state
- Automatically update the store with results
- Return { simulate, isSimulating, error, result }

useProject.ts:
- Use TanStack Query for project CRUD
- Queries: useProjects(), useProject(id)
- Mutations: useCreateProject(), useUpdateProject(), useDeleteProject()
- Handle optimistic updates for better UX
- Return appropriate loading/error states

useJarTests.ts:
- Use TanStack Query for jar test data
- Query: useJarTests()
- Auto-fetch on mount
- Return { jarTests, isLoading, error }

All hooks should integrate with the Zustand store where appropriate.
```

### Prompt 2.5: React Flow Custom Nodes - Feed

```
Create the Feed node component in frontend/src/components/canvas/nodes/FeedNode.tsx:

Create a custom React Flow node for the feed source:

Visual Design:
- Industrial/engineering aesthetic (not generic)
- Icon: Use lucide-react Droplets or similar
- Color: Blue/cyan theme for water/liquid
- Size: ~180px wide, ~100px tall
- Show key values on the node face:
  - Flow: X m³/h
  - TS: X.X%

Features:
- Visual indicator when selected (border highlight)
- Hover state with subtle shadow
- Connection handle on the right side (output only)
- Proper typing with React Flow's NodeProps

Style with Tailwind CSS:
- Rounded corners
- Subtle shadow
- Clean typography
- Professional appearance suitable for engineering software

Include proper memo() for performance.
```

### Prompt 2.6: React Flow Custom Nodes - Polymer

```
Create the Polymer node component in frontend/src/components/canvas/nodes/PolymerNode.tsx:

Create a custom React Flow node for the polymer conditioner:

Visual Design:
- Icon: Use lucide-react FlaskConical or Beaker
- Color: Purple/violet theme for chemicals
- Size: ~180px wide, ~100px tall
- Show key values on the node face:
  - Dose: X ppm
  - Shear: X.X
  - Safety: X.X

Features:
- Visual indicator when selected
- Hover state
- Connection handles: left (input), right (output)
- Show effective dose (dose × shear × safety) as calculated value

Style with Tailwind CSS, consistent with FeedNode but different color theme.
```

### Prompt 2.7: React Flow Custom Nodes - Dewatering

```
Create the Dewatering node component in frontend/src/components/canvas/nodes/DewateringNode.tsx:

Create a custom React Flow node for the dewatering unit:

Visual Design:
- Icon: Use lucide-react Factory or Cog
- Color: Orange/amber theme for equipment
- Size: ~180px wide, ~120px tall (slightly taller for 2 outputs)
- Show key values on the node face:
  - Capture: X%
  - Cake DS: X%
  - Max Flow: X m³/h

Features:
- Visual indicator when selected
- Hover state
- Connection handles:
  - Left: 1 input (sludge_in)
  - Right top: output (cake_out) - labeled "Cake"
  - Right bottom: output (liquid_out) - labeled "Liquid"

Style with Tailwind CSS, consistent with other nodes.

Add visual warning indicator (e.g., yellow border) if results show the feed flow exceeds max_flow_m3_h.
```

### Prompt 2.8: Stream Edge Component

```
Create a custom edge component in frontend/src/components/canvas/edges/StreamEdge.tsx:

Create a custom React Flow edge for stream connections:

Features:
- Animated flow direction (subtle moving dashes)
- Color coding based on stream type:
  - Feed stream: blue
  - Conditioned stream: purple
  - Cake stream: orange/brown
  - Liquid stream: light blue/cyan
- Show stream info on hover (or always if space permits):
  - Flow rate
  - Solids %
- Smooth bezier curve

Use React Flow's BaseEdge or BezierEdge as base.

Style with CSS animations for the flow effect (subtle, not distracting).
```

### Prompt 2.9: Flow Canvas Component

```
Create the main canvas component in frontend/src/components/canvas/FlowCanvas.tsx:

Features:
- React Flow canvas with custom node types registered
- Default layout: horizontal flow (Feed → Polymer → Dewatering)
- Controls: zoom, fit view, mini-map (optional)
- Background: subtle grid or dots pattern
- Handle node selection (update store)
- Handle edge connections (prevent invalid connections in MVP)

Default Node Layout:
const defaultNodes = [
  { id: 'feed', type: 'feed', position: { x: 50, y: 150 }, data: { ... } },
  { id: 'polymer', type: 'polymer', position: { x: 300, y: 150 }, data: { ... } },
  { id: 'dewatering', type: 'dewatering', position: { x: 550, y: 150 }, data: { ... } },
];

const defaultEdges = [
  { id: 'e1', source: 'feed', target: 'polymer', type: 'stream' },
  { id: 'e2', source: 'polymer', target: 'dewatering', type: 'stream' },
];

For MVP: Lock the topology (no adding/removing nodes or edges). Just allow parameter editing.

Include proper React Flow Provider setup.
```

### Prompt 2.10: Properties Panel

```
Create the properties panel in frontend/src/components/panels/PropertiesPanel.tsx:

This panel appears on the right side when a node is selected.

Features:
- Header showing selected equipment name and icon
- Form fields appropriate to the equipment type:
  - Feed: flow_m3_h, ts_percent, temperature_C
  - Polymer: jar_test_optimum_ppm (or dropdown to select jar test), shear_factor, safety_factor
  - Dewatering: max_flow_m3_h, capture_rate, cake_dryness_percent, polymer_split_cake
- Input validation with immediate feedback
- Changes update the store in real-time (debounced)
- Close button to deselect

For Polymer form:
- Include a dropdown to select from available jar tests
- When selected, auto-populate jar_test_optimum_ppm from the jar test's analysis
- Show the jar test details (polymer name, date) when selected

Use shadcn/ui components: Input, Label, Select, Slider (for percentages), Button.

Style with Tailwind for a clean, professional look.
```

### Prompt 2.11: Form Components

```
Create individual form components in frontend/src/components/forms/:

FeedForm.tsx:
- Fields:
  - Flow (m³/h): number input, min 0, step 1
  - Total Solids (%): number input, min 0, max 100, step 0.1
  - Temperature (°C): number input, default 20
- Validation messages below each field

PolymerForm.tsx:
- Fields:
  - Jar Test: dropdown select (shows "PAM-855 (15 ppm)" format)
  - -or- Manual Dose (ppm): number input (shown if no jar test selected)
  - Shear Factor: number input, min 1.0, max 2.0, step 0.1, default 1.2
  - Safety Factor: number input, min 1.0, max 1.5, step 0.05, default 1.1
- Show calculated effective dose: dose × shear × safety

DewateringForm.tsx:
- Fields:
  - Max Flow (m³/h): number input for equipment capacity
  - Capture Rate (%): slider 80-100, step 1
  - Cake Dryness (%): slider 15-35, step 0.5
  - Polymer Split to Cake (%): slider 0-100, step 5, default 30
- Warning if current feed flow > max flow

Each form should:
- Use controlled inputs
- Call store update on change (debounced 300ms)
- Show units clearly
- Have sensible defaults
```

### Prompt 2.12: Results Panel

```
Create the results panel in frontend/src/components/panels/ResultsPanel.tsx:

This panel shows simulation results, displayed below the canvas or as a collapsible sidebar.

Sections:

1. Header:
   - "Simulation Results" title
   - Last run timestamp
   - Success/Error indicator

2. Mass Balance Summary (table):
   | Stream | Flow (m³/h) | DS (%) | Solids (kg/h) | Polymer (ppm) |
   |--------|-------------|--------|---------------|---------------|
   | Feed   | ...         | ...    | ...           | 0             |
   | Cond.  | ...         | ...    | ...           | ...           |
   | Cake   | ...         | ...    | ...           | ...           |
   | Liquid | ...         | ...    | ...           | ...           |

3. Polymer KPIs (cards):
   - Effective Dose: X ppm
   - Consumption: X kg/tDS
   - Daily Usage: X kg/day
   - Monthly Usage: X kg/month
   - Monthly Cost: $X (if price set)

4. Dewatering KPIs (cards):
   - Cake Dryness: X%
   - Cake Production: X wet t/day
   - Dry Solids in Cake: X tDS/day
   - Capture Rate: X%
   - Liquid TSS: X mg/L

5. Warnings/Errors Section:
   - Yellow warning cards for warnings
   - Red error cards for errors

Use shadcn/ui Card, Table components.
Style with a clean grid layout.
Include loading skeleton when isSimulating is true.
```

### Prompt 2.13: Main App Layout

```
Create the main App component in frontend/src/App.tsx:

Layout:
┌─────────────────────────────────────────────────────────┐
│ Header (logo, project name, save/load buttons)          │
├───────────────────────────────────────────┬─────────────┤
│                                           │ Properties  │
│           Flow Canvas                     │ Panel       │
│           (React Flow)                    │ (right)     │
│                                           │             │
├───────────────────────────────────────────┴─────────────┤
│ Results Panel (collapsible)                              │
│ + Simulate Button                                        │
└─────────────────────────────────────────────────────────┘

Header Features:
- Logo/App name: "SludgeSim"
- Current project name (editable)
- Save Project button
- Load Project dropdown/modal
- Settings gear icon (for polymer price, etc.)

Main Area:
- FlowCanvas takes most of the space
- PropertiesPanel on right (collapsible, ~300px wide)
- If no node selected, show "Select equipment to edit"

Bottom Area:
- "Simulate" button (prominent, blue)
- Results panel (collapsible/expandable)
- When collapsed, show summary: "Last run: Cake 23.0% DS, 4.2 tDS/day"

Use TanStack Query provider at root.
Initialize store with default plant on mount.
Fetch jar tests on mount.
```

### Prompt 2.14: Simulate Button & Logic

```
Create a SimulateButton component and integrate simulation logic:

frontend/src/components/SimulateButton.tsx:
- Large, prominent button
- Shows "Simulate" when idle
- Shows spinner + "Simulating..." when loading
- Disabled during simulation
- onClick triggers the simulation

Integration in App.tsx:
When Simulate is clicked:
1. Get current plantConfiguration from store
2. Get selectedJarTestId from store (optional)
3. Call simulate() from useSimulation hook
4. On success: store results, show results panel
5. On error: show error toast/message

Add keyboard shortcut: Ctrl+Enter or Cmd+Enter to simulate.

Show a toast notification:
- Green: "Simulation complete" with summary
- Red: "Simulation failed" with error message
```

### Prompt 2.15: Project Save/Load UI

```
Create project management UI components:

frontend/src/components/ProjectManager.tsx:
- Save button that:
  - If new project: opens name dialog
  - If existing: saves immediately
  - Shows success toast

- Load button that opens a modal with:
  - List of saved projects (from API)
  - Each item shows: name, description, last updated
  - Click to load
  - Delete button (with confirmation)

frontend/src/components/modals/SaveProjectModal.tsx:
- Input for project name
- Textarea for description (optional)
- Save / Cancel buttons

frontend/src/components/modals/LoadProjectModal.tsx:
- List of projects
- Search/filter (optional for MVP)
- Load / Delete actions

When loading a project:
1. Fetch full project from API
2. Update store with project data
3. Reset canvas to match loaded configuration
4. Close modal
```

---

## Phase 3: Polish & Demo Readiness (Weeks 5-6)

### Prompt 3.1: Error Handling & Validation

```
Implement comprehensive error handling throughout the application:

Backend (backend/app/api/error_handlers.py):
- Create custom exception classes:
  - ValidationError (400)
  - NotFoundError (404)
  - SimulationError (422)
- Add exception handlers to FastAPI app
- Return consistent error response format:
  { "detail": "message", "errors": [...], "code": "ERROR_CODE" }

Frontend error handling:
- Create ErrorBoundary component for React
- Add toast notifications for API errors (use sonner or react-hot-toast)
- Form validation errors show inline
- Network errors show retry option

Validation rules to enforce:
- Feed flow > 0
- TS percent 0-100
- Capture rate 0-100
- Cake dryness 1-100 (can't be 0)
- All factors > 0
- Polymer dose >= 0

Show clear error messages that explain what's wrong and how to fix it.
```

### Prompt 3.2: Warning System

```
Implement a warning system for operational concerns:

Backend (add to solver.py):
Add warnings for:
- feed_flow > dewatering_max_flow: "Feed flow (X m³/h) exceeds dewatering capacity (Y m³/h)"
- polymer_dose < 5 ppm: "Very low polymer dose may result in poor flocculation"
- polymer_dose > 50 ppm: "Very high polymer dose - verify jar test results"
- capture_rate < 0.90: "Capture rate below 90% may indicate equipment issues"
- cake_dryness < 18%: "Low cake dryness may increase disposal costs"
- cake_dryness > 30%: "Very high cake dryness - verify equipment capability"
- liquid_tss > 500 mg/L: "High liquid TSS may require additional treatment"
- dose outside jar test acceptable range: "Dose outside recommended range (X-Y ppm)"

Frontend:
- Display warnings in ResultsPanel with yellow warning icons
- Show warning count badge on Simulate button after run
- Highlight nodes that triggered warnings (yellow border)
```

### Prompt 3.3: Cost Model Integration

```
Implement the polymer cost model:

Backend (update kpis.py):
Add cost calculations:
- polymer_cost_per_kg: from project settings
- polymer_cost_per_day = polymer_kg_per_day × cost_per_kg
- polymer_cost_per_month = polymer_cost_per_day × 30
- polymer_cost_per_year = polymer_cost_per_day × 365
- polymer_cost_per_tDS = polymer_kg_per_tDS × cost_per_kg

Frontend:
Add settings modal/panel for:
- Polymer price ($/kg or R$/kg - allow currency selection)
- Operating hours per day (default 24)
- Operating days per week (default 7)

Display costs in ResultsPanel when price is set.
Format currency appropriately (2 decimal places, thousands separator).
```

### Prompt 3.4: Settings Panel

```
Create a settings panel/modal:

frontend/src/components/modals/SettingsModal.tsx:

Sections:
1. Economic Parameters:
   - Polymer price per kg (number input with currency symbol)
   - Currency selection (USD, BRL, EUR)

2. Operating Schedule:
   - Hours per day (slider 1-24)
   - Days per week (slider 1-7)

3. Display Preferences:
   - Number format (decimal separator: . or ,)
   - Unit system (metric only for MVP, but structure for future)

4. Advanced (collapsed by default):
   - API endpoint URL (for custom deployments)

Store settings in localStorage for persistence.
Also save to project when saving project.
```

### Prompt 3.5: Responsive Design

```
Make the application responsive for different screen sizes:

Breakpoints:
- Desktop (>= 1024px): Full layout as designed
- Tablet (768-1023px): 
  - Properties panel as bottom sheet instead of sidebar
  - Smaller node sizes
- Mobile (< 768px):
  - Simplified view (maybe just form-based, not canvas)
  - Bottom navigation

Update components:
- FlowCanvas: responsive sizing, touch support for pan/zoom
- PropertiesPanel: slide-out drawer on mobile
- ResultsPanel: full-width on mobile
- Header: collapsible menu on mobile

Use Tailwind responsive classes throughout.
Test on iPad-sized viewport specifically (common for field use).
```

### Prompt 3.6: Loading States & Skeletons

```
Add loading states throughout the application:

Create skeleton components:
- NodeSkeleton: placeholder while canvas loads
- ResultsSkeleton: placeholder for results table
- FormSkeleton: placeholder for property forms

Loading states:
- Initial app load: full-page skeleton
- Simulation running: pulse animation on canvas, skeleton in results
- Project loading: overlay with spinner
- API errors: retry button with error message

Use Suspense boundaries where appropriate.
Add subtle transitions between loading and loaded states.
```

### Prompt 3.7: Keyboard Shortcuts

```
Implement keyboard shortcuts for power users:

Shortcuts:
- Ctrl/Cmd + Enter: Run simulation
- Ctrl/Cmd + S: Save project
- Ctrl/Cmd + O: Open project
- Escape: Deselect node / Close modal
- 1/2/3: Select Feed/Polymer/Dewatering node
- R: Reset to defaults
- ?: Show keyboard shortcuts help

Create a keyboard shortcuts help modal.
Show hints in tooltips (e.g., button tooltip shows "Simulate (Ctrl+Enter)").

Use a custom useKeyboardShortcuts hook.
```

### Prompt 3.8: Data Export (Simple)

```
Add basic data export functionality:

Backend (new endpoint):
GET /api/export/{project_id}?format=json
- Returns full project data as downloadable JSON

POST /api/export/simulation
- Body: simulation result
- Returns formatted data as JSON or CSV

Frontend:
Add "Export" dropdown in results panel:
- Export Results (JSON)
- Export Results (CSV)
- Export Project (JSON)

Implementation:
- Create download links using Blob API
- Format data nicely for CSV (flatten nested objects)
- Include metadata (timestamp, project name)
```

### Prompt 3.9: Demo Mode / Guided Tour

```
Create a demo mode for first-time users:

Features:
- "Start Demo" button on empty state
- Step-by-step guided tour using a library like react-joyride or shepherd.js
- Highlights each UI element and explains its purpose

Tour steps:
1. Welcome - overview of the application
2. Canvas - explain the process flow
3. Feed Node - click to configure feed parameters
4. Polymer Node - show jar test selection
5. Dewatering Node - explain capture and dryness
6. Simulate Button - run your first simulation
7. Results - understand the outputs
8. Save - save your work

Store "tour completed" in localStorage to not show again.
Add "Help" button to restart tour anytime.
```

### Prompt 3.10: Polish & Final Touches

```
Final polish pass on the application:

Visual Polish:
- Consistent spacing using Tailwind spacing scale
- Proper focus states for accessibility
- Smooth transitions (150-300ms)
- Hover states on all interactive elements
- Proper cursor styles (pointer, not-allowed, etc.)

Copy/Text:
- Review all labels and messages
- Add helpful placeholder text in inputs
- Tooltip explanations for technical terms
- Proper number formatting throughout

Performance:
- Lazy load modals and heavy components
- Memoize expensive computations
- Debounce form inputs
- Optimize React Flow renders

Accessibility:
- Proper aria labels
- Keyboard navigation
- Color contrast compliance
- Screen reader friendly

Add console logging for debugging (removable in production).
```

---

## Phase 4: Optional Enhancements (Weeks 7-8)

### Prompt 4.1: Jar Test Dose Chart

```
Add a simple chart showing jar test dose vs response:

Create frontend/src/components/charts/JarTestChart.tsx:

Using Recharts:
- X-axis: Dose (ppm)
- Y-axis (left): CST (seconds) - line chart
- Y-axis (right): Supernatant TSS (mg/L) - line chart
- Vertical line at optimum dose
- Shaded region for acceptable range

Features:
- Show when a jar test is selected in polymer form
- Expandable view in a modal for detail
- Responsive sizing
- Tooltips showing exact values

Data from selected JarTest.doses array.
```

### Prompt 4.2: Simple PDF Report

```
Add PDF export for project summary:

Backend approach:
Create endpoint: GET /api/projects/{id}/report
Use reportlab or weasyprint to generate PDF

Report sections:
1. Header: Project name, date, logo placeholder
2. Configuration Summary:
   - Feed parameters
   - Polymer parameters (with jar test reference)
   - Dewatering parameters
3. Results Summary (from last simulation):
   - Key KPIs table
   - Stream summary table
4. Warnings (if any)
5. Footer: Generated by SludgeSim

Alternative (simpler) Frontend approach:
- Use browser print-to-PDF
- Create a PrintableReport component with print-friendly styles
- Button: "Print Report" opens print dialog
```

### Prompt 4.3: Multiple Equipment Support (Prep)

```
Prepare the architecture for multiple equipment in future:

Backend changes:
- Abstract equipment into a base class/interface
- Each equipment type implements: validate(), calculate_outputs()
- Solver uses a graph-based approach (even if linear for now)

Frontend changes:
- Add equipment palette (hidden for now, or disabled)
- Prepare node registration system
- Add edge validation logic

New equipment types to prep (not implement):
- Thickener (gravity or DAF)
- Belt Filter Press (alternative to centrifuge)
- Screw Press
- Blend Tank / Mixer

This is prep work only - don't fully implement, just structure the code to make it easy to add later.
```

### Prompt 4.4: Dark Mode

```
Add dark mode support:

Implementation:
- Use Tailwind's dark mode (class strategy)
- Create ThemeProvider context
- Toggle in settings
- Persist preference in localStorage
- Respect system preference initially

Update all components:
- Background colors
- Text colors
- Border colors
- Node colors (maintain distinguishability)
- Chart colors

Add toggle in header or settings modal.
```

---

## Deployment & DevOps Prompts

### Prompt D.1: Docker Setup

```
Create Docker configuration for local development and deployment:

backend/Dockerfile:
- Python 3.11 slim base
- Install requirements
- Copy app code
- Run with uvicorn
- Expose port 8000

frontend/Dockerfile:
- Node 20 alpine for build
- Install deps, build
- Nginx for serving
- Expose port 80

docker-compose.yml:
- backend service (port 8000)
- frontend service (port 3000 dev, port 80 prod)
- Shared network
- Volume for SQLite persistence

docker-compose.dev.yml:
- Hot reload for both services
- Mount source code as volumes

Add .dockerignore files for both services.
```

### Prompt D.2: Environment Configuration

```
Set up environment configuration:

Backend (.env.example):
DATABASE_URL=sqlite:///./sludgesim.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DEBUG=true
LOG_LEVEL=INFO

Frontend (.env.example):
VITE_API_URL=http://localhost:8000/api

Create config.py that reads from environment with sensible defaults.
Document all environment variables in README.
```

---

## Testing Prompts

### Prompt T.1: Backend Integration Tests

```
Create integration tests for the full simulation flow:

tests/test_integration.py:

Test scenarios:
1. Complete simulation with typical values:
   - Feed: 100 m³/h, 3% TS
   - Polymer: 15 ppm, 1.2 shear, 1.1 safety
   - Dewatering: 95% capture, 23% cake DS
   - Verify mass balance closes
   - Verify KPIs are reasonable

2. Edge case - zero polymer:
   - Set dose to 0
   - Should still produce valid results

3. Edge case - high solids:
   - Feed with 8% TS
   - Verify calculations handle correctly

4. Error case - invalid parameters:
   - Negative flow
   - Should return validation error

5. Warning case - over capacity:
   - Feed 50 m³/h, max 40 m³/h
   - Should return warning but complete simulation

Use pytest fixtures for common setup.
Compare results against manually calculated values.
```

### Prompt T.2: Frontend Component Tests

```
Create component tests using Vitest and React Testing Library:

Frontend test setup:
- Configure vitest.config.ts
- Set up testing-library/react
- Mock API calls with msw

Tests to create:
1. FeedForm.test.tsx:
   - Renders with default values
   - Updates store on input change
   - Shows validation error for invalid input

2. ResultsPanel.test.tsx:
   - Shows skeleton when loading
   - Renders results correctly
   - Displays warnings appropriately

3. FlowCanvas.test.tsx:
   - Renders all nodes
   - Handles node selection
   - Updates on store changes

4. Integration test:
   - Full flow from input to simulation to results
```

---

## Running Instructions

After all prompts are executed, include these instructions:

```
## How to Run the Application

### Development Mode

1. Start the backend:
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000

2. Start the frontend:
   cd frontend
   npm install
   npm run dev

3. Open http://localhost:5173

### Using Docker

docker-compose up --build

Open http://localhost:3000

### Running Tests

Backend:
cd backend
pytest

Frontend:
cd frontend
npm test
```

---

## Summary

This document contains 40+ prompts organized into phases:
- **Phase 0**: Project scaffolding (3 prompts)
- **Phase 1**: Backend core (15 prompts)
- **Phase 2**: Frontend core (15 prompts)
- **Phase 3**: Polish (10 prompts)
- **Phase 4**: Optional enhancements (4 prompts)
- **DevOps**: Deployment (2 prompts)
- **Testing**: Test suites (2 prompts)

Execute them in order for best results. Each prompt is designed to be self-contained and produce working code that integrates with previous prompts.