"use client";

import React, { useState, useRef } from "react";
import type { Room, Preset } from "../model/types";
import { DEFAULT_PRESETS, DEFAULT_FLOOR_NAME } from "../lib/constants";
import { useBoundaryDrawing } from "../hooks/useBoundaryDrawing";
import { useZoomPan } from "../hooks/useZoomPan";
import { useRoomInteraction } from "../hooks/useRoomInteraction";
import { usePresetDrag } from "../hooks/usePresetDrag";
import { useFileOperations } from "../hooks/useFileOperations";
import { useCustomPreset } from "../hooks/useCustomPreset";
import { clientToCanvasCoords } from "../lib/helpers";
import { LeftPanel } from "./panels/LeftPanel";
import { BottomPanel } from "./panels/BottomPanel";
import { OfficeCanvas } from "./canvas/OfficeCanvas";
import { ZoomControls } from "./controls/ZoomControls";
import { CustomPresetModal } from "./modals/CustomPresetModal";

export const OfficeConstructor: React.FC = () => {
  const [floors, setFloors] = useState<Record<string, Room[]>>({
    [DEFAULT_FLOOR_NAME]: [],
  });
  const [currentFloor, setCurrentFloor] = useState<string>(DEFAULT_FLOOR_NAME);
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const boundaryDrawing = useBoundaryDrawing();
  const {
    isDrawingBoundary,
    boundaryPoints,
    boundaryClosed,
    addBoundaryPoint,
    closeBoundary,
    resetBoundary,
    forceCloseBoundary,
    setBoundaryPoints,
    setBoundaryClosed,
  } = boundaryDrawing;

  const { zoom, offset, handleWheel, startPan, handlePanMove, stopPan, zoomIn, zoomOut, resetView } =
    useZoomPan();

  const rooms = floors[currentFloor] || [];

  const roomInteraction = useRoomInteraction({
    svgRef,
    offset,
    zoom,
    rooms,
    currentFloor,
    setFloors,
  });

  const { draggingPreset, draggingPresetPos, startDragPreset } = usePresetDrag({
    svgRef,
    offset,
    zoom,
    boundaryClosed,
    boundaryPoints,
    currentFloor,
    setFloors,
    wrapperRef,
  });

  const { exportJSON, importJSON } = useFileOperations({
    floors,
    boundaryPoints,
    boundaryClosed,
    setFloors,
    setBoundaryPoints,
    setBoundaryClosed,
    setIsDrawingBoundary: boundaryDrawing.setIsDrawingBoundary,
  });

  const customPreset = useCustomPreset(setPresets);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingPreset) return;
    if (e.button !== 0) return;

    const p = clientToCanvasCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      svgElement: svgRef.current,
      offset,
      zoom,
    });
    addBoundaryPoint([p.x, p.y]);
  };

  const handleCanvasDblClick = () => {
    closeBoundary();
  };

  const handleMouseDownOnSvg = (e: React.MouseEvent) => {
    const me = e.nativeEvent as MouseEvent;
    startPan(me.clientX, me.clientY, me.button, e.shiftKey);
  };

  const handleMouseMoveOnWindow = (e: MouseEvent) => {
    handlePanMove(e.clientX, e.clientY);
  };

  const handleMouseUpOnWindow = () => {
    stopPan();
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMoveOnWindow);
    window.addEventListener("mouseup", handleMouseUpOnWindow);
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveOnWindow);
      window.removeEventListener("mouseup", handleMouseUpOnWindow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddFloor = () => {
    const name = prompt("Название нового этажа:");
    if (!name) return;
    if (floors[name]) {
      alert("Этаж существует");
      return;
    }
    setFloors((prev) => ({ ...prev, [name]: [] }));
    setCurrentFloor(name);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <LeftPanel
        floors={floors}
        currentFloor={currentFloor}
        onFloorSelect={setCurrentFloor}
        onAddFloor={handleAddFloor}
        onResetBoundary={resetBoundary}
        onForceCloseBoundary={forceCloseBoundary}
        onExport={exportJSON}
        onImport={importJSON}
      />

      <main className="flex-1 flex flex-col bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{currentFloor}</h1>
              <p className="text-sm text-gray-600">
                {isDrawingBoundary
                  ? "Режим рисования границ"
                  : boundaryClosed
                    ? "Границы закрыты"
                    : "Режим просмотра"}
              </p>
            </div>
            <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
          </div>
        </div>

        <div className="flex-1 p-6">
          <OfficeCanvas
            rooms={rooms}
            boundaryPoints={boundaryPoints}
            boundaryClosed={boundaryClosed}
            zoom={zoom}
            offset={offset}
            selectedRoomId={roomInteraction.selectedRoomId}
            draggingPreset={draggingPreset}
            draggingPresetPos={draggingPresetPos}
            onCanvasClick={handleCanvasClick}
            onCanvasDblClick={handleCanvasDblClick}
            onCanvasMouseDown={handleMouseDownOnSvg}
            onWheel={(e) => handleWheel(e, svgRef)}
            onRoomMouseDown={roomInteraction.startMoveRoom}
            onRoomResizeMouseDown={roomInteraction.startResize}
            onRoomMove={roomInteraction.onMoveDrag}
            onRoomResize={roomInteraction.onResizeMove}
            onRoomMoveEnd={roomInteraction.endMove}
            onRoomResizeEnd={roomInteraction.endResize}
            isMovingRoom={roomInteraction.isMovingRoom}
            isResizing={roomInteraction.isResizing}
            wrapperRef={wrapperRef}
            svgRef={svgRef}
          />
        </div>

        <BottomPanel
          presets={presets}
          rooms={rooms}
          selectedRoomId={roomInteraction.selectedRoomId}
          onPresetDragStart={startDragPreset}
          onAddCustomPreset={customPreset.openModal}
          onSelectRoom={roomInteraction.setSelectedRoomId}
          onRenameRoom={roomInteraction.renameRoom}
          onDeleteRoom={roomInteraction.deleteRoom}
        />
      </main>

      <CustomPresetModal
        isOpen={customPreset.isModalOpen}
        modalPolyPoints={customPreset.modalPolyPoints}
        modalSvgRef={customPreset.modalSvgRef}
        onModalClick={customPreset.handleModalClick}
        onClear={customPreset.clearModalPoints}
        onCancel={customPreset.closeModal}
        onSave={customPreset.addPreset}
      />
    </div>
  );
};

