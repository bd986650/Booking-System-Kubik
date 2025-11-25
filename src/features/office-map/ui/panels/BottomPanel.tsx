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
    <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex gap-8">
        {editMode && (
          <PresetsPanel
            presets={presets}
            onPresetDragStart={onPresetDragStart}
            onAddCustomPreset={onAddCustomPreset}
          />
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
        />
      </div>
    </div>
  );
};

