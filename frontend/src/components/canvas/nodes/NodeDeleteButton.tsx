/**
 * Delete button component for equipment nodes.
 * Shows in the top-right corner when the node is selected.
 */
import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { ConfirmDialog } from "../../ui/ConfirmDialog";

interface NodeDeleteButtonProps {
  nodeId: string;
  nodeLabel: string;
}

export function NodeDeleteButton({ nodeId, nodeLabel }: NodeDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteNode = useStore((state) => state.deleteNode);
  const selectedNodeId = useStore((state) => state.selectedNodeId);

  // Use store's selectedNodeId for accurate selection state
  const isSelected = selectedNodeId === nodeId;

  if (!isSelected) return null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection change
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    deleteNode(nodeId);
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600
                   flex items-center justify-center shadow-md border border-white
                   transition-all duration-150 z-50"
        title="Delete equipment"
      >
        <X className="w-3 h-3 text-white" strokeWidth={3} />
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${nodeLabel}"? This will also remove all connections to this equipment.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        variant="danger"
      />
    </>
  );
}
