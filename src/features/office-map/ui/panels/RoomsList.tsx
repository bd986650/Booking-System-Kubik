import React from "react";
import type { Room, ID } from "../../model/types";
import type { SpaceType } from "@/entities/booking";
import { CustomSelect } from "@/shared/ui";

interface RoomsListProps {
  rooms: Room[];
  selectedRoomId: ID | null;
  onSelectRoom: (id: ID) => void;
  onRenameRoom?: (id: ID, newName: string) => void;
  onDeleteRoom?: (id: ID) => void;
  spaceTypes?: SpaceType[];
  roomSpaceTypes?: Record<string, number>;
  roomCapacities?: Record<string, number>;
  onSpaceTypeChange?: (roomId: ID, spaceTypeId: number) => void;
  onCapacityChange?: (roomId: ID, capacity: number) => void;
  editMode?: boolean;
}

export const RoomsList: React.FC<RoomsListProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onRenameRoom,
  onDeleteRoom,
  spaceTypes = [],
  roomSpaceTypes = {},
  roomCapacities = {},
  onSpaceTypeChange,
  onCapacityChange,
  editMode = true,
}) => {
  return (
    <div className="flex flex-col">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Список помещений</h3>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {rooms.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">
            <div className="text-3xl mb-2">🏢</div>
            <p className="italic">Нет помещений на этом этаже</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {rooms.map((room) => (
              <li
                key={room.id}
                className={`group flex items-start justify-between px-4 py-3 transition-colors duration-150 cursor-pointer ${
                  selectedRoomId === room.id
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
                onClick={() => onSelectRoom(room.id)}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 text-sm mb-1 truncate">
                    {room.name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {Math.round(room.width)}×{Math.round(room.height)} м
                  </span>
                  {editMode && spaceTypes.length > 0 && (
                    <div className="mt-1 flex gap-2">
                      <div onClick={(e) => e.stopPropagation()} className="min-w-[120px]">
                        <CustomSelect
                          value={roomSpaceTypes[room.id] || null}
                          onChange={(val) => {
                            if (onSpaceTypeChange && val) {
                              onSpaceTypeChange(room.id, Number(val));
                          }
                        }}
                          options={[
                            ...spaceTypes.map((st) => ({
                              value: st.id,
                              label: st.type,
                            })),
                          ]}
                          placeholder="Тип..."
                          size="sm"
                        />
                      </div>
                      <input
                        type="number"
                        className="text-xs border rounded px-2 py-1 w-16"
                        placeholder="Вместимость"
                        value={roomCapacities[room.id] || ""}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (onCapacityChange) {
                            onCapacityChange(room.id, Number(e.target.value) || 1);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        min="1"
                      />
                    </div>
                  )}
                </div>

                {editMode && onRenameRoom && onDeleteRoom && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      title="Переименовать"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt("Введите новое название комнаты:", room.name);
                        if (!newName) return;
                        onRenameRoom(room.id, newName);
                      }}
                      className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-600 transition"
                    >
                      ✏️
                    </button>

                    <button
                      title="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRoom(room.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

