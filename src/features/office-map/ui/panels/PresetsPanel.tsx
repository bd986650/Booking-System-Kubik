import React from "react";
import type { Preset } from "../../model/types";

interface PresetsPanelProps {
  presets: Preset[];
  onPresetDragStart: (preset: Preset, clientX: number, clientY: number) => void;
  onAddCustomPreset: () => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  presets,
  onPresetDragStart,
  onAddCustomPreset,
}) => {
  return (
    <div className="flex-1">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Пресеты комнат</h3>
      <div className="flex gap-3">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onMouseDown={(e) => {
              e.preventDefault();
              onPresetDragStart(preset, e.clientX, e.clientY);
            }}
            className="p-4 bg-white border border-gray-300 rounded-lg cursor-grab hover:border-blue-500 hover:shadow-md transition-all duration-200"
          >
            <div className="w-20 h-16 flex items-center justify-center mb-2">
              {preset.type === "rect" ? (
                <div
                  style={{
                    width: (preset.width ?? 40) * 0.8,
                    height: (preset.height ?? 30) * 0.8,
                    background: "linear-gradient(135deg, #e6f2ff, #9ec5ff)",
                    border: "2px solid #3b82f6",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                <svg width={64} height={48}>
                  <polygon
                    points={(preset.poly || [[0, 0], [40, 0], [40, 40], [0, 40]])
                      .map((pt) => `${pt[0] * 0.8},${pt[1] * 0.8}`)
                      .join(" ")}
                    fill="url(#gradient)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e6f2ff" />
                      <stop offset="100%" stopColor="#9ec5ff" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <div className="text-center text-sm font-medium text-gray-700">{preset.name}</div>
          </div>
        ))}

        <button
          onClick={onAddCustomPreset}
          className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center w-24"
        >
          <span className="text-2xl text-gray-400 mb-1">+</span>
          <span className="text-sm text-gray-600">Добавить свою</span>
        </button>
      </div>
    </div>
  );
};

