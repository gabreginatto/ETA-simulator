/**
 * Process flow list component for mobile.
 * Displays equipment as a vertical list of cards representing the process flow.
 */
import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { EquipmentCard } from "./EquipmentCard";
import { useStore } from "../../store/useStore";

interface ProcessFlowListProps {
  onSelectEquipment: (nodeId: string) => void;
}

/**
 * Sorts nodes in process flow order based on edges.
 * Starts from nodes with no incoming edges (sources) and follows connections.
 */
function sortNodesInFlowOrder(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  // Build adjacency map: source -> targets
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    outgoing.get(edge.source)!.push(edge.target);

    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target)!.push(edge.source);
  });

  // Find source nodes (no incoming edges)
  const sourceNodes = nodes.filter(
    (node) => !incoming.has(node.id) || incoming.get(node.id)!.length === 0
  );

  // BFS to order nodes
  const ordered: Node[] = [];
  const visited = new Set<string>();
  const queue = [...sourceNodes];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;

    visited.add(node.id);
    ordered.push(node);

    // Add connected nodes to queue
    const targets = outgoing.get(node.id) || [];
    targets.forEach((targetId) => {
      const targetNode = nodes.find((n) => n.id === targetId);
      if (targetNode && !visited.has(targetId)) {
        queue.push(targetNode);
      }
    });
  }

  // Add any unconnected nodes at the end
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  });

  return ordered;
}

export function ProcessFlowList({ onSelectEquipment }: ProcessFlowListProps) {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const deleteNode = useStore((state) => state.deleteNode);

  // Sort nodes in process flow order
  const orderedNodes = useMemo(
    () => sortNodesInFlowOrder(nodes, edges),
    [nodes, edges]
  );

  if (orderedNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-surface-highlight rounded-2xl flex items-center justify-center mb-4">
          <GitBranch className="w-8 h-8 text-content-subtle" />
        </div>
        <h3 className="text-lg font-medium text-content-primary mb-2">
          No Equipment Yet
        </h3>
        <p className="text-sm text-content-secondary max-w-xs">
          Tap the <span className="font-semibold">Add</span> tab below to add equipment to your treatment process
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-0">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-content-primary">
          Process Flow
        </h2>
        <p className="text-sm text-content-secondary">
          {orderedNodes.length} equipment in sequence
        </p>
      </div>

      {/* Equipment cards */}
      <div className="space-y-0">
        {orderedNodes.map((node, index) => (
          <EquipmentCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isFirst={index === 0}
            isLast={index === orderedNodes.length - 1}
            onSelect={onSelectEquipment}
            onDelete={deleteNode}
          />
        ))}
      </div>
    </div>
  );
}
