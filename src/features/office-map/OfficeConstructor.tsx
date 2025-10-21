"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * OfficeConstructor — single-file implementation without external libs.
 *
 * Features:
 * - Draw dashed boundary polygon (click to add points, dblclick to close)
 * - Grid background (SVG)
 * - Zoom (wheel) and Pan (right mouse button drag or space+drag)
 * - Presets (square, rect) + add custom polygon via modal
 * - Drag & drop preset to canvas to create rooms
 * - Move rooms (drag), resize via handle
 * - Export/Import JSON
 *
 * Note: keep sizes in "canvas coordinates". Zoom/pan implemented using transform on <g>.
 */

/* ----------------------- Types ----------------------- */
type ID = string;

interface Room {
  id: ID;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: number[][]; // optional polygon shape (relative points) if custom
}

interface Preset {
  id: ID;
  name: string;
  type: "rect" | "poly";
  width?: number;
  height?: number;
  poly?: number[][];
}

/* -------------------- Helpers -------------------- */
const genId = (prefix = "") =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

/* -------------------- Component -------------------- */
const OfficeConstructor: React.FC = () => {
  // floors (each floor has rooms)
  const [floors, setFloors] = useState<Record<string, Room[]>>({
    "1 этаж": [],
  });
  const [currentFloor, setCurrentFloor] = useState<string>("1 этаж");

  // canvas transform (pan & zoom)
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // drawing boundary polygon
  const [isDrawingBoundary, setIsDrawingBoundary] = useState<boolean>(true);
  const [boundaryPoints, setBoundaryPoints] = useState<number[][]>([]); // array of [x,y]
  const [boundaryClosed, setBoundaryClosed] = useState<boolean>(false);

  // presets
  const [presets, setPresets] = useState<Preset[]>(() => [
    { id: genId("p_"), name: "Квадрат", type: "rect", width: 80, height: 80 },
    { id: genId("p_"), name: "Прямоугольник", type: "rect", width: 140, height: 80 },
  ]);

  // modal for custom preset
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPolyPoints, setModalPolyPoints] = useState<number[][]>([]);

  // dragging state
  const [draggingPreset, setDraggingPreset] = useState<Preset | null>(null);
  const [draggingPresetPos, setDraggingPresetPos] = useState<{ x: number; y: number } | null>(null);

  // selected room for edit
  const [selectedRoomId, setSelectedRoomId] = useState<ID | null>(null);
  const [isMovingRoom, setIsMovingRoom] = useState(false);
  const [moveOffset, setMoveOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizeRoomId, setResizeRoomId] = useState<ID | null>(null);

  // refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // utility: get pointer in canvas coords (taking zoom & offset into account)
  function clientToCanvasCoords(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const rect = svg.getBoundingClientRect();
    // coordinates relative to svg element
    const x = (clientX - rect.left - offset.x) / zoom;
    const y = (clientY - rect.top - offset.y) / zoom;
    return { x, y };
  }

  // get rooms of current floor
  const rooms = floors[currentFloor] || [];

  /* -------------------- Boundary drawing handlers -------------------- */
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    // if drawing boundary and not closed, add point
    // ignore if dragging a preset
    if (draggingPreset) return;

    const svg = svgRef.current;
    if (!svg) return;

    // left button only
    if (e.button !== 0) return;

    const p = clientToCanvasCoords(e.clientX, e.clientY);
    if (!boundaryClosed && isDrawingBoundary) {
      setBoundaryPoints((prev) => [...prev, [p.x, p.y]]);
    }
  };

  const handleCanvasDblClick = (e: React.MouseEvent) => {
    // double click closes boundary polygon
    if (boundaryPoints.length >= 3 && !boundaryClosed) {
      setBoundaryClosed(true);
      setIsDrawingBoundary(false);
    }
  };

  const resetBoundary = () => {
    setBoundaryPoints([]);
    setBoundaryClosed(false);
    setIsDrawingBoundary(true);
  };

  /* -------------------- Zoom / Pan -------------------- */
  const panState = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    // adjust zoom with clamp
    const factor = Math.exp(-delta / 1000); // smooth
    const newZoom = clamp(zoom * factor, 0.3, 3);
    // zoom to cursor: adjust offset so that point under cursor remains under cursor
    const svg = svgRef.current;
    if (!svg) {
      setZoom(newZoom);
      return;
    }
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // canvas coords before
    const beforeX = (mx - offset.x) / zoom;
    const beforeY = (my - offset.y) / zoom;
    // after zoom, compute new offset to keep beforeX at same screen pos
    const newOffsetX = mx - beforeX * newZoom;
    const newOffsetY = my - beforeY * newZoom;
    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseDownOnSvg = (e: React.MouseEvent) => {
    // right button or space to pan
    const me = e.nativeEvent as MouseEvent;
    if (me.button === 2 || (me.button === 0 && e.shiftKey)) {
      panState.current.dragging = true;
      panState.current.lastX = e.clientX;
      panState.current.lastY = e.clientY;
    }
  };

  const handleMouseMoveOnWindow = (e: MouseEvent) => {
    // pan
    if (panState.current.dragging) {
      const dx = e.clientX - panState.current.lastX;
      const dy = e.clientY - panState.current.lastY;
      panState.current.lastX = e.clientX;
      panState.current.lastY = e.clientY;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
    }

    // dragging a preset following cursor (screen coords)
    if (draggingPreset) {
      setDraggingPresetPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUpOnWindow = (e: MouseEvent) => {
    panState.current.dragging = false;

    // drop preset if dragging
    if (draggingPreset) {
      // ⛔ Проверяем, что границы этажа замкнуты
      if (!boundaryClosed || boundaryPoints.length < 3) {
        alert("Сначала нарисуйте и закройте границы этажа перед добавлением комнат!");
        setDraggingPreset(null);
        setDraggingPresetPos(null);
        return;
      }

      const { x, y } = clientToCanvasCoords(e.clientX, e.clientY);
      const preset = draggingPreset;
      const id = genId("r_");
      let newRoom: Room;

      if (preset.type === "rect") {
        newRoom = {
          id,
          name: preset.name,
          x: x - (preset.width || 60) / 2,
          y: y - (preset.height || 60) / 2,
          width: preset.width || 60,
          height: preset.height || 60,
        };
      } else {
        const poly = preset.poly || [[0, 0], [40, 0], [40, 40], [0, 40]];
        const xs = poly.map((p) => p[0]);
        const ys = poly.map((p) => p[1]);
        const minX = Math.min(...xs),
          maxX = Math.max(...xs),
          minY = Math.min(...ys),
          maxY = Math.max(...ys);
        const w = maxX - minX || 50;
        const h = maxY - minY || 50;
        newRoom = {
          id,
          name: preset.name,
          x: x - w / 2,
          y: y - h / 2,
          width: w,
          height: h,
          shape: poly,
        };
      }

      setFloors((prev) => ({
        ...prev,
        [currentFloor]: [...(prev[currentFloor] || []), newRoom],
      }));
      setDraggingPreset(null);
      setDraggingPresetPos(null);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMoveOnWindow);
    window.addEventListener("mouseup", handleMouseUpOnWindow);
    // contextmenu disable on svg wrapper to allow right-drag pan
    const wrapper = wrapperRef.current;
    const prevent = (ev: Event) => ev.preventDefault();
    wrapper?.addEventListener("contextmenu", prevent);
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveOnWindow);
      window.removeEventListener("mouseup", handleMouseUpOnWindow);
      wrapper?.removeEventListener("contextmenu", prevent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingPreset, offset, zoom]);

  /* -------------------- Rooms drag & resize -------------------- */
  const startMoveRoom = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setSelectedRoomId(room.id);
    setIsMovingRoom(true);
    const canvasP = clientToCanvasCoords(e.clientX, e.clientY);
    setMoveOffset({ x: canvasP.x - room.x, y: canvasP.y - room.y });
  };

  const onMoveDrag = (e: React.MouseEvent) => {
    if (!isMovingRoom || !selectedRoomId) return;
    const canvasP = clientToCanvasCoords(e.clientX, e.clientY);
    setFloors((prev) => ({
      ...prev,
      [currentFloor]: prev[currentFloor].map((r) =>
        r.id === selectedRoomId ? { ...r, x: canvasP.x - moveOffset.x, y: canvasP.y - moveOffset.y } : r
      ),
    }));
  };

  const endMove = () => {
    setIsMovingRoom(false);
  };

  // resizing via handle
  const startResize = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setResizeRoomId(room.id);
    setIsResizing(true);
  };

  const onResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !resizeRoomId) return;
    const canvasP = clientToCanvasCoords(e.clientX, e.clientY);
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

  /* -------------------- Preset modal (draw custom polygon) -------------------- */
  const modalSvgRef = useRef<SVGSVGElement | null>(null);
  const handleModalClick = (e: React.MouseEvent) => {
    const svg = modalSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setModalPolyPoints((p) => [...p, [x, y]]);
  };
  const handleModalDbl = () => {
    // do nothing special; user will press Done
  };
  const modalAddPreset = () => {
    if (modalPolyPoints.length < 3) {
      alert("Нарисуйте полигона с минимум 3 точками.");
      return;
    }
    const id = genId("p_");
    setPresets((p) => [
      ...p,
      { id, name: `Кастом ${p.length + 1}`, type: "poly", poly: modalPolyPoints },
    ]);
    setModalPolyPoints([]);
    setIsModalOpen(false);
  };
  const modalClear = () => setModalPolyPoints([]);

  /* -------------------- Export / Import -------------------- */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ floors, boundary: { points: boundaryPoints, closed: boundaryClosed } }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "office_map.json";
    a.click();
  };

  const importJSON = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        setFloors(data.floors || {});
        if (data.boundary) {
          setBoundaryPoints(data.boundary.points || []);
          setBoundaryClosed(!!data.boundary.closed);
          setIsDrawingBoundary(!(data.boundary && data.boundary.closed));
        }
      } catch {
        alert("Ошибка чтения JSON");
      }
    };
    reader.readAsText(file);
  };

  /* -------------------- UI render -------------------- */
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left panel */}
      <aside className="w-80 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🏗️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Конструктор этажа</h2>
        </div>

        {/* Floors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Этажи</h3>
          <div className="flex flex-col gap-2">
            {Object.keys(floors).map((f) => (
              <button
                key={f}
                onClick={() => setCurrentFloor(f)}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${currentFloor === f
                  ? "bg-blue-500 text-white shadow-md"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => {
                const name = prompt("Название нового этажа:");
                if (!name) return;
                if (floors[name]) {
                  alert("Этаж существует");
                  return;
                }
                setFloors((prev) => ({ ...prev, [name]: [] }));
                setCurrentFloor(name);
              }}
              className="mt-2 bg-blue-50 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
            >
              ➕ Добавить этаж
            </button>
          </div>
        </div>

        {/* Boundary Controls */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Границы этажа</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                resetBoundary();
              }}
              className="py-3 px-4 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
            >
              <span>✏️</span>
              <span>Рисовать границу</span>
            </button>
            <button
              onClick={() => {
                setIsDrawingBoundary(false);
                setBoundaryClosed(true);
              }}
              className="py-3 px-4 border border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200 flex items-center gap-2"
            >
              <span>🔒</span>
              <span>Закрыть границу</span>
            </button>
          </div>
        </div>

        {/* File Operations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Файлы</h3>
          <div className="flex gap-2">
            <button
              onClick={exportJSON}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 justify-center"
            >
              <span>💾</span>
              <span>Export</span>
            </button>
            <label className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 justify-center cursor-pointer">
              <span>📂</span>
              <span>Import</span>
              <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-auto p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Управление</h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Пан: правый клик + drag или Shift + drag</li>
            <li>• Zoom: колесо мыши</li>
            <li>• Рисование: клик — точки, dblclick — закрыть</li>
          </ul>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col bg-gray-100">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{currentFloor}</h1>
              <p className="text-sm text-gray-600">
                {isDrawingBoundary ? "Режим рисования границ" : boundaryClosed ? "Границы закрыты" : "Режим просмотра"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
                <span className="text-sm text-gray-600">Zoom: </span>
                <span className="font-semibold text-gray-800">{(zoom * 100).toFixed(0)}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoom((z) => clamp(z * 1.2, 0.3, 3))}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-lg">+</span>
                </button>
                <button
                  onClick={() => setZoom((z) => clamp(z / 1.2, 0.3, 3))}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-lg">-</span>
                </button>
                <button
                  onClick={() => { setOffset({ x: 0, y: 0 }); setZoom(1); }}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-lg">⌂</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 p-6">
          <div ref={wrapperRef} className="relative w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* SVG canvas */}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => {
                handleMouseDownOnSvg(e);
                handleCanvasClick(e);
              }}
              onDoubleClick={handleCanvasDblClick}
              onWheel={handleWheel}
              style={{ userSelect: "none" }}
              className="bg-white"
            >
              {/* defs: grid pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill="transparent" />
                  <path d="M20 0 L20 20 M0 20 L20 20" stroke="#e5e7eb" strokeWidth="1" />
                </pattern>

                <clipPath id="boundaryClip">
                  {boundaryClosed && boundaryPoints.length > 2 ? (
                    <polygon points={boundaryPoints.map((p) => p.join(",")).join(" ")} />
                  ) : (
                    <rect x="-10000" y="-10000" width="20000" height="20000" />
                  )}
                </clipPath>
              </defs>

              {/* background grid using pattern, transformed with pan/zoom */}
              <rect
                x={-10000}
                y={-10000}
                width={20000}
                height={20000}
                fill="url(#grid)"
                transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}
              />

              {/* main group containing boundary and rooms, transformed by pan/zoom */}
              <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
                {/* dashed boundary polyline */}
                {!boundaryClosed && boundaryPoints.length > 0 && (
                  <polyline
                    points={boundaryPoints.map((p) => p.join(",")).join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2 / zoom}
                    strokeDasharray="6,6"
                  />
                )}

                {/* closed boundary filled lightly and dashed stroke */}
                {boundaryClosed && boundaryPoints.length > 2 && (
                  <>
                    <polygon
                      points={boundaryPoints.map((p) => p.join(",")).join(" ")}
                      fill="rgba(59, 130, 246, 0.06)"
                      stroke="#3b82f6"
                      strokeWidth={2 / zoom}
                      strokeDasharray="6,6"
                    />
                  </>
                )}

                {/* rendering rooms */}
                {rooms.map((r) => {
                  const isSelected = selectedRoomId === r.id;
                  return (
                    <g key={r.id} transform={`translate(${r.x},${r.y})`} style={{ cursor: "move" }}>
                      {r.shape ? (
                        <polygon
                          points={r.shape.map((pt) => `${pt[0]},${pt[1]}`).join(" ")}
                          fill={isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.1)"}
                          stroke={isSelected ? "#3b82f6" : "#10b981"}
                          strokeWidth={2 / zoom}
                          onMouseDown={(e) => startMoveRoom(e, r)}
                        />
                      ) : (
                        <rect
                          width={r.width}
                          height={r.height}
                          fill={isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.1)"}
                          stroke={isSelected ? "#3b82f6" : "#10b981"}
                          strokeWidth={2 / zoom}
                          onMouseDown={(e) => startMoveRoom(e, r)}
                        />
                      )}

                      {/* room name */}
                      <text
                        x={(r.width || 50) / 2}
                        y={(r.height || 30) / 2}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fontSize={12 / zoom}
                        fontWeight="600"
                        fill={isSelected ? "#1e40af" : "#065f46"}
                        pointerEvents="none"
                      >
                        {r.name}
                      </text>

                      {/* resize handle */}
                      {!r.shape && (
                        <rect
                          x={(r.width || 50) - 8}
                          y={(r.height || 30) - 8}
                          width={8}
                          height={8}
                          fill="#3b82f6"
                          onMouseDown={(e) => startResize(e, r)}
                          style={{ cursor: "nwse-resize" }}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* overlay for dragging preset (follows cursor) */}
            {draggingPreset && draggingPresetPos && (
              <div
                style={{
                  position: "fixed",
                  left: draggingPresetPos.x + 8,
                  top: draggingPresetPos.y + 8,
                  pointerEvents: "none",
                  zIndex: 60,
                }}
                className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3"
              >
                <div className="text-sm font-semibold text-blue-600">{draggingPreset.name}</div>
                <div className="text-xs text-gray-500">Перетащите на карту</div>
              </div>
            )}

            {/* mouse move / up handlers on wrapper to handle room move/resize */}
            <div
              onMouseMove={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                onMoveDrag(e);
                onResizeMove(e);
              }}
              onMouseUp={() => {
                endMove();
                endResize();
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                // ✅ Разрешаем события мыши при перетаскивании
                pointerEvents: isMovingRoom || isResizing ? "auto" : "none",
                cursor: isResizing ? "nwse-resize" : isMovingRoom ? "move" : "default",
              }}
            />
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex gap-8">
            {/* Presets Section */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Пресеты комнат</h3>
              <div className="flex gap-3">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDraggingPreset(p);
                      setDraggingPresetPos({ x: e.clientX, y: e.clientY });
                    }}
                    className="p-4 bg-white border border-gray-300 rounded-lg cursor-grab hover:border-blue-500 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-20 h-16 flex items-center justify-center mb-2">
                      {p.type === "rect" ? (
                        <div
                          style={{
                            width: (p.width ?? 40) * 0.8,
                            height: (p.height ?? 30) * 0.8,
                            background: "linear-gradient(135deg, #e6f2ff, #9ec5ff)",
                            border: "2px solid #3b82f6",
                            borderRadius: "4px"
                          }}
                        />
                      ) : (
                        <svg width={64} height={48}>
                          <polygon
                            points={(p.poly || [[0, 0], [40, 0], [40, 40], [0, 40]]).map(pt => `${pt[0] * 0.8},${pt[1] * 0.8}`).join(" ")}
                            fill="url(#gradient)"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#e6f2ff" />
                              <stop offset="100%" stopColor="#9ec5ff" />
                            </linearGradient>
                          </defs>
                        </svg>
                      )}
                    </div>
                    <div className="text-center text-sm font-medium text-gray-700">{p.name}</div>
                  </div>
                ))}

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center w-24"
                >
                  <span className="text-2xl text-gray-400 mb-1">+</span>
                  <span className="text-sm text-gray-600">Добавить свою</span>
                </button>
              </div>
            </div>

            {/* Rooms List */}
            {/* Rooms List */}
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
                    {rooms.map((r) => (
                      <li
                        key={r.id}
                        className={`group flex items-center justify-between px-4 py-3 transition-all duration-200 cursor-pointer ${selectedRoomId === r.id
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                        onClick={() => setSelectedRoomId(r.id)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                            {r.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(r.width)}×{Math.round(r.height)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            title="Переименовать"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newName = prompt("Введите новое название комнаты:", r.name);
                              if (!newName) return;
                              setFloors((prev) => ({
                                ...prev,
                                [currentFloor]: prev[currentFloor].map((room) =>
                                  room.id === r.id ? { ...room, name: newName } : room
                                ),
                              }));
                            }}
                            className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-600 transition"
                          >
                            ✏️
                          </button>

                          <button
                            title="Удалить"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFloors((prev) => ({
                                ...prev,
                                [currentFloor]: prev[currentFloor].filter((x) => x.id !== r.id),
                              }));
                              if (selectedRoomId === r.id) setSelectedRoomId(null);
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

          </div>
        </div>
      </main>

      {/* Modal for custom preset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-[700px] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Создание кастомной фигуры</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Кликайте на область ниже чтобы добавить точки. Для создания фигуры нужно минимум 3 точки.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4 overflow-hidden">
              <svg
                ref={modalSvgRef}
                onClick={handleModalClick}
                onDoubleClick={handleModalDbl}
                width={600}
                height={300}
                className="bg-gray-50 cursor-crosshair"
              >
                <rect x={0} y={0} width="100%" height="100%" fill="#fafafa" />
                {modalPolyPoints.length > 0 && (
                  <>
                    <polygon
                      points={modalPolyPoints.map(p => p.join(",")).join(" ")}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <polyline
                      points={modalPolyPoints.map(p => p.join(",")).join(" ")}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    {modalPolyPoints.map((pt, i) => (
                      <circle key={i} cx={pt[0]} cy={pt[1]} r={4} fill="#3b82f6" />
                    ))}
                  </>
                )}
              </svg>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Точок: {modalPolyPoints.length}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={modalClear}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Очистить
                </button>
                <button
                  onClick={() => { setIsModalOpen(false); setModalPolyPoints([]); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Отмена
                </button>
                <button
                  onClick={modalAddPreset}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Сохранить фигуру
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeConstructor;