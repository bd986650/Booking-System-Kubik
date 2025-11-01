import type { Preset } from "../model/types";
import { genId } from "./helpers";

export const DEFAULT_PRESETS: Preset[] = [
  { id: genId("p_"), name: "Квадрат", type: "rect", width: 80, height: 80 },
  { id: genId("p_"), name: "Прямоугольник", type: "rect", width: 140, height: 80 },
];

export const DEFAULT_FLOOR_NAME = "1 этаж";

