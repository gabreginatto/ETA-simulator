"""
Graph types and utilities for plant topology.

This module defines typed ports for equipment nodes and provides
utilities for connection validation and cycle detection.

Port Types:
    - sludge: Main sludge stream (feed, conditioned)
    - cake: Dewatered cake output
    - liquid: Centrate/filtrate output
    - polymer: Polymer solution (for future polymer dosing equipment)
"""
from enum import Enum
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass


class PortType(str, Enum):
    """Types of stream ports for equipment nodes."""
    SLUDGE = "sludge"      # Main sludge stream
    CAKE = "cake"          # Dewatered cake
    LIQUID = "liquid"      # Centrate/filtrate
    POLYMER = "polymer"    # Polymer solution


class PortDirection(str, Enum):
    """Direction of port: input or output."""
    INPUT = "input"
    OUTPUT = "output"


@dataclass
class Port:
    """Definition of an equipment port."""
    id: str
    port_type: PortType
    direction: PortDirection
    label: Optional[str] = None


@dataclass
class EquipmentPorts:
    """Port definitions for an equipment type."""
    inputs: List[Port]
    outputs: List[Port]


# Standard port definitions for each equipment type
# Uses frontend naming convention (feed, pump, polymer, dewatering)
EQUIPMENT_PORTS: Dict[str, EquipmentPorts] = {
    # Frontend names (used in graph-based API)
    "feed": EquipmentPorts(
        inputs=[],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Sludge Out")
        ]
    ),
    "pump": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Pumped Out")
        ]
    ),
    "polymer": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Conditioned Out")
        ]
    ),
    "dewatering": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("cake", PortType.CAKE, PortDirection.OUTPUT, "Cake Out"),
            Port("liquid", PortType.LIQUID, PortDirection.OUTPUT, "Centrate Out")
        ]
    ),
    # Legacy backend names (for backward compatibility)
    "feed_source": EquipmentPorts(
        inputs=[],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Sludge Out")
        ]
    ),
    "transfer_pump": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Pumped Out")
        ]
    ),
    "polymer_conditioner": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Conditioned Out")
        ]
    ),
    "dewatering_unit": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("cake", PortType.CAKE, PortDirection.OUTPUT, "Cake Out"),
            Port("liquid", PortType.LIQUID, PortDirection.OUTPUT, "Centrate Out")
        ]
    ),
    # Future equipment types for extensibility
    "mixer": EquipmentPorts(
        inputs=[
            Port("input_a", PortType.SLUDGE, PortDirection.INPUT, "Stream A"),
            Port("input_b", PortType.SLUDGE, PortDirection.INPUT, "Stream B")
        ],
        outputs=[
            Port("output", PortType.SLUDGE, PortDirection.OUTPUT, "Mixed Out")
        ]
    ),
    "splitter": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("output_a", PortType.SLUDGE, PortDirection.OUTPUT, "Split A"),
            Port("output_b", PortType.SLUDGE, PortDirection.OUTPUT, "Split B")
        ]
    ),
    # Clarifier - separates into overflow (liquid) and underflow (sludge)
    "clarifier": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("overflow", PortType.LIQUID, PortDirection.OUTPUT, "Overflow"),
            Port("underflow", PortType.SLUDGE, PortDirection.OUTPUT, "Underflow")
        ]
    ),
    # Thickener - concentrates sludge, outputs thickened and supernatant
    "thickener": EquipmentPorts(
        inputs=[
            Port("input", PortType.SLUDGE, PortDirection.INPUT, "Sludge In")
        ],
        outputs=[
            Port("thickened", PortType.SLUDGE, PortDirection.OUTPUT, "Thickened Out"),
            Port("supernatant", PortType.LIQUID, PortDirection.OUTPUT, "Supernatant")
        ]
    ),
}


# Connection compatibility matrix: source port type -> compatible target port types
PORT_COMPATIBILITY: Dict[PortType, Set[PortType]] = {
    PortType.SLUDGE: {PortType.SLUDGE},  # Sludge can connect to sludge inputs
    PortType.CAKE: set(),                 # Cake typically exits the system
    PortType.LIQUID: {PortType.SLUDGE},   # Liquid could recycle back (recycle support)
    PortType.POLYMER: set(),              # Polymer has its own path (future)
}


@dataclass
class Connection:
    """Represents a connection (edge) between two equipment nodes."""
    source_node: str
    source_port: str
    target_node: str
    target_port: str


class GraphValidator:
    """Validates plant graph topology."""

    @staticmethod
    def get_port_type(equipment_type: str, port_id: str, direction: PortDirection) -> Optional[PortType]:
        """Get the port type for a given equipment and port ID."""
        if equipment_type not in EQUIPMENT_PORTS:
            return None

        ports = EQUIPMENT_PORTS[equipment_type]
        port_list = ports.inputs if direction == PortDirection.INPUT else ports.outputs

        for port in port_list:
            if port.id == port_id:
                return port.port_type

        return None

    @staticmethod
    def is_connection_valid(
        source_equipment_type: str,
        source_port_id: str,
        target_equipment_type: str,
        target_port_id: str,
    ) -> Tuple[bool, str]:
        """
        Check if a connection between two ports is valid.

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Get source port type
        source_port_type = GraphValidator.get_port_type(
            source_equipment_type, source_port_id, PortDirection.OUTPUT
        )
        if source_port_type is None:
            return False, f"Unknown source port: {source_equipment_type}.{source_port_id}"

        # Get target port type
        target_port_type = GraphValidator.get_port_type(
            target_equipment_type, target_port_id, PortDirection.INPUT
        )
        if target_port_type is None:
            return False, f"Unknown target port: {target_equipment_type}.{target_port_id}"

        # Check compatibility
        compatible_types = PORT_COMPATIBILITY.get(source_port_type, set())
        if target_port_type not in compatible_types:
            return False, f"Incompatible port types: {source_port_type.value} -> {target_port_type.value}"

        return True, ""

    @staticmethod
    def detect_cycles(nodes: List[str], connections: List[Connection]) -> List[List[str]]:
        """
        Detect cycles in the plant graph using DFS.

        Args:
            nodes: List of node IDs
            connections: List of connections between nodes

        Returns:
            List of cycles found (each cycle is a list of node IDs)
        """
        # Build adjacency list
        adjacency: Dict[str, List[str]] = {node: [] for node in nodes}
        for conn in connections:
            if conn.source_node in adjacency:
                adjacency[conn.source_node].append(conn.target_node)

        cycles: List[List[str]] = []
        visited: Set[str] = set()
        rec_stack: Set[str] = set()
        path: List[str] = []

        def dfs(node: str) -> None:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)

            for neighbor in adjacency.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor)
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start = path.index(neighbor)
                    cycles.append(path[cycle_start:] + [neighbor])

            path.pop()
            rec_stack.remove(node)

        for node in nodes:
            if node not in visited:
                dfs(node)

        return cycles

    @staticmethod
    def get_topological_order(
        nodes: List[str],
        connections: List[Connection]
    ) -> Tuple[Optional[List[str]], str]:
        """
        Get topological order of nodes for sequential solving.

        Returns:
            Tuple of (ordered_nodes or None, error_message)
        """
        # First check for cycles
        cycles = GraphValidator.detect_cycles(nodes, connections)
        if cycles:
            cycle_str = " -> ".join(cycles[0])
            return None, f"Cycle detected in graph: {cycle_str}"

        # Build adjacency and in-degree
        adjacency: Dict[str, List[str]] = {node: [] for node in nodes}
        in_degree: Dict[str, int] = {node: 0 for node in nodes}

        for conn in connections:
            if conn.source_node in adjacency:
                adjacency[conn.source_node].append(conn.target_node)
                in_degree[conn.target_node] = in_degree.get(conn.target_node, 0) + 1

        # Kahn's algorithm
        queue = [node for node in nodes if in_degree[node] == 0]
        result: List[str] = []

        while queue:
            node = queue.pop(0)
            result.append(node)

            for neighbor in adjacency[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(result) != len(nodes):
            return None, "Graph contains unreachable nodes"

        return result, ""


# =============================================================================
# Graph Utilities for Solver
# =============================================================================

# Valid node types for the graph-based API
VALID_NODE_TYPES = {"feed", "pump", "polymer", "dewatering", "clarifier", "thickener"}


def build_incoming_edge_map(edges: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Build a map of target_node -> list of incoming edges.

    Args:
        edges: List of edge dictionaries with source, target, sourceHandle, targetHandle

    Returns:
        Dictionary mapping target node IDs to their incoming edges
    """
    incoming: Dict[str, List[Dict]] = {}
    for edge in edges:
        target = edge["target"]
        if target not in incoming:
            incoming[target] = []
        incoming[target].append(edge)
    return incoming


def validate_graph(nodes: List[Dict], edges: List[Dict]) -> List[str]:
    """
    Validate graph structure for simulation.

    Checks:
    - All nodes have valid types
    - All edges reference existing nodes
    - All port connections are compatible

    Args:
        nodes: List of node dictionaries with id, type, data
        edges: List of edge dictionaries

    Returns:
        List of error messages (empty if valid)
    """
    errors: List[str] = []

    # Build node lookup
    node_ids = {n["id"] for n in nodes}
    node_types = {n["id"]: n["type"] for n in nodes}

    # Check node types are valid
    for node in nodes:
        node_type = node.get("type")
        if node_type not in VALID_NODE_TYPES:
            errors.append(f"Unknown node type '{node_type}' for node '{node['id']}'")

    # Check edges reference valid nodes
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")

        if source not in node_ids:
            errors.append(f"Edge '{edge.get('id', '?')}' references unknown source node: {source}")
        if target not in node_ids:
            errors.append(f"Edge '{edge.get('id', '?')}' references unknown target node: {target}")

    # Skip port validation if we have node reference errors
    if errors:
        return errors

    # Check port compatibility for each edge
    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        source_handle = edge.get("sourceHandle", "output")
        target_handle = edge.get("targetHandle", "input")

        source_type = node_types.get(source)
        target_type = node_types.get(target)

        if source_type and target_type:
            valid, msg = GraphValidator.is_connection_valid(
                source_type, source_handle,
                target_type, target_handle
            )
            if not valid:
                errors.append(
                    f"Invalid connection {source}.{source_handle} -> {target}.{target_handle}: {msg}"
                )

    return errors
