import React from "react";
import Link from "next/link";
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
  onSaveSpaces?: () => void;
  saving?: boolean;
  locationId?: number | null;
  spaceTypesCount?: number;
  loadingSpaceTypes?: boolean;
  editMode?: boolean; // Режим редактирования
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
  onSaveSpaces,
  saving = false,
  locationId,
  spaceTypesCount = 0,
  loadingSpaceTypes = false,
  editMode = true,
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
        onAddFloor={editMode ? onAddFloor : undefined}
      />

      {editMode && (
        <>
          <BoundaryControls
            onResetBoundary={onResetBoundary}
            onForceCloseBoundary={onForceCloseBoundary}
          />

          <FileControls onExport={onExport} onImport={onImport} />
        </>
      )}

      {locationId && onSaveSpaces && (
        <div className={`p-4 rounded-lg border ${
          spaceTypesCount > 0 && !loadingSpaceTypes
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <h4 className={`text-sm font-semibold mb-2 ${
            spaceTypesCount > 0 && !loadingSpaceTypes
              ? "text-green-800"
              : "text-yellow-800"
          }`}>
            Сохранение на сервер
          </h4>
          <p className="text-xs mb-2 text-gray-700">
            Локация: {locationId}
          </p>
          {loadingSpaceTypes ? (
            <p className="text-xs text-yellow-700 mb-3">
              ⏳ Загрузка типов пространств...
            </p>
          ) : spaceTypesCount === 0 ? (
            <div className="mb-3">
              <p className="text-xs text-yellow-700 mb-2">
                ⚠️ Типы пространств не найдены
              </p>
              <Link
                href="/dashboard?section=workspaces&tab=space-type"
                className="text-xs text-blue-600 hover:text-blue-800 underline block"
              >
                Создать типы пространств →
              </Link>
            </div>
          ) : (
            <p className="text-xs text-green-700 mb-3">
              ✓ Найдено типов: {spaceTypesCount}
            </p>
          )}
          <button
            onClick={onSaveSpaces}
            disabled={saving || loadingSpaceTypes || spaceTypesCount === 0}
            className={`w-full px-4 py-2 rounded text-sm font-semibold transition-colors ${
              spaceTypesCount > 0 && !loadingSpaceTypes
                ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving ? "Сохранение..." : "Сохранить пространства"}
          </button>
        </div>
      )}

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

