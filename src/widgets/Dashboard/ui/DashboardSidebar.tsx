"use client";

import React from "react";
import { UserRole } from "@/entities/user";
import { useAuthStore } from "@/features/auth";
import { LogoIcon } from "@/shared/ui/branding";
import { Button } from "@/shared/ui/buttons";

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
  pendingRequestsCount?: number;
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
    label: "Заявки",
    icon: "📋",
    roles: ["ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "user-management",
    label: "Пользователи",
    icon: "👥",
    roles: ["ROLE_ADMIN_PROJECT", "ROLE_ADMIN_WORKSPACE"],
  },
  {
    id: "workspaces",
    label: "Пространства",
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
  pendingRequestsCount = 0,
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
    <aside className="w-64 bg-white border-r border-gray-300 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-300">
        <div className="flex items-center gap-3 mb-4">
          <LogoIcon size={36} colorClass="text-blue-500" />
        	  <div>
            <h2 className="text-lg font-extrabold text-gray-900">Кубик</h2>
            <p className="text-xs text-gray-500 font-medium">Система бронирования</p>
          </div>
        </div>
        {user && (
          <div className="pt-3 border-t border-gray-200">
            <p className="font-bold text-gray-900 text-sm mb-0.5">{user.fullName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {user.locationName && (
              <p className="text-xs text-gray-400 mt-1">📍 {user.locationName}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            const showBadge = item.id === "authorization-requests" && pendingRequestsCount > 0;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium border border-transparent hover:border-gray-200"
                  }`}
                >
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                  {showBadge && (
                    <span className="ml-3 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-300 bg-gray-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          color="gray"
          className="w-full text-sm py-2"
        >
          <span className="mr-2">🚪</span>
          Выйти
        </Button>
      </div>
    </aside>
  );
};

