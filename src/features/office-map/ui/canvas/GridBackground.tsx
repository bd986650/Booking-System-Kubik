import React from "react";

interface GridBackgroundProps {
  offset: { x: number; y: number };
  zoom: number;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ offset, zoom }) => {
  return (
    <>
      <defs>
        {/* Мелкая сетка */}
        <pattern id="grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="transparent" />
          <path d="M20 0 L20 20 M0 20 L20 20" stroke="#e5e7eb" strokeWidth="1" />
        </pattern>
        {/* Крупная сетка */}
        <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="transparent" />
          <path d="M100 0 L100 100 M0 100 L100 100" stroke="#d1d5db" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="url(#grid-small)"
        transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}
      />
      <rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="url(#grid-large)"
        opacity={0.6}
        transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}
      />
    </>
  );
};

