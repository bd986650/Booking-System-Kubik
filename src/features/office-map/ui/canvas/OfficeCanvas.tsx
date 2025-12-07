import React from "react";
import type { Room, Preset, ID } from "../../model/types";
import { GridBackground } from "./GridBackground";
import { BoundaryPolygon } from "./BoundaryPolygon";
import { RoomElement } from "./RoomElement";
import { DragOverlay } from "./DragOverlay";
import { ZoomControls } from "../controls/ZoomControls";

interface OfficeCanvasProps {
  rooms: Room[];
  boundaryPoints: number[][];
  boundaryClosed: boolean;
  isDrawingBoundary: boolean;
  zoom: number;
  offset: { x: number; y: number };
  selectedRoomId: ID | null;
  selectedRoom: Room | null;
  roomSpaceTypes?: Record<string, number>;
  roomCapacities?: Record<string, number>;
  onCloseRoomInfo?: () => void;
  draggingPreset: Preset | null;
  draggingPresetPos: { x: number; y: number } | null;
  onCanvasClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  onCanvasDblClick: (e: React.MouseEvent) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  onRoomMouseDown: (e: React.MouseEvent, room: Room) => void;
  onRoomResizeMouseDown: (e: React.MouseEvent, room: Room) => void;
  onRoomMove: (e: React.MouseEvent) => void;
  onRoomResize: (e: React.MouseEvent) => void;
  onRoomMoveEnd: () => void;
  onRoomResizeEnd: () => void;
  isMovingRoom: boolean;
  isResizing: boolean;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  editMode?: boolean;
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({
  rooms,
  boundaryPoints,
  boundaryClosed,
  isDrawingBoundary,
  zoom,
  offset,
  selectedRoomId,
  selectedRoom,
  roomSpaceTypes = {},
  roomCapacities = {},
  onCloseRoomInfo,
  draggingPreset,
  draggingPresetPos,
  onCanvasClick,
  onCanvasDblClick,
  onCanvasMouseDown,
  onWheel,
  onRoomMouseDown,
  onRoomResizeMouseDown,
  onRoomMove,
  onRoomResize,
  onRoomMoveEnd,
  onRoomResizeEnd,
  isMovingRoom,
  isResizing,
  wrapperRef,
  svgRef,
  onZoomIn,
  onZoomOut,
  onResetView,
  editMode = true,
}) => {
  // Вычисляем позицию попапа рядом с выбранной комнатой
  const getPopupPosition = () => {
    if (!selectedRoom || !svgRef.current || !wrapperRef.current) return null;
    
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    
    // Координаты комнаты в canvas координатах
    const roomX = selectedRoom.x;
    const roomY = selectedRoom.y;
    const roomWidth = selectedRoom.width || 50;
    
    // Преобразуем в экранные координаты
    const screenX = (roomX * zoom) + offset.x;
    const screenY = (roomY * zoom) + offset.y;
    
    // Позиция попапа справа от комнаты (или слева, если не помещается)
    const popupWidth = 280;
    const popupHeight = 120;
    const spacing = 10;
    
    let left = screenX + (roomWidth * zoom) + spacing;
    let top = screenY;
    
    // Если не помещается справа, показываем слева
    if (left + popupWidth > wrapperRect.width) {
      left = screenX - popupWidth - spacing;
    }
    
    // Если не помещается снизу, показываем сверху
    if (top + popupHeight > wrapperRect.height) {
      top = screenY - popupHeight;
    }
    
    // Ограничиваем границами контейнера
    left = Math.max(10, Math.min(left, wrapperRect.width - popupWidth - 10));
    top = Math.max(10, Math.min(top, wrapperRect.height - popupHeight - 10));
    
    return { left, top };
  };
  
  const popupPos = getPopupPosition();

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-full overflow-hidden ${
        editMode ? "bg-white" : "bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100"
      }`}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => {
          onCanvasMouseDown(e);
          onCanvasClick(e);
        }}
        onDoubleClick={onCanvasDblClick}
        onWheel={onWheel}
        style={{ userSelect: "none" }}
        className={editMode ? "bg-white" : "bg-transparent"}
      >
        {/* Сетка только в режиме редактирования */}
        {editMode && <GridBackground offset={offset} zoom={zoom} />}

        <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
          {isDrawingBoundary && (
          <BoundaryPolygon
            boundaryPoints={boundaryPoints}
            boundaryClosed={boundaryClosed}
            zoom={zoom}
          />
          )}

          {rooms.map((room) => (
            <RoomElement
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              zoom={zoom}
              onMouseDown={onRoomMouseDown}
              onResizeMouseDown={onRoomResizeMouseDown}
              editMode={editMode}
            />
          ))}
        </g>
      </svg>

      <DragOverlay draggingPreset={draggingPreset} draggingPresetPos={draggingPresetPos} />

      {/* Попап с информацией о выбранной комнате */}
      {selectedRoom && popupPos && (
        <div
          className="absolute z-40 bg-white border-2 border-blue-400 shadow-xl pointer-events-auto"
          style={{
            left: `${popupPos.left}px`,
            top: `${popupPos.top}px`,
            width: '280px',
          }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm truncate">{selectedRoom.name}</h3>
            {onCloseRoomInfo && (
              <button
                onClick={onCloseRoomInfo}
                className="text-white/80 hover:text-white transition-colors ml-2 flex-shrink-0"
                title="Закрыть"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Размер:</span>
              <span className="font-semibold text-gray-900">
                {Math.round(selectedRoom.width)} × {Math.round(selectedRoom.height)} м
              </span>
            </div>
            {roomSpaceTypes[selectedRoom.id] && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Тип ID:</span>
                <span className="font-semibold text-gray-900">{roomSpaceTypes[selectedRoom.id]}</span>
              </div>
            )}
            {roomCapacities[selectedRoom.id] && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Вместимость:</span>
                <span className="font-semibold text-blue-600">{roomCapacities[selectedRoom.id]} мест</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Управление масштабом */}
      {zoom !== undefined && onZoomIn && onZoomOut && onResetView && (
        <div className="absolute top-4 right-4 z-30 pointer-events-auto">
          <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onResetView} />
        </div>
      )}

      {/* Легенда по цветам и статусам помещений */}
      <div className="pointer-events-none absolute left-4 bottom-4 z-10 bg-white px-3 py-2 border border-slate-200 text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-sky-100 border border-sky-400" />
          <span>Помещение (доступно)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-sky-200 border border-sky-600" />
          <span>Выбранное помещение</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm border border-dashed border-sky-500" />
          <span>Контур этажа</span>
        </div>
      </div>

      <div
        onMouseMove={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          onRoomMove(e);
          onRoomResize(e);
        }}
        onMouseUp={() => {
          onRoomMoveEnd();
          onRoomResizeEnd();
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          pointerEvents: isMovingRoom || isResizing ? "auto" : "none",
          cursor: isResizing ? "nwse-resize" : isMovingRoom ? "move" : "default",
        }}
      />
    </div>
  );
};

