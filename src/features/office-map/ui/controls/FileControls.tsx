import React from "react";

interface FileControlsProps {
  onExport: () => void;
  onImport: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileControls: React.FC<FileControlsProps> = ({ onExport, onImport }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Файлы</h3>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 justify-center"
        >
          <span>💾</span>
          <span>Export</span>
        </button>
        <label className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 justify-center cursor-pointer">
          <span>📂</span>
          <span>Import</span>
          <input type="file" accept=".json" onChange={onImport} className="hidden" />
        </label>
      </div>
    </div>
  );
};

