"""
Iterative solver for plant configurations with recycles.

This module provides a scaffold for solving plant flowsheets that contain
recycle streams (cycles in the graph). It uses successive substitution
with convergence checking.

This is FEATURE-FLAGGED and not exposed in the UI yet.
"""
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import logging

from app.engine.graph import Connection, GraphValidator

logger = logging.getLogger(__name__)


@dataclass
class SolverConfig:
    """Configuration for iterative solver."""
    max_iterations: int = 50
    tolerance: float = 1e-4  # Relative tolerance for convergence
    enable_recycles: bool = False  # Feature flag


@dataclass
class ConvergenceState:
    """Tracks convergence state for tear streams."""
    stream_id: str
    previous_values: Dict[str, float]
    current_values: Dict[str, float]
    is_converged: bool = False
    iterations: int = 0


class RecycleError(Exception):
    """Error raised when recycle solving fails."""
    pass


class IterativeSolver:
    """
    Iterative solver for plant flowsheets with recycles.

    For graphs without cycles, this simply calls the sequential solver.
    For graphs with cycles, it identifies tear streams and iterates
    until convergence.
    """

    def __init__(self, config: Optional[SolverConfig] = None):
        self.config = config or SolverConfig()
        self._convergence_history: List[Dict[str, float]] = []

    def solve(
        self,
        plant_definition: Dict[str, Any],
        nodes: List[str],
        connections: List[Connection],
    ) -> Dict[str, Any]:
        """
        Solve plant flowsheet, handling recycles if present.

        Args:
            plant_definition: Plant configuration dict
            nodes: List of equipment node IDs
            connections: List of connections between nodes

        Returns:
            Simulation result dict with streams, KPIs, warnings, errors
        """
        # Detect cycles
        cycles = GraphValidator.detect_cycles(nodes, connections)

        if not cycles:
            # No cycles - use sequential solver
            return self._solve_sequential(plant_definition, nodes, connections)

        if not self.config.enable_recycles:
            # Recycles not enabled - return error
            cycle_str = " -> ".join(cycles[0])
            return {
                "success": False,
                "streams": {},
                "kpis": {},
                "warnings": [],
                "errors": [
                    f"Recycle loop detected: {cycle_str}. "
                    "Recycle support is not yet enabled."
                ],
            }

        # Solve with recycles
        return self._solve_with_recycles(
            plant_definition, nodes, connections, cycles
        )

    def _solve_sequential(
        self,
        plant_definition: Dict[str, Any],
        nodes: List[str],
        connections: List[Connection],
    ) -> Dict[str, Any]:
        """
        Solve plant sequentially (no recycles).

        This delegates to the existing solve_plant function.
        """
        from app.engine.solver import solve_plant

        # Get topological order
        order, error = GraphValidator.get_topological_order(nodes, connections)
        if error:
            return {
                "success": False,
                "streams": {},
                "kpis": {},
                "warnings": [],
                "errors": [error],
            }

        logger.debug(f"Solving in order: {order}")

        # Use existing solver
        return solve_plant(plant_definition)

    def _solve_with_recycles(
        self,
        plant_definition: Dict[str, Any],
        nodes: List[str],
        connections: List[Connection],
        cycles: List[List[str]],
    ) -> Dict[str, Any]:
        """
        Solve plant with recycles using successive substitution.

        Algorithm:
        1. Identify tear streams (break points in cycles)
        2. Initialize tear stream guesses
        3. Iterate:
           a. Solve plant with current guesses
           b. Update tear stream values
           c. Check convergence
        4. Return converged solution or error
        """
        # Identify tear streams (for now, use first edge in each cycle)
        tear_streams = self._identify_tear_streams(cycles, connections)

        if not tear_streams:
            return {
                "success": False,
                "streams": {},
                "kpis": {},
                "warnings": [],
                "errors": ["Could not identify tear streams for recycle solving"],
            }

        # Initialize convergence tracking
        convergence_states = {
            ts: ConvergenceState(
                stream_id=ts,
                previous_values={},
                current_values={},
            )
            for ts in tear_streams
        }

        # Initial guess for tear streams (zero flow)
        tear_guesses = {
            ts: {
                "mass_flow_kg_h": 0.0,
                "dry_solids_mass_flow_kg_h": 0.0,
                "polymer_mass_flow_kg_h": 0.0,
            }
            for ts in tear_streams
        }

        warnings: List[str] = []
        last_result: Optional[Dict[str, Any]] = None

        for iteration in range(self.config.max_iterations):
            logger.debug(f"Iteration {iteration + 1}/{self.config.max_iterations}")

            # Solve with current tear guesses
            result = self._solve_with_tear_guesses(
                plant_definition, nodes, connections, tear_guesses
            )

            if not result["success"]:
                return result

            last_result = result

            # Update convergence states
            all_converged = True
            for ts in tear_streams:
                state = convergence_states[ts]
                state.previous_values = state.current_values.copy()

                # Get calculated values for tear stream from result
                if ts in result["streams"]:
                    stream = result["streams"][ts]
                    state.current_values = {
                        "mass_flow_kg_h": stream.get("mass_flow_kg_h", 0.0),
                        "dry_solids_mass_flow_kg_h": stream.get(
                            "dry_solids_mass_flow_kg_h", 0.0
                        ),
                        "polymer_mass_flow_kg_h": stream.get(
                            "polymer_mass_flow_kg_h", 0.0
                        ),
                    }

                    # Check convergence
                    state.is_converged = self._check_convergence(
                        state.previous_values, state.current_values
                    )
                    state.iterations = iteration + 1

                    if not state.is_converged:
                        all_converged = False

                    # Update guess for next iteration
                    tear_guesses[ts] = state.current_values

            if all_converged:
                logger.info(f"Converged in {iteration + 1} iterations")
                result["warnings"].append(
                    f"Recycle solved in {iteration + 1} iterations"
                )
                return result

        # Did not converge
        warnings.append(
            f"Recycle did not converge after {self.config.max_iterations} iterations"
        )

        if last_result:
            last_result["warnings"].extend(warnings)
            return last_result

        return {
            "success": False,
            "streams": {},
            "kpis": {},
            "warnings": warnings,
            "errors": [
                f"Recycle failed to converge after {self.config.max_iterations} iterations"
            ],
        }

    def _identify_tear_streams(
        self,
        cycles: List[List[str]],
        connections: List[Connection],
    ) -> List[str]:
        """
        Identify tear streams to break cycles.

        For simplicity, select one edge per cycle as the tear stream.
        In practice, this would use heuristics to select optimal tear points.
        """
        tear_streams: List[str] = []

        for cycle in cycles:
            if len(cycle) < 2:
                continue

            # Find an edge in this cycle
            for i in range(len(cycle) - 1):
                source = cycle[i]
                target = cycle[i + 1]

                # Find connection
                for conn in connections:
                    if conn.source_node == source and conn.target_node == target:
                        tear_id = f"{source}_to_{target}"
                        if tear_id not in tear_streams:
                            tear_streams.append(tear_id)
                        break

        return tear_streams

    def _solve_with_tear_guesses(
        self,
        plant_definition: Dict[str, Any],
        nodes: List[str],
        connections: List[Connection],
        tear_guesses: Dict[str, Dict[str, float]],
    ) -> Dict[str, Any]:
        """
        Solve plant with specified tear stream values.

        This is a placeholder that would modify the plant definition
        to inject tear stream guesses.
        """
        # For now, just call the regular solver
        # Full implementation would inject tear values as pseudo-feeds
        from app.engine.solver import solve_plant

        return solve_plant(plant_definition)

    def _check_convergence(
        self,
        previous: Dict[str, float],
        current: Dict[str, float],
    ) -> bool:
        """Check if stream values have converged."""
        if not previous:
            return False

        for key in current:
            prev_val = previous.get(key, 0.0)
            curr_val = current.get(key, 0.0)

            # Handle zero values
            if abs(curr_val) < 1e-10 and abs(prev_val) < 1e-10:
                continue

            # Relative error
            if abs(curr_val) > 1e-10:
                rel_error = abs(curr_val - prev_val) / abs(curr_val)
                if rel_error > self.config.tolerance:
                    return False

        return True

    def get_convergence_history(self) -> List[Dict[str, float]]:
        """Get convergence history for debugging/visualization."""
        return self._convergence_history.copy()
