import React from "react";
import type { Room, ID } from "../../model/types";

interface RoomsListProps {
  rooms: Room[];
  selectedRoomId: ID | null;
  onSelectRoom: (id: ID) => void;
  onRenameRoom: (id: ID, newName: string) => void;
  onDeleteRoom: (id: ID) => void;
}

export const RoomsList: React.FC<RoomsListProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onRenameRoom,
  onDeleteRoom,
}) => {
  return (
    <div className="w-80 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        🏠 Комнаты на этаже
        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
          {rooms.length}
        </span>
      </h3>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {rooms.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm italic">
            Нет комнат на этом этаже
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {rooms.map((room) => (
              <li
                key={room.id}
                className={`group flex items-center justify-between px-4 py-3 transition-all duration-200 cursor-pointer ${
                  selectedRoomId === room.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "hover:bg-gray-50 border-l-4 border-transparent"
                }`}
                onClick={() => onSelectRoom(room.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                    {room.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(room.width)}×{Math.round(room.height)}
                  </span>
                </div>

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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

