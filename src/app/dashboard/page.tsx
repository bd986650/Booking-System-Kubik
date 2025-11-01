"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/features/auth";
import { DashboardSidebar } from "@/widgets/Dashboard";
import { AuthorizationRequests } from "@/features/authorization-requests";
import { UserManagement } from "@/features/user-management";
import { useAuthCheck } from "@/features/auth/hooks/useAuthCheck";
import { useTokenRefresh } from "@/features/auth/hooks/useTokenRefresh";

type DashboardSection = 
  | "overview"
  | "authorization-requests"
  | "user-management"
  | "workspaces"
  | "bookings"
  | "profile";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const { isChecking } = useAuthCheck();
  
  // Автоматическое обновление токена
  useTokenRefresh();

  if (isChecking) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "authorization-requests":
        return <AuthorizationRequests />;
      case "user-management":
        return <UserManagement />;
      case "overview":
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Обзор</h1>
            <p className="text-gray-600">Добро пожаловать в систему бронирования!</p>
          </div>
        );
      case "workspaces":
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Рабочие пространства</h1>
            <p className="text-gray-600">Раздел находится в разработке</p>
          </div>
        );
      case "bookings":
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Бронирования</h1>
            <p className="text-gray-600">Раздел находится в разработке</p>
          </div>
        );
      case "profile":
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Профиль</h1>
            <p className="text-gray-600">Раздел находится в разработке</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar
        userRoles={user.roles}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

