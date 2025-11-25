import { useState } from "react";
import type { Room, ID } from "../model/types";
import { clientToCanvasCoords } from "../lib/helpers";

interface UseRoomInteractionParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  offset: { x: number; y: number };
  zoom: number;
  rooms: Room[];
  currentFloor: string;
  setFloors: React.Dispatch<React.SetStateAction<Record<string, Room[]>>>;
  editMode?: boolean;
}

export const useRoomInteraction = ({
  svgRef,
  offset,
  zoom,
  rooms: _rooms,
  currentFloor,
  setFloors,
  editMode = true,
}: UseRoomInteractionParams) => {
  const [selectedRoomId, setSelectedRoomId] = useState<ID | null>(null);
  const [isMovingRoom, setIsMovingRoom] = useState(false);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeRoomId, setResizeRoomId] = useState<ID | null>(null);

  const startMoveRoom = (e: React.MouseEvent, room: Room) => {
    if (!editMode) return; // В режиме просмотра не перемещаем
    e.stopPropagation();
    setSelectedRoomId(room.id);
    setIsMovingRoom(true);
    const canvasP = clientToCanvasCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      svgElement: svgRef.current,
      offset,
      zoom,
    });
    setMoveOffset({ x: canvasP.x - room.x, y: canvasP.y - room.y });
  };

  const onMoveDrag = (e: React.MouseEvent) => {
    if (!isMovingRoom || !selectedRoomId) return;
    const canvasP = clientToCanvasCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      svgElement: svgRef.current,
      offset,
      zoom,
    });
    setFloors((prev) => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map((r) =>
        r.id === selectedRoomId
          ? { ...r, x: canvasP.x - moveOffset.x, y: canvasP.y - moveOffset.y }
          : r
      ),
    }));
  };

  const endMove = () => {
    setIsMovingRoom(false);
  };

  const startResize = (e: React.MouseEvent, room: Room) => {
    if (!editMode) return; // В режиме просмотра не изменяем размер
    e.stopPropagation();
    setResizeRoomId(room.id);
    setIsResizing(true);
  };

  const onResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !resizeRoomId) return;
    const canvasP = clientToCanvasCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      svgElement: svgRef.current,
      offset,
      zoom,
    });
    setFloors((prev) => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map((r) => {
        if (r.id !== resizeRoomId) return r;
        const newW = Math.max(20, canvasP.x - r.x);
        const newH = Math.max(20, canvasP.y - r.y);
        return { ...r, width: newW, height: newH };
      }),
    }));
  };

  const endResize = () => {
    setIsResizing(false);
    setResizeRoomId(null);
  };

  const renameRoom = (roomId: ID, newName: string) => {
    setFloors((prev) => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map((room) =>
        room.id === roomId ? { ...room, name: newName } : room
      ),
    }));
  };

  const deleteRoom = (roomId: ID) => {
    setFloors((prev) => ({
      ...prev,
      [currentFloor]: prev[currentFloor].filter((x) => x.id !== roomId),
    }));
    if (selectedRoomId === roomId) setSelectedRoomId(null);
  };

  return {
    selectedRoomId,
    isMovingRoom,
    isResizing,
    setSelectedRoomId,
    startMoveRoom,
    onMoveDrag,
    endMove,
    startResize,
    onResizeMove,
    endResize,
    renameRoom,
    deleteRoom,
  };
};

