import React from "react";
import type { Room } from "../../model/types";

interface RoomElementProps {
  room: Room;
  isSelected: boolean;
  zoom: number;
  onMouseDown: (e: React.MouseEvent, room: Room) => void;
  onResizeMouseDown: (e: React.MouseEvent, room: Room) => void;
  editMode?: boolean;
}

export const RoomElement: React.FC<RoomElementProps> = ({
  room,
  isSelected,
  zoom,
  onMouseDown,
  onResizeMouseDown,
  editMode = true,
}) => {
  // 3D изометрическая проекция для режима просмотра
  const is3DMode = !editMode;
  const roomWidth = room.width || 50;
  const roomHeight = room.height || 30;
  const height3D = is3DMode ? 12 : 0; // Высота 3D объекта
  
  // Изометрические углы (30 градусов)
  const isoAngle = 30 * (Math.PI / 180);
  const cos30 = Math.cos(isoAngle);
  const sin30 = Math.sin(isoAngle);
  
  // Смещения для изометрической проекции
  const offsetX = height3D * cos30;
  const offsetY = height3D * sin30;
  
  return (
    <g transform={`translate(${room.x},${room.y})`} style={{ cursor: "pointer" }}>
      <defs>
        {/* Градиенты для 3D эффекта */}
        {is3DMode && (
          <>
            {/* Верхняя грань */}
            <linearGradient id={`room-top-${room.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isSelected ? "#93c5fd" : "#bae6fd"} stopOpacity="1" />
              <stop offset="100%" stopColor={isSelected ? "#60a5fa" : "#7dd3fc"} stopOpacity="0.95" />
            </linearGradient>
            {/* Передняя грань */}
            <linearGradient id={`room-front-${room.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isSelected ? "#60a5fa" : "#7dd3fc"} stopOpacity="0.9" />
              <stop offset="100%" stopColor={isSelected ? "#3b82f6" : "#38bdf8"} stopOpacity="0.85" />
            </linearGradient>
            {/* Правая грань */}
            <linearGradient id={`room-right-${room.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isSelected ? "#3b82f6" : "#38bdf8"} stopOpacity="0.85" />
              <stop offset="100%" stopColor={isSelected ? "#2563eb" : "#0ea5e9"} stopOpacity="0.75" />
            </linearGradient>
            {/* Тень */}
            <filter id={`room-shadow-3d-${room.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation={8 / zoom} />
              <feOffset dx={10 / zoom} dy={10 / zoom} result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}
      </defs>
      
      {room.shape ? (
        // Для полигонов пока оставляем простой вид (можно улучшить позже)
        <>
          {is3DMode && (
            <polygon
              points={room.shape.map((pt) => `${pt[0] + offsetX / zoom},${pt[1] + offsetY / zoom}`).join(" ")}
              fill="rgba(0, 0, 0, 0.15)"
              opacity="0.4"
            />
          )}
          <polygon
            points={room.shape.map((pt) => `${pt[0]},${pt[1]}`).join(" ")}
            fill={isSelected ? "rgba(37, 99, 235, 0.18)" : "rgba(56, 189, 248, 0.12)"}
            stroke={isSelected ? "#2563eb" : "#38bdf8"}
            strokeWidth={2 / zoom}
            onMouseDown={(e) => onMouseDown(e, room)}
            onClick={(e) => {
              e.stopPropagation();
              onMouseDown(e, room);
            }}
          />
        </>
      ) : (
        <>
          {/* Тень (основание) */}
          {is3DMode && (
            <rect
              x={offsetX / zoom}
              y={offsetY / zoom}
              width={roomWidth}
              height={roomHeight}
              rx={4}
              ry={4}
              fill="rgba(0, 0, 0, 0.15)"
              opacity="0.4"
            />
          )}
          
          {/* Верхняя грань (крыша) */}
          {is3DMode && (
            <polygon
              points={`
                ${0},${-offsetY / zoom}
                ${roomWidth},${-offsetY / zoom}
                ${roomWidth + offsetX / zoom},${0}
                ${offsetX / zoom},${0}
              `}
              fill={`url(#room-top-${room.id})`}
              stroke={isSelected ? "#2563eb" : "#38bdf8"}
              strokeWidth={1.5 / zoom}
              filter={`url(#room-shadow-3d-${room.id})`}
            />
          )}
          
          {/* Передняя грань */}
          <rect
            x={0}
            y={is3DMode ? -offsetY / zoom : 0}
            width={roomWidth}
            height={roomHeight}
            rx={4}
            ry={4}
            fill={is3DMode ? `url(#room-front-${room.id})` : (isSelected ? "rgba(37, 99, 235, 0.18)" : "rgba(56, 189, 248, 0.12)")}
            stroke={isSelected ? "#2563eb" : "#38bdf8"}
            strokeWidth={is3DMode ? 2.5 / zoom : 2 / zoom}
            filter={is3DMode ? `url(#room-shadow-3d-${room.id})` : undefined}
            onMouseDown={(e) => onMouseDown(e, room)}
            onClick={(e) => {
              e.stopPropagation();
              onMouseDown(e, room);
            }}
          />
          
          {/* Правая грань (бок) */}
          {is3DMode && (
            <polygon
              points={`
                ${roomWidth},${-offsetY / zoom}
                ${roomWidth + offsetX / zoom},${0}
                ${roomWidth + offsetX / zoom},${roomHeight}
                ${roomWidth},${roomHeight - offsetY / zoom}
              `}
              fill={`url(#room-right-${room.id})`}
              stroke={isSelected ? "#2563eb" : "#38bdf8"}
              strokeWidth={1.5 / zoom}
            />
          )}
        </>
      )}

      {/* Текст на передней грани */}
      <text
        x={roomWidth / 2}
        y={(roomHeight / 2) + (is3DMode ? -offsetY / zoom : 0)}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={is3DMode ? 13 / zoom : 12 / zoom}
        fontWeight={is3DMode ? "700" : "600"}
        fill={is3DMode ? "#ffffff" : (isSelected ? "#1e3a8a" : "#0f172a")}
        pointerEvents="none"
        style={{
          textShadow: is3DMode ? "0 1px 3px rgba(0,0,0,0.4)" : undefined,
        }}
      >
        {room.name}
      </text>

      {/* Ручка изменения размера только в режиме редактирования */}
      {!room.shape && editMode && (
        <rect
          x={(room.width || 50) - 8}
          y={(room.height || 30) - 8}
          width={8}
          height={8}
          rx={1.5}
          ry={1.5}
          fill="#2563eb"
          onMouseDown={(e) => onResizeMouseDown(e, room)}
          style={{ cursor: "nwse-resize" }}
        />
      )}
    </g>
  );
};

