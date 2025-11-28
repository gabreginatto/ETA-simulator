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
