import React from "react";
import type { Preset } from "../../model/types";
import { PresetsPanel } from "./PresetsPanel";
import { RoomsList } from "./RoomsList";
import type { Room, ID } from "../../model/types";

interface BottomPanelProps {
  presets: Preset[];
  rooms: Room[];
  selectedRoomId: ID | null;
  onPresetDragStart: (preset: Preset, clientX: number, clientY: number) => void;
  onAddCustomPreset: () => void;
  onSelectRoom: (id: ID) => void;
  onRenameRoom: (id: ID, newName: string) => void;
  onDeleteRoom: (id: ID) => void;
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
}) => {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex gap-8">
        <PresetsPanel
          presets={presets}
          onPresetDragStart={onPresetDragStart}
          onAddCustomPreset={onAddCustomPreset}
        />
        <RoomsList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
          onRenameRoom={onRenameRoom}
          onDeleteRoom={onDeleteRoom}
        />
      </div>
    </div>
  );
};

