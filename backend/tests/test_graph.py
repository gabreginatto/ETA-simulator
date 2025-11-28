"""
Tests for graph utilities - connection validation and cycle detection.
"""
import pytest
from app.engine.graph import (
    PortType,
    PortDirection,
    Connection,
    GraphValidator,
    EQUIPMENT_PORTS,
    build_incoming_edge_map,
    validate_graph,
    VALID_NODE_TYPES,
)


class TestPortDefinitions:
    """Test equipment port definitions."""

    def test_feed_source_has_output_only(self):
        """Feed source has only output port."""
        ports = EQUIPMENT_PORTS["feed_source"]
        assert len(ports.inputs) == 0
        assert len(ports.outputs) == 1
        assert ports.outputs[0].port_type == PortType.SLUDGE

    def test_polymer_conditioner_has_input_and_output(self):
        """Polymer conditioner has one input and one output."""
        ports = EQUIPMENT_PORTS["polymer_conditioner"]
        assert len(ports.inputs) == 1
        assert len(ports.outputs) == 1
        assert ports.inputs[0].port_type == PortType.SLUDGE
        assert ports.outputs[0].port_type == PortType.SLUDGE

    def test_dewatering_has_multiple_outputs(self):
        """Dewatering unit has one input and multiple outputs."""
        ports = EQUIPMENT_PORTS["dewatering_unit"]
        assert len(ports.inputs) == 1
        assert len(ports.outputs) == 2

        output_types = {p.port_type for p in ports.outputs}
        assert PortType.CAKE in output_types
        assert PortType.LIQUID in output_types


class TestConnectionValidation:
    """Test connection validation."""

    def test_valid_feed_to_polymer_connection(self):
        """Connection from feed output to polymer input is valid."""
        is_valid, error = GraphValidator.is_connection_valid(
            "feed_source", "output",
            "polymer_conditioner", "input"
        )
        assert is_valid is True
        assert error == ""

    def test_valid_polymer_to_dewatering_connection(self):
        """Connection from polymer output to dewatering input is valid."""
        is_valid, error = GraphValidator.is_connection_valid(
            "polymer_conditioner", "output",
            "dewatering_unit", "input"
        )
        assert is_valid is True
        assert error == ""

    def test_invalid_cake_to_sludge_connection(self):
        """Connection from cake output to sludge input is invalid."""
        is_valid, error = GraphValidator.is_connection_valid(
            "dewatering_unit", "cake",
            "polymer_conditioner", "input"
        )
        assert is_valid is False
        assert "Incompatible" in error

    def test_unknown_source_port(self):
        """Unknown source port returns error."""
        is_valid, error = GraphValidator.is_connection_valid(
            "feed_source", "nonexistent",
            "polymer_conditioner", "input"
        )
        assert is_valid is False
        assert "Unknown source port" in error

    def test_unknown_target_port(self):
        """Unknown target port returns error."""
        is_valid, error = GraphValidator.is_connection_valid(
            "feed_source", "output",
            "polymer_conditioner", "nonexistent"
        )
        assert is_valid is False
        assert "Unknown target port" in error


class TestCycleDetection:
    """Test cycle detection in graphs."""

    def test_no_cycles_in_linear_graph(self):
        """Linear graph has no cycles."""
        nodes = ["feed", "polymer", "dewatering"]
        connections = [
            Connection("feed", "output", "polymer", "input"),
            Connection("polymer", "output", "dewatering", "input"),
        ]

        cycles = GraphValidator.detect_cycles(nodes, connections)
        assert len(cycles) == 0

    def test_detects_simple_cycle(self):
        """Detects a simple cycle."""
        nodes = ["A", "B", "C"]
        connections = [
            Connection("A", "out", "B", "in"),
            Connection("B", "out", "C", "in"),
            Connection("C", "out", "A", "in"),  # Creates cycle
        ]

        cycles = GraphValidator.detect_cycles(nodes, connections)
        assert len(cycles) >= 1

    def test_detects_recycle_branch(self):
        """Detects recycle branch in plant layout."""
        nodes = ["feed", "mixer", "polymer", "dewatering"]
        connections = [
            Connection("feed", "out", "mixer", "in_a"),
            Connection("mixer", "out", "polymer", "in"),
            Connection("polymer", "out", "dewatering", "in"),
            Connection("dewatering", "liquid", "mixer", "in_b"),  # Recycle
        ]

        cycles = GraphValidator.detect_cycles(nodes, connections)
        assert len(cycles) >= 1


class TestTopologicalSort:
    """Test topological ordering."""

    def test_topological_order_linear(self):
        """Linear graph has correct topological order."""
        nodes = ["feed", "polymer", "dewatering"]
        connections = [
            Connection("feed", "output", "polymer", "input"),
            Connection("polymer", "output", "dewatering", "input"),
        ]

        order, error = GraphValidator.get_topological_order(nodes, connections)
        assert error == ""
        assert order is not None
        assert order.index("feed") < order.index("polymer")
        assert order.index("polymer") < order.index("dewatering")

    def test_topological_order_with_cycle_fails(self):
        """Graph with cycle cannot be topologically sorted."""
        nodes = ["A", "B", "C"]
        connections = [
            Connection("A", "out", "B", "in"),
            Connection("B", "out", "C", "in"),
            Connection("C", "out", "A", "in"),  # Creates cycle
        ]

        order, error = GraphValidator.get_topological_order(nodes, connections)
        assert order is None
        assert "Cycle detected" in error


class TestGraphUtilities:
    """Test new graph utilities for solver."""

    def test_build_incoming_edge_map(self):
        """Test building incoming edge map from edges."""
        edges = [
            {"id": "e1", "source": "feed-1", "sourceHandle": "output", "target": "polymer-1", "targetHandle": "input"},
            {"id": "e2", "source": "polymer-1", "sourceHandle": "output", "target": "dew-1", "targetHandle": "input"},
        ]

        incoming = build_incoming_edge_map(edges)

        assert "polymer-1" in incoming
        assert len(incoming["polymer-1"]) == 1
        assert incoming["polymer-1"][0]["source"] == "feed-1"

        assert "dew-1" in incoming
        assert len(incoming["dew-1"]) == 1
        assert incoming["dew-1"][0]["source"] == "polymer-1"

        # Feed has no incoming edges
        assert "feed-1" not in incoming

    def test_validate_graph_valid_linear(self):
        """Valid linear graph passes validation."""
        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {}}},
            {"id": "polymer-1", "type": "polymer", "data": {"parameters": {}}},
            {"id": "dew-1", "type": "dewatering", "data": {"parameters": {}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "polymer-1"},
            {"id": "e2", "source": "polymer-1", "target": "dew-1"},
        ]

        errors = validate_graph(nodes, edges)
        assert len(errors) == 0

    def test_validate_graph_unknown_node_type(self):
        """Unknown node type returns error."""
        nodes = [
            {"id": "feed-1", "type": "unknown_type", "data": {}},
        ]
        edges = []

        errors = validate_graph(nodes, edges)
        assert len(errors) == 1
        assert "Unknown node type" in errors[0]

    def test_validate_graph_unknown_source_node(self):
        """Edge referencing unknown source returns error."""
        nodes = [
            {"id": "polymer-1", "type": "polymer", "data": {}},
        ]
        edges = [
            {"id": "e1", "source": "nonexistent", "target": "polymer-1"},
        ]

        errors = validate_graph(nodes, edges)
        assert len(errors) >= 1
        assert "unknown source node" in errors[0].lower()

    def test_validate_graph_invalid_connection(self):
        """Invalid port connection returns error."""
        nodes = [
            {"id": "dew-1", "type": "dewatering", "data": {}},
            {"id": "polymer-1", "type": "polymer", "data": {}},
        ]
        edges = [
            # cake output cannot connect to sludge input
            {"id": "e1", "source": "dew-1", "sourceHandle": "cake", "target": "polymer-1", "targetHandle": "input"},
        ]

        errors = validate_graph(nodes, edges)
        assert len(errors) >= 1
        assert "Invalid connection" in errors[0]


class TestSolverIntegration:
    """Test solver with graph-based execution."""

    def test_solve_graph_linear(self):
        """Solve a simple linear graph."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}}},
            {"id": "dew-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "polymer-1"},
            {"id": "e2", "source": "polymer-1", "target": "dew-1"},
        ]

        result = solve_graph(nodes, edges)

        assert result["success"] is True
        assert "feed" in result["streams"]
        assert "conditioned" in result["streams"]
        assert "cake" in result["streams"]
        assert "liquid" in result["streams"]
        assert "kpis" in result
        assert result["kpis"]["polymer_dose_ppm"] > 0

    def test_solve_graph_with_pump(self):
        """Solve graph with optional pump node."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            {"id": "pump-1", "type": "pump", "data": {"parameters": {"head_m": 20, "efficiency_pump": 0.7, "efficiency_motor": 0.9}}},
            {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}}},
            {"id": "dew-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "pump-1"},
            {"id": "e2", "source": "pump-1", "target": "polymer-1"},
            {"id": "e3", "source": "polymer-1", "target": "dew-1"},
        ]

        result = solve_graph(nodes, edges)

        assert result["success"] is True
        assert "pump_out" in result["streams"]

    def test_solve_graph_cycle_error(self):
        """Graph with cycle returns error."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "A", "type": "feed", "data": {}},
            {"id": "B", "type": "polymer", "data": {}},
            {"id": "C", "type": "dewatering", "data": {}},
        ]
        edges = [
            {"id": "e1", "source": "A", "target": "B"},
            {"id": "e2", "source": "B", "target": "C"},
            {"id": "e3", "source": "C", "sourceHandle": "liquid", "target": "A", "targetHandle": "input"},  # Cycle
        ]

        result = solve_graph(nodes, edges)

        # Feed has no input, so connecting to it should fail validation first
        assert result["success"] is False
        assert len(result["errors"]) > 0

    def test_plant_definition_to_graph(self):
        """Test legacy shim conversion."""
        from app.engine.solver import plant_definition_to_graph

        plant_def = {
            "feed_source": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}},
            "polymer_conditioner": {"parameters": {"jar_test_optimum_ppm": 15}},
            "dewatering_unit": {"parameters": {"capture_rate": 0.95}},
        }

        nodes, edges = plant_definition_to_graph(plant_def)

        assert len(nodes) == 3
        assert len(edges) == 2

        node_types = {n["type"] for n in nodes}
        assert "feed" in node_types
        assert "polymer" in node_types
        assert "dewatering" in node_types

    def test_plant_definition_to_graph_with_pump(self):
        """Test legacy shim with pump."""
        from app.engine.solver import plant_definition_to_graph

        plant_def = {
            "feed_source": {"parameters": {"flow_m3_h": 100}},
            "transfer_pump": {"parameters": {"head_m": 20}},
            "polymer_conditioner": {"parameters": {"jar_test_optimum_ppm": 15}},
            "dewatering_unit": {"parameters": {"capture_rate": 0.95}},
        }

        nodes, edges = plant_definition_to_graph(plant_def)

        assert len(nodes) == 4
        assert len(edges) == 3

        node_types = {n["type"] for n in nodes}
        assert "pump" in node_types


class TestPartialGraphValidation:
    """Test validation of incomplete/partial graphs."""

    def test_partial_graph_feed_only_returns_error(self):
        """Graph with only feed node returns friendly error."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
        ]
        edges = []

        result = solve_graph(nodes, edges)

        assert result["success"] is False
        assert len(result["errors"]) == 1
        assert "Incomplete graph" in result["errors"][0]
        assert "polymer" in result["errors"][0].lower()
        assert "dewatering" in result["errors"][0].lower()

    def test_partial_graph_no_dewatering_returns_error(self):
        """Graph with feed and polymer but no dewatering returns error."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "polymer-1"},
        ]

        result = solve_graph(nodes, edges)

        assert result["success"] is False
        assert len(result["errors"]) == 1
        assert "Incomplete graph" in result["errors"][0]
        assert "dewatering" in result["errors"][0].lower()

    def test_partial_graph_no_polymer_returns_error(self):
        """Graph with feed directly to dewatering returns error (missing polymer)."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            {"id": "dew-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23}}},
        ]
        edges = [
            {"id": "e1", "source": "feed-1", "target": "dew-1"},
        ]

        result = solve_graph(nodes, edges)

        assert result["success"] is False
        assert len(result["errors"]) == 1
        assert "Incomplete graph" in result["errors"][0]
        assert "polymer" in result["errors"][0].lower()

    def test_disconnected_nodes_returns_error(self):
        """Graph with all node types but disconnected returns error."""
        from app.engine.solver import solve_graph

        nodes = [
            {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15, "shear_factor": 1.2, "safety_factor": 1.1}}},
            {"id": "dew-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95, "cake_dryness_percent": 23}}},
        ]
        # No edges - all nodes are disconnected
        edges = []

        result = solve_graph(nodes, edges)

        # The polymer and dewatering nodes have no inputs, so they will fail to produce streams
        assert result["success"] is False
        assert len(result["errors"]) >= 1


class TestValidationEndpoint:
    """Test the /simulate/validate endpoint behavior for graphs."""

    def test_cyclic_graph_validation_fails(self):
        """Cyclic graph should fail validation endpoint."""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        # Create a cyclic graph: A -> B -> C -> A
        # Note: We need valid node types but create a logical cycle
        # Since feed has no input, we'll use polymer types which have both
        response = client.post("/api/simulate/validate", json={
            "nodes": [
                {"id": "A", "type": "polymer", "data": {"parameters": {}}},
                {"id": "B", "type": "polymer", "data": {"parameters": {}}},
                {"id": "C", "type": "polymer", "data": {"parameters": {}}},
            ],
            "edges": [
                {"id": "e1", "source": "A", "sourceHandle": "output", "target": "B", "targetHandle": "input"},
                {"id": "e2", "source": "B", "sourceHandle": "output", "target": "C", "targetHandle": "input"},
                {"id": "e3", "source": "C", "sourceHandle": "output", "target": "A", "targetHandle": "input"},
            ]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) >= 1
        assert "cycle" in data["errors"][0]["message"].lower()

    def test_incomplete_graph_validation_warns(self):
        """Incomplete graph should return warning about missing equipment."""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        # Only feed node - missing polymer and dewatering
        response = client.post("/api/simulate/validate", json={
            "nodes": [
                {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            ],
            "edges": []
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False  # Missing required equipment
        assert len(data["warnings"]) >= 1
        warning_msg = data["warnings"][0]["message"].lower()
        assert "missing" in warning_msg
        assert "dewatering" in warning_msg
        assert "polymer" in warning_msg

    def test_complete_graph_validation_passes(self):
        """Complete valid graph should pass validation."""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        response = client.post("/api/simulate/validate", json={
            "nodes": [
                {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
                {"id": "polymer-1", "type": "polymer", "data": {"parameters": {"jar_test_optimum_ppm": 15}}},
                {"id": "dew-1", "type": "dewatering", "data": {"parameters": {"capture_rate": 0.95}}},
            ],
            "edges": [
                {"id": "e1", "source": "feed-1", "target": "polymer-1"},
                {"id": "e2", "source": "polymer-1", "target": "dew-1"},
            ]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0
        assert len(data["warnings"]) == 0

    def test_feed_only_graph_simulation_returns_422(self):
        """Submitting feed-only graph to /simulate should return 422 with friendly message."""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        response = client.post("/api/simulate", json={
            "nodes": [
                {"id": "feed-1", "type": "feed", "data": {"parameters": {"flow_m3_h": 100, "ts_percent": 3.0}}},
            ],
            "edges": []
        })

        assert response.status_code == 422
        detail = response.json().get("detail", "")
        assert "Incomplete graph" in detail
        assert "feed → polymer → dewatering" in detail
