import React from "react";
import type { Room } from "../../model/types";

interface RoomElementProps {
  room: Room;
  isSelected: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, room: Room) => void;
  onResizeMouseDown: (e: React.MouseEvent, room: Room) => void;
}

export const RoomElement: React.FC<RoomElementProps> = ({
  room,
  isSelected,
  zoom,
  onMouseDown,
  onResizeMouseDown,
}) => {
  return (
    <g transform={`translate(${room.x},${room.y})`} style={{ cursor: "move" }}>
      {room.shape ? (
        <polygon
          points={room.shape.map((pt) => `${pt[0]},${pt[1]}`).join(" ")}
          fill={isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.1)"}
          stroke={isSelected ? "#3b82f6" : "#10b981"}
          strokeWidth={2 / zoom}
          onMouseDown={(e) => onMouseDown(e, room)}
        />
      ) : (
        <rect
          width={room.width}
          height={room.height}
          fill={isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.1)"}
          stroke={isSelected ? "#3b82f6" : "#10b981"}
          strokeWidth={2 / zoom}
          onMouseDown={(e) => onMouseDown(e, room)}
        />
      )}

      <text
        x={(room.width || 50) / 2}
        y={(room.height || 30) / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={12 / zoom}
        fontWeight="600"
        fill={isSelected ? "#1e40af" : "#065f46"}
        pointerEvents="none"
      >
        {room.name}
      </text>

      {!room.shape && (
        <rect
          x={(room.width || 50) - 8}
          y={(room.height || 30) - 8}
          width={8}
          height={8}
          fill="#3b82f6"
          onMouseDown={(e) => onResizeMouseDown(e, room)}
          style={{ cursor: "nwse-resize" }}
        />
      )}
    </g>
  );
};

