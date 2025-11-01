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
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Границы этажа</h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={onResetBoundary}
          className="py-3 px-4 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
        >
          <span>✏️</span>
          <span>Рисовать границу</span>
        </button>
        <button
          onClick={onForceCloseBoundary}
          className="py-3 px-4 border border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200 flex items-center gap-2"
        >
          <span>🔒</span>
          <span>Закрыть границу</span>
        </button>
      </div>
    </div>
  );
};

