/**
 * Main React Flow canvas component for the plant layout.
 */
import { useCallback, useRef, DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useStore, useTheme } from "../../store/useStore";
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

// Inner component that uses ReactFlow hooks (must be inside ReactFlowProvider)
function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const selectNode = useStore((state) => state.selectNode);
  const addNode = useStore((state) => state.addNode);
  const addEdge = useStore((state) => state.addEdge);
  const deleteNode = useStore((state) => state.deleteNode);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const theme = useTheme();

  // Theme-aware dot color - very subtle in both modes
  const dotColor = theme === "dark"
    ? "rgba(148, 163, 184, 0.015)"  // Nearly invisible in dark mode
    : "rgba(15, 23, 42, 0.04)";      // Very subtle in light mode

  // Handle node selection
  // Note: We only update selection when a node IS selected, not when all nodes are deselected.
  // This prevents the properties panel from closing when clicking on form inputs.
  // Users can close the panel explicitly using the X button.
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: any[] }) => {
      if (selectedNodes.length > 0) {
        selectNode(selectedNodes[0].id);
      }
      // Don't clear selection when no nodes are selected - this prevents
      // the panel from closing when interacting with the properties panel
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
   */
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      // Validate first
      if (!isValidConnectionFn(connection)) {
        console.warn("Invalid connection rejected:", connection);
        return;
      }

      // Add the edge to the store
      if (connection.source && connection.target && connection.sourceHandle && connection.targetHandle) {
        addEdge(connection.source, connection.target, connection.sourceHandle, connection.targetHandle);
      }
    },
    [isValidConnectionFn, addEdge]
  );

  // Handle drag over for drop zone
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop to add new node
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as EquipmentType;
      if (!type) return;

      // Get position from drop location
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Handle keyboard delete
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    },
    [selectedNodeId, deleteNode]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full relative"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
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
        // Enable edge creation with port type validation
        edgesReconnectable={false}
        edgesFocusable={false}
        nodesConnectable={true}
        // Enable drag-and-drop
        onDragOver={onDragOver}
        onDrop={onDrop}
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
          color={dotColor}
        />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}

// Export wrapped component with ReactFlowProvider
export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
