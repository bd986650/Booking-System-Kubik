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
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Пресеты</h3>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onMouseDown={(e) => {
              e.preventDefault();
              onPresetDragStart(preset, e.clientX, e.clientY);
            }}
            className="p-3 bg-white border border-gray-200 cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="w-full h-12 flex items-center justify-center mb-2 bg-blue-50">
              {preset.type === "rect" ? (
                <div
                  style={{
                    width: (preset.width ?? 40) * 0.6,
                    height: (preset.height ?? 30) * 0.6,
                    background: "#3b82f6",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                <svg width={48} height={32}>
                  <polygon
                    points={(preset.poly || [[0, 0], [40, 0], [40, 40], [0, 40]])
                      .map((pt) => `${pt[0] * 0.6},${pt[1] * 0.6}`)
                      .join(" ")}
                    fill="#3b82f6"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
            <div className="text-center text-xs font-medium text-gray-700">
              {preset.name}
            </div>
          </div>
        ))}

        <button
          onClick={onAddCustomPreset}
          className="p-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
        >
          <span className="text-xl text-gray-400 mb-1">+</span>
          <span className="text-xs font-medium text-gray-600">Своя</span>
        </button>
      </div>
    </div>
  );
};

