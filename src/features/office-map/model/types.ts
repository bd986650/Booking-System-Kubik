export type ID = string;

export interface Room {
  id: ID;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: number[][]; // optional polygon shape (relative points) if custom
}

export interface Preset {
  id: ID;
  name: string;
  type: "rect" | "poly";
  width?: number;
  height?: number;
  poly?: number[][];
}

export interface Boundary {
  points: number[][];
  closed: boolean;
}

export interface OfficeMapData {
  floors: Record<string, Room[]>;
  boundary: Boundary;
}

