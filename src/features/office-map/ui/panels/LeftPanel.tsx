import React from "react";
import { FloorsPanel } from "./FloorsPanel";
import { BoundaryControls } from "../controls/BoundaryControls";
import { FileControls } from "../controls/FileControls";

interface LeftPanelProps {
  floors: Record<string, unknown[]>;
  currentFloor: string;
  onFloorSelect: (floor: string) => void;
  onAddFloor: () => void;
  onResetBoundary: () => void;
  onForceCloseBoundary: () => void;
  onExport: () => void;
  onImport: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  floors,
  currentFloor,
  onFloorSelect,
  onAddFloor,
  onResetBoundary,
  onForceCloseBoundary,
  onExport,
  onImport,
}) => {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">🏗️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Конструктор этажа</h2>
      </div>

      <FloorsPanel
        floors={floors}
        currentFloor={currentFloor}
        onFloorSelect={onFloorSelect}
        onAddFloor={onAddFloor}
      />

      <BoundaryControls
        onResetBoundary={onResetBoundary}
        onForceCloseBoundary={onForceCloseBoundary}
      />

      <FileControls onExport={onExport} onImport={onImport} />

      <div className="mt-auto p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Управление</h4>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Пан: правый клик + drag или Shift + drag</li>
          <li>• Zoom: колесо мыши</li>
          <li>• Рисование: клик — точки, dblclick — закрыть</li>
        </ul>
      </div>
    </aside>
  );
};

