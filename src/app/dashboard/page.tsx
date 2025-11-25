"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth";
import { DashboardSidebar } from "@/widgets/Dashboard";
import { AuthorizationRequests } from "@/features/authorization-requests";
import { UserManagement } from "@/features/user-management";
import { useAuthCheck, useTokenRefresh } from "@/features/auth";
import { Bookings } from "@/features/booking";
import { WorkspacesAdmin } from "@/widgets/WorkspacesAdmin";
import { Overview } from "@/widgets/Overview";
import { Profile } from "@/features/profile";
import { registrationRequestsApi } from "@/features/authorization-requests";

type DashboardSection = 
  | "overview"
  | "authorization-requests"
  | "user-management"
  | "workspaces"
  | "bookings"
  | "profile";

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");

  // Поддержка URL параметра section
  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (sectionParam && ["overview", "authorization-requests", "user-management", "workspaces", "bookings", "profile"].includes(sectionParam)) {
      setActiveSection(sectionParam as DashboardSection);
    }
  }, [searchParams]);
  const { isChecking } = useAuthCheck();
  
  // Автоматическое обновление токена
  useTokenRefresh();

  const storageKey = useMemo(() => `kubik:lastSeenRequests:${user?.email || "anon"}`, [user?.email]);

  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [lastSeenRequestsCount, setLastSeenRequestsCount] = useState<number>(0);

  // Инициализация lastSeen из localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (raw) setLastSeenRequestsCount(Number(raw) || 0);
    } catch {}
  }, [storageKey]);

  // Загрузка текущего количества заявок
  useEffect(() => {
    const load = async () => {
      if (!accessToken) return;
      const res = await registrationRequestsApi.getRequests(accessToken);
      if (res.data) setPendingRequestsCount(res.data.length);
    };
    load();
  }, [accessToken]);

  const unreadRequestsCount = Math.max(0, pendingRequestsCount - lastSeenRequestsCount);

  const handleSectionChange = (section: DashboardSection) => {
    setActiveSection(section);
    if (section === "authorization-requests") {
      // Помечаем все текущие как просмотренные
      setLastSeenRequestsCount(pendingRequestsCount);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, String(pendingRequestsCount));
        }
      } catch {}
    }
  };

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
        return <WorkspacesAdmin />;
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
        onSectionChange={handleSectionChange}
        pendingRequestsCount={unreadRequestsCount}
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

