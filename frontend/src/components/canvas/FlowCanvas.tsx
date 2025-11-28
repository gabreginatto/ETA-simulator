/**
 * Main React Flow canvas component for the plant layout.
 */
import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useStore } from "../../store/useStore";
import { FeedNode } from "./nodes/FeedNode";
import { PumpNode } from "./nodes/PumpNode";
import { PolymerNode } from "./nodes/PolymerNode";
import { DewateringNode } from "./nodes/DewateringNode";
import { ClarifierNode } from "./nodes/ClarifierNode";
import { ThickenerNode } from "./nodes/ThickenerNode";
import { StreamEdge } from "./edges/StreamEdge";
import {
  getPortType,
  isConnectionValid,
  type EquipmentType,
} from "../../types";

// Register custom node types
const nodeTypes: NodeTypes = {
  feed: FeedNode,
  pump: PumpNode,
  polymer: PolymerNode,
  dewatering: DewateringNode,
  clarifier: ClarifierNode,
  thickener: ThickenerNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
  stream: StreamEdge,
};

export function FlowCanvas() {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const selectNode = useStore((state) => state.selectNode);

  // Handle node selection
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: any[] }) => {
      if (selectedNodes.length > 0) {
        selectNode(selectedNodes[0].id);
      } else {
        selectNode(null);
      }
    },
    [selectNode]
  );

  // Wrap the store's onNodesChange to handle React Flow's change format
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  /**
   * Validates if a connection between two nodes is allowed based on port types.
   * This is used to prevent invalid edge creation when nodesConnectable is enabled.
   */
  const isValidConnectionFn = useCallback(
    (connection: Connection | { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => {
      const { source, target, sourceHandle, targetHandle } = connection;

      if (!source || !target || !sourceHandle || !targetHandle) {
        return false;
      }

      // Find source and target node types
      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (!sourceNode || !targetNode) {
        return false;
      }

      const sourceType = sourceNode.type as EquipmentType;
      const targetType = targetNode.type as EquipmentType;

      // Get port types
      const sourcePortType = getPortType(sourceType, sourceHandle, "output");
      const targetPortType = getPortType(targetType, targetHandle, "input");

      if (!sourcePortType || !targetPortType) {
        return false;
      }

      // Validate connection compatibility
      return isConnectionValid(sourcePortType, targetPortType);
    },
    [nodes]
  );

  /**
   * Handler for when a new connection is made.
   * Currently disabled (nodesConnectable=false), but prepared for future use.
   */
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      // Validate first
      if (!isValidConnectionFn(connection)) {
        console.warn("Invalid connection rejected:", connection);
        return;
      }

      // In the future, this would add the edge to the graph
      console.log("Connection made (not persisted - nodesConnectable=false):", connection);
    },
    [isValidConnectionFn]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSelectionChange={handleSelectionChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnectionFn}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        // MVP: Lock topology - no connecting new edges
        // Set nodesConnectable={true} to enable edge creation with port type validation
        edgesReconnectable={false}
        edgesFocusable={false}
        nodesConnectable={false}
        // Allow node dragging and selection
        nodesDraggable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        // Interaction settings
        panOnDrag={true}
        zoomOnScroll={true}
        panOnScroll={false}
        // Appearance
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.5}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-right"
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case "feed":
                return "#0891b2"; // cyan
              case "pump":
                return "#06b6d4"; // cyan-500
              case "polymer":
                return "#7c3aed"; // violet
              case "dewatering":
                return "#ea580c"; // orange
              case "clarifier":
                return "#3b82f6"; // blue-500
              case "thickener":
                return "#10b981"; // emerald-500
              default:
                return "#64748b"; // slate
            }
          }}
          nodeStrokeWidth={3}
          pannable
          zoomable
          position="bottom-left"
          style={{ marginLeft: 10, marginBottom: 10 }}
        />
      </ReactFlow>
    </div>
  );
}
