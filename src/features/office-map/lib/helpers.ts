import type { ID, Preset, Room } from "../model/types";

export const genId = (prefix = ""): ID =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));

export interface ClientToCanvasParams {
  clientX: number;
  clientY: number;
  svgElement: SVGSVGElement | null;
  offset: { x: number; y: number };
  zoom: number;
}

export const clientToCanvasCoords = ({
  clientX,
  clientY,
  svgElement,
  offset,
  zoom,
}: ClientToCanvasParams): { x: number; y: number } => {
  if (!svgElement) return { x: clientX, y: clientY };
  const rect = svgElement.getBoundingClientRect();
  const x = (clientX - rect.left - offset.x) / zoom;
  const y = (clientY - rect.top - offset.y) / zoom;
  return { x, y };
};

export const createRoomFromPreset = (
  preset: Preset,
  x: number,
  y: number,
  genIdFn: (prefix?: string) => ID
): Room => {
  const id = genIdFn("r_");

  if (preset.type === "rect") {
    return {
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
    return {
      id,
      name: preset.name,
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: h,
      shape: poly,
    };
  }
};

