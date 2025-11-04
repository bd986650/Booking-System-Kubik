"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/features/auth";
import { DashboardSidebar } from "@/widgets/Dashboard";
import { AuthorizationRequests } from "@/features/authorization-requests";
import { UserManagement } from "@/features/user-management";
import { useAuthCheck } from "@/features/auth/hooks/useAuthCheck";
import { useTokenRefresh } from "@/features/auth/hooks/useTokenRefresh";
import { Bookings } from "@/features/booking";
import { Workspaces } from "@/features/workspaces";
import { Overview } from "@/features/overview";
import { Profile } from "@/features/profile";

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
        return <Overview />;
      case "workspaces":
        return <Workspaces />;
      case "bookings":
        return <Bookings />;
      case "profile":
        return <Profile />;
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

