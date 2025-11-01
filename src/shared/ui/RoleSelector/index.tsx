"use client";

import React from "react";
import { UserRole, ROLE_LABELS } from "@/shared/types/user";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  title?: string;
  className?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  title = "Выберите тип",
  className = "",
}) => {
  const roles: UserRole[] = ["ROLE_USER", "ROLE_ADMIN_WORKSPACE", "ROLE_ADMIN_PROJECT"];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">{title}</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>
      <div className="flex flex-row gap-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onRoleChange(role)}
            className={`w-full h-10 sm:h-12 rounded-lg flex items-center justify-center gap-3 transition-colors ${
              selectedRole === role
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-sm sm:text-base font-medium">
              {ROLE_LABELS[role]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

