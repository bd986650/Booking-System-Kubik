"use client";

import React from "react";
import { UserRole } from "@/features/auth/model/roles";
import {
  Home,
  Building2,
  Users,
  Map,
  BarChart3,
  LogOut,
  ClipboardList,
  PlusSquare,
  Edit3,
} from "lucide-react";
import LogoIcon from "@/shared/ui/BrandingUI/LogoIcon/LogoIcon";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  role?: UserRole;
  email?: string;
  currentOffice?: string;
  officesList?: string[];
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  role = "EMPLOYEE",
  email = "user@example.com",
  currentOffice = "Офис №1",
  officesList = ["Офис №1", "Офис №2", "Офис №3"],
  currentSection,
  onSectionChange,
}) => {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  // 📘 Универсальный элемент меню
  const MenuButton = ({
    icon: Icon,
    label,
    section,
  }: {
    icon: React.ElementType;
    label: string;
    section: string;
  }) => (
    <button
      onClick={() => onSectionChange?.(section)}
      className={`w-full flex items-center space-x-3 p-2 rounded-lg transition ${
        currentSection === section
          ? "bg-blue-50 text-blue-600"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      {/* 🔷 Верх: логотип */}
      <div className="p-4 flex items-center">
        <LogoIcon size={32} colorClass="text-blue-600" interactive={false} />
        <h2 className="ml-2 text-lg font-semibold text-blue-600">Кубик</h2>
      </div>

      {/* 🔹 Профиль */}
      <div className="px-4 py-3 border-t border-b flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">{email}</span>
          <span className="text-xs text-gray-500">
            {role === "COMPANY"
              ? "Администратор компании"
              : role === "OFFICE"
              ? "Администратор офиса"
              : "Сотрудник"}
          </span>
        </div>
      </div>

      {/* 🔸 Выбор/название офиса */}
      <div className="p-3 border-b">
        {role === "EMPLOYEE" || role === "COMPANY" ? (
          <select
            className="w-full border rounded-lg p-2 text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
            defaultValue={currentOffice}
          >
            {officesList.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm font-medium text-gray-700">
            {currentOffice}
          </div>
        )}
      </div>

      {/* 🔹 Навигация */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ---- EMPLOYEE ---- */}
        {role === "EMPLOYEE" && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Бронирования
            </h3>
            <div className="space-y-1">
              <MenuButton
                icon={ClipboardList}
                label="Мои бронирования"
                section="BOOKINGS"
              />
              <MenuButton
                icon={PlusSquare}
                label="Забронировать"
                section="NEW_BOOKING"
              />
            </div>
          </div>
        )}

        {/* ---- OFFICE ADMIN ---- */}
        {role === "OFFICE" && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Управление офисом
            </h3>
            <div className="space-y-1">
              <MenuButton
                icon={Map}
                label="Создать план помещения"
                section="CREATE_PLAN"
              />
              <MenuButton
                icon={ClipboardList}
                label="Брони сотрудников"
                section="MANAGE_BOOKINGS"
              />
            </div>
          </div>
        )}

        {/* ---- COMPANY ADMIN ---- */}
        {role === "COMPANY" && (
          <>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Управление офисом
              </h3>
              <div className="space-y-1">
                <MenuButton
                  icon={Edit3}
                  label="Редактировать план помещения"
                  section="EDIT_PLAN"
                />
                <MenuButton
                  icon={ClipboardList}
                  label="Управлять бронями"
                  section="COMPANY_BOOKINGS"
                />
              </div>
            </div>

            <hr className="my-3" />

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Управление организацией
              </h3>
              <div className="space-y-1">
                <MenuButton
                  icon={Building2}
                  label="Офисы"
                  section="COMPANY_OFFICES"
                />
                <MenuButton
                  icon={Users}
                  label="Сотрудники"
                  section="COMPANY_USERS"
                />
              </div>
            </div>
          </>
        )}
      </nav>

      {/* 🔻 Кнопка выхода */}
      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
