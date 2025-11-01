import React from "react";
import type { Room, Preset, ID } from "../../model/types";
import { GridBackground } from "./GridBackground";
import { BoundaryPolygon } from "./BoundaryPolygon";
import { RoomElement } from "./RoomElement";
import { DragOverlay } from "./DragOverlay";

interface OfficeCanvasProps {
  rooms: Room[];
  boundaryPoints: number[][];
  boundaryClosed: boolean;
  zoom: number;
  offset: { x: number; y: number };
  selectedRoomId: ID | null;
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
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({
  rooms,
  boundaryPoints,
  boundaryClosed,
  zoom,
  offset,
  selectedRoomId,
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
}) => {

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
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
        className="bg-white"
      >
        <defs>
          <clipPath id="boundaryClip">
            {boundaryClosed && boundaryPoints.length > 2 ? (
              <polygon points={boundaryPoints.map((p) => p.join(",")).join(" ")} />
            ) : (
              <rect x="-10000" y="-10000" width="20000" height="20000" />
            )}
          </clipPath>
        </defs>

        <GridBackground offset={offset} zoom={zoom} />

        <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
          <BoundaryPolygon
            boundaryPoints={boundaryPoints}
            boundaryClosed={boundaryClosed}
            zoom={zoom}
          />

          {rooms.map((room) => (
            <RoomElement
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              zoom={zoom}
              onMouseDown={onRoomMouseDown}
              onResizeMouseDown={onRoomResizeMouseDown}
            />
          ))}
        </g>
      </svg>

      <DragOverlay draggingPreset={draggingPreset} draggingPresetPos={draggingPresetPos} />

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

