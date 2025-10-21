"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/widgets/Sidebar/ui/DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  // Временные значения для демонстрации
  const role = "EMPLOYEE";
  const email = "user@example.com";
  // 🧠 Активный раздел (управляется сайдбаром)
  const [activeSection, setActiveSection] = useState<string>("HOME");

  // 🏢 Пример списка офисов
  const officesList = ["Главный офис", "Филиал №1", "Филиал №2"];

  // 📦 Динамическое содержимое
  const renderContent = () => {
    // Если есть children (страница), отображаем их
    if (children) {
      return children;
    }
    
    // Иначе показываем контент по умолчанию
    switch (activeSection) {
      case "BOOKINGS":
        return <p>📅 Здесь список ваших броней</p>;
      case "NEW_BOOKING":
        return <p>➕ Форма для новой брони</p>;
      case "CREATE_PLAN":
        return <p>🧱 Интерфейс создания плана помещения</p>;
      case "MANAGE_BOOKINGS":
        return <p>👥 Управление бронями сотрудников</p>;
      case "EDIT_PLAN":
        return <p>✏️ Редактирование плана помещения</p>;
      case "COMPANY_BOOKINGS":
        return <p>📊 Управление всеми бронями по офисам</p>;
      case "COMPANY_OFFICES":
        return <p>🏢 Список и управление офисами</p>;
      case "COMPANY_USERS":
        return <p>👨‍💼 Управление сотрудниками компании</p>;
      default:
        return (
          <div className="text-gray-600">
            <p>👋 Добро пожаловать, {email}</p>
            <p>Выберите раздел слева, чтобы начать работу.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen">
      {/* 🧭 Сайдбар слева */}
      <DashboardSidebar
        role={role}
        email={email}
        currentOffice={officesList[0]}
        officesList={officesList}
        currentSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* 📄 Контент справа */}
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4 text-gray-800">
            {getSectionTitle(activeSection)}
          </h1>
          <div className="bg-white shadow rounded-lg p-6">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
};

// 🏷️ Функция для красивых заголовков
function getSectionTitle(section: string): string {
  switch (section) {
    case "BOOKINGS":
      return "Мои бронирования";
    case "NEW_BOOKING":
      return "Забронировать";
    case "CREATE_PLAN":
      return "Создать план помещения";
    case "MANAGE_BOOKINGS":
      return "Брони сотрудников";
    case "EDIT_PLAN":
      return "Редактировать план помещения";
    case "COMPANY_BOOKINGS":
      return "Управление бронями";
    case "COMPANY_OFFICES":
      return "Офисы компании";
    case "COMPANY_USERS":
      return "Сотрудники компании";
    default:
      return "Главная";
  }
}

export default DashboardLayout;
