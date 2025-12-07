import React from "react";
import type { Preset } from "../../model/types";
import { PresetsPanel } from "./PresetsPanel";
import { RoomsList } from "./RoomsList";
import type { Room, ID } from "../../model/types";
import type { SpaceType } from "@/entities/booking";

interface BottomPanelProps {
  presets: Preset[];
  rooms: Room[];
  selectedRoomId: ID | null;
  onPresetDragStart: (preset: Preset, clientX: number, clientY: number) => void;
  onAddCustomPreset: () => void;
  onSelectRoom: (id: ID) => void;
  onRenameRoom: (id: ID, newName: string) => void;
  onDeleteRoom: (id: ID) => void;
  spaceTypes?: SpaceType[];
  roomSpaceTypes?: Record<string, number>;
  roomCapacities?: Record<string, number>;
  onSpaceTypeChange?: (roomId: ID, spaceTypeId: number) => void;
  onCapacityChange?: (roomId: ID, capacity: number) => void;
  editMode?: boolean; // Режим редактирования
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  presets,
  rooms,
  selectedRoomId,
  onPresetDragStart,
  onAddCustomPreset,
  onSelectRoom,
  onRenameRoom,
  onDeleteRoom,
  spaceTypes,
  roomSpaceTypes,
  roomCapacities,
  onSpaceTypeChange,
  onCapacityChange,
  editMode = true,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Заголовок панели */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-base font-semibold text-gray-900">Помещения</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {rooms.length} {rooms.length === 1 ? "помещение" : "помещений"} на этаже
        </p>
      </div>

      {/* Контент с прокруткой */}
      <div className="flex-1 overflow-y-auto p-4">
        {editMode && (
          <div className="mb-4">
            <PresetsPanel
              presets={presets}
              onPresetDragStart={onPresetDragStart}
              onAddCustomPreset={onAddCustomPreset}
            />
          </div>
        )}
        <RoomsList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
          onRenameRoom={editMode ? onRenameRoom : undefined}
          onDeleteRoom={editMode ? onDeleteRoom : undefined}
          spaceTypes={spaceTypes}
          roomSpaceTypes={roomSpaceTypes}
          roomCapacities={roomCapacities}
          onSpaceTypeChange={editMode ? onSpaceTypeChange : undefined}
          onCapacityChange={editMode ? onCapacityChange : undefined}
          editMode={editMode}
        />
      </div>
    </div>
  );
};

