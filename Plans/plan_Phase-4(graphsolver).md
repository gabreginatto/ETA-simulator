Purpose
  Replace the hardcoded linear solver with a graph-based engine that accepts React Flow–style nodes and edges, executes via a node registry and
  topological sort, and produces identical results for the linear case. Keep a shim for legacy plant_definition requests.

  ## Backend Requirements

  ### Payload Shape

  - New POST /simulate request body:

    {
      "nodes": [
        { "id": "feed-1", "type": "feed", "data": { "parameters": { /* feed params */ } } },
        { "id": "polymer-1", "type": "polymer", "data": { "parameters": { /* polymer params */ } } },
        { "id": "dew-1", "type": "dewatering", "data": { "parameters": { /* dewatering params */ } } }
      ],
      "edges": [
        { "id": "e1", "source": "feed-1", "sourceHandle": "output", "target": "polymer-1", "targetHandle": "input" },
        { "id": "e2", "source": "polymer-1", "sourceHandle": "output", "target": "dew-1", "targetHandle": "input" }
      ],
      "jar_test_id": "...",
      "jar_test_optimum_ppm": 15.0
    }
  - Legacy shim: if plant_definition exists and nodes/edges are absent, synthesize the 3-node graph above from the old shape.

  ### Schema Updates

  - backend/app/api/schemas.py SimulateRequest accepts nodes/edges, keeps jar_test_id, jar_test_optimum_ppm, and an optional plant_definition for the
    shim.
  - /simulate/validate mirrors the same payload.

  ### Registry Contract

  - In backend/app/engine/solver.py, define:

    NODE_REGISTRY: Dict[str, Callable[[Dict[str, Any], Dict[str, Stream]], Dict[str, Stream]]]
  - Input to each registry fn: node parameters and a dict of upstream streams keyed by incoming handle IDs.
  - Output: dict keyed by output handle IDs (e.g., {"output": Stream} or {"cake": Stream, "liquid": Stream}).
  - Include registry entries:
      - feed -> make_feed_stream (no inputs, uses its parameters)
      - polymer -> wraps apply_polymer (one sludge input)
      - dewatering -> wraps dewatering_unit (one sludge input, returns cake/liquid)

  ### Stream Storage Contract

  - Store outputs as streams[(node_id, handle_id)] = Stream.
  - For compatibility, also expose in final result:
      - streams["feed"], streams["conditioned"], streams["cake"], streams["liquid"] when the linear path exists.
  - Keep KPIs computed from the linear path (see below).

  ### Graph Utilities

  - Extend/reuse backend/app/engine/graph.py:
      - Port definitions and compatibility checks (using sourceHandle/targetHandle).
      - Kahn topological sort with cycle detection; on cycle, return error.
      - Build incoming edge map: target node -> list of incoming edges.
      - Validate unknown node types/handles/incompatible ports -> clear error.

  ### Solver Algorithm (replace old linear logic)

  1. If nodes/edges missing but plant_definition provided, build the 3-node linear graph (feed → polymer → dewatering) using the old parameters.
  2. Validate graph (port compatibility, cycles).
  3. Topologically sort nodes; if fails, return success: False + errors.
  4. Iterate nodes in order:
      - Gather upstream streams via incoming edges; look up streams[(source, sourceHandle)].
      - Call the node’s registry function with its parameters and gathered inputs.
      - Store outputs into streams[(node_id, output_handle)].
  5. KPIs/warnings:
      - Identify main linear path: first feed node’s output as feed; first polymer output as conditioned; first dewatering outputs as cake/liquid.
      - Compute KPIs with existing logic using these streams; preserve current warnings/errors behavior.
  6. Final response:
      - streams: include compat keys (feed, conditioned, cake, liquid) plus general {node_id}.{handle} entries if desired.
      - kpis, warnings, errors as before. On validation/sort failure, success: False with errors.

  ### API Layer (backend/app/api/routes/simulate.py)

  - Accept the new graph payload.
  - Inject jar-test optimum/range as before.
  - On solver errors, return 422 with joined messages; on success, return 200.

  ### Tests

  - Update backend/tests/test_api.py simulate payloads to use nodes/edges; add a legacy test using plant_definition shim.
  - In backend/tests/test_graph.py (or new file), add:
      - Topo sort success/failure (cycle).
      - Incompatible handle error.
      - Unknown node type error.
      - Registry execution on simple 3-node graph matches old KPIs/streams.
      - Split edge graph runs without crash (KPIs may still use linear path).
  - Ensure regression: linear graph returns identical KPIs/streams/warnings as before.

  ### Files to Touch (likely)

  - backend/app/api/schemas.py
  - backend/app/api/routes/simulate.py
  - backend/app/engine/solver.py (major refactor)
  - backend/app/engine/graph.py (helpers)
  - backend/tests/test_api.py
  - backend/tests/test_graph.py (add/extend)

  ———

  ## Frontend Wiring

  - Update SimulateRequest TS type and frontend/src/api/client.ts to send { nodes, edges, jar_test_id?, jar_test_optimum_ppm? }.
  - useSimulation should serialize current React Flow nodes/edges from the store into the request body.
  - Validation hook/banner should call /simulate/validate with the new payload; optionally keep a shim that builds the 3-node graph if nodes/edges
    missing.
  - Update TS types (types/index.ts), store state if needed, and frontend tests that mock simulate payloads.
  - No UI redesign needed; the canvas already reflects nodes/edges.

  ———

  ## Acceptance

  - Linear case: identical KPIs/streams/warnings to current behavior.
  - Errors: cycles, bad handles, or missing upstream streams return clear messages.
  - New graph schema accepted at /api/simulate; legacy plant_definition works via shim.
  - Tests pass (pytest backend, frontend test suites updated).
