import React from "react";

interface GridBackgroundProps {
  offset: { x: number; y: number };
  zoom: number;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ offset, zoom }) => {
  return (
    <>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="transparent" />
          <path d="M20 0 L20 20 M0 20 L20 20" stroke="#e5e7eb" strokeWidth="1" />
        </pattern>
      </defs>
      <rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="url(#grid)"
        transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}
      />
    </>
  );
};

