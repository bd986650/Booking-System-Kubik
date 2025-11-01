import { useState, useRef } from "react";
import { clamp } from "../lib/helpers";

export const useZoomPan = () => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const panState = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const handleWheel = (e: React.WheelEvent, svgRef: React.RefObject<SVGSVGElement | null>) => {
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

  const startPan = (clientX: number, clientY: number, button: number, shiftKey: boolean) => {
    if (button === 2 || (button === 0 && shiftKey)) {
      panState.current.dragging = true;
      panState.current.lastX = clientX;
      panState.current.lastY = clientY;
    }
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (panState.current.dragging) {
      const dx = clientX - panState.current.lastX;
      const dy = clientY - panState.current.lastY;
      panState.current.lastX = clientX;
      panState.current.lastY = clientY;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
    }
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

  return {
    zoom,
    offset,
    handleWheel,
    startPan,
    handlePanMove,
    stopPan,
    zoomIn,
    zoomOut,
    resetView,
  };
};

