import React from "react";

interface FloorsPanelProps {
  floors: Record<string, unknown[]>;
  currentFloor: string;
  onFloorSelect: (floor: string) => void;
  onAddFloor?: () => void;
}

export const FloorsPanel: React.FC<FloorsPanelProps> = ({
  floors,
  currentFloor,
  onFloorSelect,
  onAddFloor,
}) => {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Этажи</h3>
      <div className="flex flex-col gap-2">
        {Object.keys(floors).map((f) => (
          <button
            key={f}
            onClick={() => onFloorSelect(f)}
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              currentFloor === f
                ? "bg-blue-500 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
        {onAddFloor && (
          <button
            onClick={onAddFloor}
            className="mt-2 bg-blue-50 text-blue-600 py-2 px-4 font-medium text-sm hover:bg-blue-100 transition-colors border border-blue-200"
          >
            ➕ Добавить этаж
          </button>
        )}
      </div>
    </div>
  );
};

