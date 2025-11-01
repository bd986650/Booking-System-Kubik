"use client";

import React from "react";
import { UserRole } from "@/shared/types/user";
import { useAuthStore } from "@/features/auth";

type DashboardSection = 
  | "overview"
  | "authorization-requests"
  | "user-management"
  | "workspaces"
  | "bookings"
  | "profile";

interface DashboardSidebarProps {
  userRoles: string[];
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

interface SidebarItem {
  id: DashboardSection;
  label: string;
  icon: string;
  roles: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "overview",
    label: "Обзор",
    icon: "📊",
    roles: ["ROLE_USER", "ROLE_ADMIN_PROJECT", "ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "authorization-requests",
    label: "Заявки на авторизацию",
    icon: "📋",
    roles: ["ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "user-management",
    label: "Управление пользователями",
    icon: "👥",
    roles: ["ROLE_ADMIN_PROJECT", "ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "workspaces",
    label: "Рабочие пространства",
    icon: "🏢",
    roles: ["ROLE_USER", "ROLE_ADMIN_PROJECT", "ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "bookings",
    label: "Бронирования",
    icon: "📅",
    roles: ["ROLE_USER", "ROLE_ADMIN_PROJECT", "ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "profile",
    label: "Профиль",
    icon: "👤",
    roles: ["ROLE_USER", "ROLE_ADMIN_PROJECT", "ROLE_ADMIN_WORKSPACE"],
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userRoles,
  activeSection,
  onSectionChange,
}) => {
  const { user, logout } = useAuthStore();

  const visibleItems = SIDEBAR_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🏗️</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Кубик</h2>
            <p className="text-xs text-gray-500">Система бронирования</p>
          </div>
        </div>
        {user && (
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.fullName}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Выйти</span>
        </button>
      </div>
    </aside>
  );
};

