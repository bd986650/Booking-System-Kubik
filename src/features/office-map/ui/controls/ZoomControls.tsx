import React from "react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-white px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
        <span className="text-sm text-gray-600">Zoom: </span>
        <span className="font-semibold text-gray-800">{(zoom * 100).toFixed(0)}%</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
        >
          <span className="text-lg">+</span>
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
        >
          <span className="text-lg">-</span>
        </button>
        <button
          onClick={onReset}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
        >
          <span className="text-lg">⌂</span>
        </button>
      </div>
    </div>
  );
};

