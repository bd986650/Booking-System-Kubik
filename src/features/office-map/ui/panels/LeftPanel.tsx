import React from "react";
import Link from "next/link";
import { FloorsPanel } from "./FloorsPanel";
import { BoundaryControls } from "../controls/BoundaryControls";
import { FileControls } from "../controls/FileControls";
import { CustomSelect } from "@/shared/ui";

interface Location {
  id: number;
  name: string;
  city?: string;
  isActive?: boolean;
}

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
  // Для выбора офисов (в режиме просмотра для админов)
  locations?: Location[];
  loadingLocations?: boolean;
  selectedLocationId?: number | null;
  onLocationChange?: (locationId: number | null) => void;
  currentLocationName?: string;
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
  locations,
  loadingLocations = false,
  selectedLocationId,
  onLocationChange,
  currentLocationName,
}) => {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-lg">🏗️</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Карта офиса</h2>
            <p className="text-xs text-gray-500">{editMode ? "Редактирование" : "Просмотр"}</p>
          </div>
        </div>
      </div>

      {/* Контент с прокруткой */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Выбор офиса (для админов в режиме просмотра) */}
        {!editMode && locations && locations.length > 0 && onLocationChange && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Локация организации
            </label>
            <CustomSelect
              value={selectedLocationId ?? null}
              onChange={(val) => onLocationChange(val ? Number(val) : null)}
              options={locations.map((loc) => ({
                value: loc.id,
                label: `${loc.name}${loc.city ? ` (${loc.city})` : ""}${loc.isActive ? "" : " [Неактивна]"}`,
              }))}
              placeholder={loadingLocations ? "Загрузка локаций..." : "Выберите локацию"}
              disabled={loadingLocations}
              size="sm"
            />
          </div>
        )}

        {/* Текущая локация (для не-админов) */}
        {!editMode && !locations && currentLocationName && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Ваш офис
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm text-gray-700">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 mr-2" />
              <span className="font-medium">{currentLocationName}</span>
            </div>
          </div>
        )}

        {/* Текущий этаж */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Текущий этаж
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-900">
            {currentFloor}
          </div>
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
        <div className={`p-4 border ${
          spaceTypesCount > 0 && !loadingSpaceTypes
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <h4 className={`text-sm font-semibold mb-2 ${
            spaceTypesCount > 0 && !loadingSpaceTypes
              ? "text-green-800"
              : "text-yellow-800"
          }`}>
            {spaceTypesCount > 0 && !loadingSpaceTypes ? "✓" : "⚠️"} Сохранение
          </h4>
          <p className="text-xs mb-3 text-gray-600">
            Локация: <span className="font-medium">{locationId}</span>
          </p>
          {loadingSpaceTypes ? (
            <p className="text-xs text-yellow-700 mb-3">
              ⏳ Загрузка типов...
            </p>
          ) : spaceTypesCount === 0 ? (
            <div className="mb-3">
              <p className="text-xs text-yellow-700 mb-2">
                Типы пространств не найдены
              </p>
              <Link
                href="/dashboard?section=workspaces&tab=space-type"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Создать типы →
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
            className={`w-full px-4 py-2 text-sm font-medium transition-colors ${
              spaceTypesCount > 0 && !loadingSpaceTypes
                ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}
      </div>
    </aside>
  );
};

