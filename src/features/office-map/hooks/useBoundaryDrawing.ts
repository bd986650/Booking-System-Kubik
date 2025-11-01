import { useState } from "react";

export const useBoundaryDrawing = () => {
  const [isDrawingBoundary, setIsDrawingBoundary] = useState<boolean>(true);
  const [boundaryPoints, setBoundaryPoints] = useState<number[][]>([]);
  const [boundaryClosed, setBoundaryClosed] = useState<boolean>(false);

  const addBoundaryPoint = (point: [number, number]) => {
    if (!boundaryClosed && isDrawingBoundary) {
      setBoundaryPoints((prev) => [...prev, point]);
    }
  };

  const closeBoundary = () => {
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

  const forceCloseBoundary = () => {
    setIsDrawingBoundary(false);
    setBoundaryClosed(true);
  };

  return {
    isDrawingBoundary,
    boundaryPoints,
    boundaryClosed,
    addBoundaryPoint,
    closeBoundary,
    resetBoundary,
    forceCloseBoundary,
    setBoundaryPoints,
    setBoundaryClosed,
    setIsDrawingBoundary,
  };
};

