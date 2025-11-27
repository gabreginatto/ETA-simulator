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
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useStore } from "../../store/useStore";
import { FeedNode } from "./nodes/FeedNode";
import { PolymerNode } from "./nodes/PolymerNode";
import { DewateringNode } from "./nodes/DewateringNode";
import { StreamEdge } from "./edges/StreamEdge";

// Register custom node types
const nodeTypes: NodeTypes = {
  feed: FeedNode,
  polymer: PolymerNode,
  dewatering: DewateringNode,
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        // MVP: Lock topology - no connecting new edges
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
              case "polymer":
                return "#7c3aed"; // violet
              case "dewatering":
                return "#ea580c"; // orange
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
