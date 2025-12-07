import React from "react";

interface BoundaryControlsProps {
  onResetBoundary: () => void;
  onForceCloseBoundary: () => void;
}

export const BoundaryControls: React.FC<BoundaryControlsProps> = ({
  onResetBoundary,
  onForceCloseBoundary,
}) => {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Границы этажа</h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={onResetBoundary}
          className="py-2 px-4 border border-blue-400 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <span>✏️</span>
          <span>Рисовать границу</span>
        </button>
        <button
          onClick={onForceCloseBoundary}
          className="py-2 px-4 border border-green-400 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center gap-2"
        >
          <span>🔒</span>
          <span>Закрыть границу</span>
        </button>
      </div>
    </div>
  );
};

