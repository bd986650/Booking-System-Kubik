"use client";

import React, { useRef, useEffect, useState } from "react";
import type { SpaceItem } from "@/entities/booking";
import { bookingApi } from "@/entities/booking";

interface BookingMapProps {
  locationId: number;
  floorNumber: number;
  spaces: SpaceItem[];
  selectedSpaceId: number | null;
  accessToken: string;
  onSpaceClick: (space: SpaceItem) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const GridBackground: React.FC<{ offset: { x: number; y: number }; zoom: number }> = ({ offset, zoom }) => (
  <>
    <defs>
      {/* Мелкая сетка */}
      <pattern id="booking-grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="transparent" />
        <path d="M20 0 L20 20 M0 20 L20 20" stroke="#e5e7eb" strokeWidth="1" />
      </pattern>
      {/* Крупная сетка */}
      <pattern id="booking-grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="transparent" />
        <path d="M100 0 L100 100 M0 100 L100 100" stroke="#d1d5db" strokeWidth="1.2" />
      </pattern>
    </defs>
    <rect
      x={-10000}
      y={-10000}
      width={20000}
      height={20000}
      fill="url(#booking-grid-small)"
      transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}
    />
    <rect
      x={-10000}
      y={-10000}
      width={20000}
      height={20000}
      fill="url(#booking-grid-large)"
      opacity={0.6}
      transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}
    />
  </>
);

export const BookingMap: React.FC<BookingMapProps> = ({
  locationId,
  floorNumber,
  spaces,
  selectedSpaceId,
  accessToken,
  onSpaceClick,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setBoundaryPoints] = useState<number[][]>([]);
  const [, setBoundaryClosed] = useState(false);

  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const panState = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY;
    const factor = Math.exp(-delta / 1000);
    const newZoom = clamp(zoom * factor, 0.3, 3);

    const svg = svgRef.current;
    if (!svg) {
      setZoom(newZoom);
      return;
    }

    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const beforeX = (mx - offset.x) / zoom;
    const beforeY = (my - offset.y) / zoom;
    const newOffsetX = mx - beforeX * newZoom;
    const newOffsetY = my - beforeY * newZoom;
    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const startPan = (e: React.MouseEvent<SVGSVGElement>) => {
    const { clientX, clientY, button, shiftKey } = e;
    if (button === 2 || (button === 0 && shiftKey)) {
      panState.current.dragging = true;
      panState.current.lastX = clientX;
      panState.current.lastY = clientY;
    }
  };

  const handlePanMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!panState.current.dragging) return;
    const { clientX, clientY } = e;
    const dx = clientX - panState.current.lastX;
    const dy = clientY - panState.current.lastY;
    panState.current.lastX = clientX;
    panState.current.lastY = clientY;
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const stopPan = () => {
    panState.current.dragging = false;
  };

  const zoomIn = () => {
    setZoom((z) => clamp(z * 1.2, 0.3, 3));
  };

  const zoomOut = () => {
    setZoom((z) => clamp(z / 1.2, 0.3, 3));
  };

  const resetView = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Загружаем данные этажа
  useEffect(() => {
    if (!locationId || !accessToken) return;

    const loadFloorData = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getSpacesByLocationAndFloor(locationId, floorNumber, accessToken);
        if (res.data?.floor?.polygon && res.data.floor.polygon.length > 0) {
            const points = res.data.floor.polygon.map((p) => [p.x, p.y]);
            setBoundaryPoints(points);
            setBoundaryClosed(true);
        } else {
          setBoundaryPoints([]);
          setBoundaryClosed(false);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных этажа:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFloorData();
  }, [locationId, floorNumber, accessToken]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка карты...</p>
          </div>
        </div>
      ) : (
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onWheel={handleWheel}
          onMouseDown={startPan}
          onMouseMove={handlePanMove}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
          style={{ userSelect: "none", cursor: "grab" }}
          className="bg-white"
        >
          <GridBackground offset={offset} zoom={zoom} />

          <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
            {/* Пространства - фильтруем только для текущего этажа */}
            {spaces
              .filter((space) => space.floor.floorNumber === floorNumber)
              .map((space) => {
                const isSelected = selectedSpaceId === space.id;
                const bounds = space.bounds;
                
                return (
                  <g
                    key={space.id}
                    transform={`translate(${bounds.x},${bounds.y})`}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSpaceClick(space)}
                  >
                    <rect
                      width={bounds.width}
                      height={bounds.height}
                      rx={4}
                      ry={4}
                      fill={
                        isSelected
                          ? "rgba(37, 99, 235, 0.18)"
                          : "rgba(56, 189, 248, 0.18)"
                      }
                      stroke={isSelected ? "#2563eb" : "#38bdf8"}
                      strokeWidth={2 / zoom}
                      className="hover:opacity-80 transition-opacity"
                    />
                    <text
                      x={bounds.width / 2}
                      y={bounds.height / 2 - 4}
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fontSize={Math.max(10, 12 / zoom)}
                      fontWeight="600"
                      fill={isSelected ? "#1e3a8a" : "#0f172a"}
                      pointerEvents="none"
                    >
                      {space.spaceType}
                    </text>
                    <text
                      x={bounds.width / 2}
                      y={bounds.height / 2 + 10}
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fontSize={Math.max(8, 10 / zoom)}
                      fill={isSelected ? "#1e3a8a" : "#0f172a"}
                      pointerEvents="none"
                    >
                      {space.capacity} мест
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
      )}

      {/* Элементы управления зумом */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Увеличить"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Уменьшить"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Сбросить вид"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.5M20 4v5h-.5M4 20v-5h.5M20 20v-5h-.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

