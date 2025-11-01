import React from "react";
import type { Preset } from "../../model/types";

interface DragOverlayProps {
  draggingPreset: Preset | null;
  draggingPresetPos: { x: number; y: number } | null;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({
  draggingPreset,
  draggingPresetPos,
}) => {
  if (!draggingPreset || !draggingPresetPos) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: draggingPresetPos.x + 8,
        top: draggingPresetPos.y + 8,
        pointerEvents: "none",
        zIndex: 60,
      }}
      className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3"
    >
      <div className="text-sm font-semibold text-blue-600">{draggingPreset.name}</div>
      <div className="text-xs text-gray-500">Перетащите на карту</div>
    </div>
  );
};

