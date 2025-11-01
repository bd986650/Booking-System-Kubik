import { useState, useEffect } from "react";
import type { Preset, Room } from "../model/types";
import { createRoomFromPreset, genId } from "../lib/helpers";
import { clientToCanvasCoords } from "../lib/helpers";

interface UsePresetDragParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  offset: { x: number; y: number };
  zoom: number;
  boundaryClosed: boolean;
  boundaryPoints: number[][];
  currentFloor: string;
  setFloors: React.Dispatch<React.SetStateAction<Record<string, Room[]>>>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export const usePresetDrag = ({
  svgRef,
  offset,
  zoom,
  boundaryClosed,
  boundaryPoints,
  currentFloor,
  setFloors,
  wrapperRef,
}: UsePresetDragParams) => {
  const [draggingPreset, setDraggingPreset] = useState<Preset | null>(null);
  const [draggingPresetPos, setDraggingPresetPos] = useState<{ x: number; y: number } | null>(null);

  const startDragPreset = (preset: Preset, clientX: number, clientY: number) => {
    setDraggingPreset(preset);
    setDraggingPresetPos({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggingPreset) {
      setDraggingPresetPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!draggingPreset) return;

    // Проверяем, что границы этажа замкнуты
    if (!boundaryClosed || boundaryPoints.length < 3) {
      alert("Сначала нарисуйте и закройте границы этажа перед добавлением комнат!");
      setDraggingPreset(null);
      setDraggingPresetPos(null);
      return;
    }

    const { x, y } = clientToCanvasCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      svgElement: svgRef.current,
      offset,
      zoom,
    });

    const newRoom = createRoomFromPreset(draggingPreset, x, y, genId);
    setFloors((prev) => ({
      ...prev,
      [currentFloor]: [...(prev[currentFloor] || []), newRoom],
    }));

    setDraggingPreset(null);
    setDraggingPresetPos(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    const wrapper = wrapperRef.current;
    const prevent = (ev: Event) => ev.preventDefault();
    wrapper?.addEventListener("contextmenu", prevent);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      wrapper?.removeEventListener("contextmenu", prevent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingPreset, offset, zoom]);

  return {
    draggingPreset,
    draggingPresetPos,
    startDragPreset,
  };
};

