import React from "react";

interface FloorsPanelProps {
  floors: Record<string, unknown[]>;
  currentFloor: string;
  onFloorSelect: (floor: string) => void;
  onAddFloor: () => void;
}

export const FloorsPanel: React.FC<FloorsPanelProps> = ({
  floors,
  currentFloor,
  onFloorSelect,
  onAddFloor,
}) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Этажи</h3>
      <div className="flex flex-col gap-2">
        {Object.keys(floors).map((f) => (
          <button
            key={f}
            onClick={() => onFloorSelect(f)}
            className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              currentFloor === f
                ? "bg-blue-500 text-white shadow-md"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={onAddFloor}
          className="mt-2 bg-blue-50 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
        >
          ➕ Добавить этаж
        </button>
      </div>
    </div>
  );
};

