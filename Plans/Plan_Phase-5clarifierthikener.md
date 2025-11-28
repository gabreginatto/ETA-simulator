
  Goal
  Add two new splitter nodes—clarifier and thickener—to the graph-based solver and UI. Both consume one sludge stream and emit two streams each.

  Backend requirements

  - Files to add
      - backend/app/engine/clarifier.py: implement simulate_clarifier(feed: Stream, underflow_rate_m3_h: float, capture_rate: float = 0.98, overflow_id="clarifier_overflow", underflow_id="clarifier_underflow") -> Dict[str, Stream] plus validate_clarifier_params(feed_flow_m3_h: float, surface_area_m2:
        float) -> list[str]. Use the provided code as-is.
      - backend/app/engine/thickener.py: implement simulate_thickener(feed: Stream, target_thickened_ts_percent: float, capture_rate: float = 0.95, supernatant_id="thickener_supernatant", thickened_id="thickener_sludge") -> Dict[str, Stream] using provided code.
  - Graph ports & node registry
      - Update EQUIPMENT_PORTS in backend/app/engine/graph.py to include:
          - clarifier: input sludge; outputs overflow (liquid), underflow (sludge).
          - thickener: input sludge; outputs thickened (sludge), supernatant (liquid).
      - Add these types to VALID_NODE_TYPES.
      - Register executors in backend/app/engine/solver.py via @register_node("clarifier") and @register_node("thickener").
          - Clarifier executor: requires input; params underflow_rate_m3_h, optional capture_rate. Calls simulate_clarifier and returns handles overflow, underflow.
          - Thickener executor: requires input; params target_thickened_ts_percent, optional capture_rate. Calls simulate_thickener and returns handles thickened, supernatant.
      - Ensure build_incoming_edge_map/routing handles multi-output nodes (existing logic should work if handles are referenced correctly).
  - Validation
      - validate_graph should allow the new types and port handles.
      - /simulate/validate should surface invalid port connections involving the new handles (relies on GraphValidator).
      - Consider warnings (not errors) when graph is missing downstream consumers for overflow/supernatant (optional).
  - KPI/extraction
      - solve_graph currently extracts feed, conditioned, cake, liquid, pump_out. Extend to also export clarifier/thickener streams in result["streams"] using handle names:
          - Clarifier: clarifier_overflow, clarifier_underflow
          - Thickener: thickened, supernatant
      - KPIs can stay based on the main path; ensure multi-branch streams don’t break required-stream checks.
  - API schemas
      - backend/app/api/schemas.py: update GraphNode.type enum description or validation to include clarifier, thickener. Add example payloads if helpful.
  - API routes
      - /simulate already accepts arbitrary graph nodes; no contract change, just ensure new types work.
      - Add tests to cover:
          - Graph validation rejects bad handles for clarifier/thickener.
          - A small graph: feed → clarifier → thickener → polymer → dewatering (with edges using correct handles) runs successfully and returns overflow/underflow/supernatant streams.
          - Cycle detection still works with new types.
  - Backward compatibility
      - Legacy plant_definition can ignore these nodes (no changes required), but ensure no regressions.
  - Tests to add (backend)
      - Unit tests in tests/test_graph.py for port compatibility, validation, and execution of clarifier/thickener.
      - API test in tests/test_api.py posting a graph that includes both nodes; assert 200 and presence of new stream keys.

  Frontend requirements

  - Types
      - frontend/src/types/index.ts:
          - Extend EquipmentType union with "clarifier" | "thickener".
          - Define params interfaces: ClarifierParams { underflow_rate_m3_h: number; capture_rate?: number; }; ThickenerParams { target_thickened_ts_percent: number; capture_rate?: number; }.
          - Extend GraphNode parameters union and EQUIPMENT_PORTS/PORT_COMPATIBILITY to match backend handles (overflow, underflow, thickened, supernatant).
          - Add optional stream data fields to node data types if needed.
  - Store serialization
      - useStore.ts: ensure default nodes/edges can include new types when created; update nodesToApiFormat/edgesToApiFormat to pass through custom handles.
      - If you add starter nodes, wire the edges to correct handles (clarifier underflow to thickener input; overflow could be a terminal).
  - API client
      - No new endpoints; ensure GraphNode typing allows new params/handles.
  - Hook
      - useSimulation should work unchanged; just ensure types accept new nodes.
  - Validation UI
      - If UI surfaces warnings/errors from /simulate/validate, ensure it can display the new messages.
  - Frontend tests (if present)
      - Add a minimal test to ensure nodesToApiFormat/edgesToApiFormat handle the new handles.

  Edge cases to cover

  - Underflow rate greater than feed flow should raise an error (clarifier).
  - Target TS too high for available solids should raise an error (thickener).
  - Port validation: connecting overflow (liquid) to sludge-only inputs should be invalid.
  - Cycles with new nodes should still be detected.

  Natural next steps after implementation

  - Run backend tests (pytest tests/test_graph.py tests/test_api.py).
  - Manually POST a graph with clarifier/thickener to /api/simulate to verify stream keys.
  - Update docs/README for new node types if you keep docs in the repo.