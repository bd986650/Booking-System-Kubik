import React from "react";

interface BoundaryPolygonProps {
  boundaryPoints: number[][];
  boundaryClosed: boolean;
  zoom: number;
}

export const BoundaryPolygon: React.FC<BoundaryPolygonProps> = ({
  boundaryPoints,
  boundaryClosed,
  zoom,
}) => {
  const pointsString = boundaryPoints.map((p) => p.join(",")).join(" ");

  return (
    <>
      {!boundaryClosed && boundaryPoints.length > 0 && (
        <polyline
          points={pointsString}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          strokeDasharray="6,6"
        />
      )}
      {boundaryClosed && boundaryPoints.length > 2 && (
        <polygon
          points={pointsString}
          fill="rgba(59, 130, 246, 0.06)"
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          strokeDasharray="6,6"
        />
      )}
    </>
  );
};

