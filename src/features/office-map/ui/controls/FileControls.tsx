import React from "react";

interface FileControlsProps {
  onExport: () => void;
  onImport: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileControls: React.FC<FileControlsProps> = ({ onExport, onImport }) => {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Файлы</h3>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center"
        >
          <span>💾</span>
          <span>Export</span>
        </button>
        <label className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center cursor-pointer">
          <span>📂</span>
          <span>Import</span>
          <input type="file" accept=".json" onChange={onImport} className="hidden" />
        </label>
      </div>
    </div>
  );
};

