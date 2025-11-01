import React from "react";

interface CustomPresetModalProps {
  isOpen: boolean;
  modalPolyPoints: number[][];
  modalSvgRef: React.RefObject<SVGSVGElement | null>;
  onModalClick: (e: React.MouseEvent) => void;
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export const CustomPresetModal: React.FC<CustomPresetModalProps> = ({
  isOpen,
  modalPolyPoints,
  modalSvgRef,
  onModalClick,
  onClear,
  onCancel,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-[700px] shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">✨</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Создание кастомной фигуры</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Кликайте на область ниже чтобы добавить точки. Для создания фигуры нужно минимум 3
          точки.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4 overflow-hidden">
          <svg
            ref={modalSvgRef}
            onClick={onModalClick}
            width={600}
            height={300}
            className="bg-gray-50 cursor-crosshair"
          >
            <rect x={0} y={0} width="100%" height="100%" fill="#fafafa" />
            {modalPolyPoints.length > 0 && (
              <>
                <polygon
                  points={modalPolyPoints.map((p) => p.join(",")).join(" ")}
                  fill="rgba(59, 130, 246, 0.1)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <polyline
                  points={modalPolyPoints.map((p) => p.join(",")).join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                {modalPolyPoints.map((pt, i) => (
                  <circle key={i} cx={pt[0]} cy={pt[1]} r={4} fill="#3b82f6" />
                ))}
              </>
            )}
          </svg>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Точек: {modalPolyPoints.length}</div>
          <div className="flex gap-3">
            <button
              onClick={onClear}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Очистить
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Отмена
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Сохранить фигуру
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

