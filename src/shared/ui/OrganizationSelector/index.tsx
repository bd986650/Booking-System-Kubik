"use client";

import React from "react";

interface Organization {
  id: number;
  name: string;
  isActive: boolean;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrganizationId: number | null;
  onOrganizationChange: (id: number | null) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
  onCreateNew,
  isLoading = false,
  error = null,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">Выберите организацию</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {organizations.length > 0 ? (
          <select
            value={selectedOrganizationId || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "new") {
                onCreateNew();
              } else {
                onOrganizationChange(value ? Number(value) : null);
              }
            }}
            disabled={isLoading}
            className="w-full h-10 sm:h-12 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Выберите организацию...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
            <option value="new">+ Создать новую организацию</option>
          </select>
        ) : (
          <button
            type="button"
            onClick={onCreateNew}
            disabled={isLoading}
            className="w-full h-10 sm:h-12 px-3 sm:px-4 py-2 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-sm sm:text-base text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Загрузка..." : "+ Создать новую организацию"}
          </button>
        )}
      </div>
    </div>
  );
};

