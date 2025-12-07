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
import { Analytics } from "@/widgets/Analytics";
import { registrationRequestsApi } from "@/features/authorization-requests";

type DashboardSection = 
  | "overview"
  | "authorization-requests"
  | "user-management"
  | "workspaces"
  | "bookings"
  | "analytics"
  | "profile";

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");

  // Поддержка URL параметра section
  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (sectionParam && ["overview", "authorization-requests", "user-management", "workspaces", "bookings", "analytics", "profile"].includes(sectionParam)) {
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

  const sectionMeta: Record<
    DashboardSection,
    { title: string; description: string }
  > = {
    overview: {
      title: "Обзор",
      description: "Ключевые метрики и ближайшие события по вашим бронированиям.",
    },
    "authorization-requests": {
      title: "Заявки на доступ",
      description: "Управляйте запросами на авторизацию и роли пользователей.",
    },
    "user-management": {
      title: "Пользователи",
      description: "Просмотр, назначение ролей и управление пользователями организации.",
    },
    workspaces: {
      title: "Пространства",
      description: "Администрирование офисов, рабочих мест и рабочих пространств.",
    },
    bookings: {
      title: "Бронирования",
      description: "Поиск свободных мест и управление текущими бронями.",
    },
    analytics: {
      title: "Аналитика",
      description: "Отчёты и статистика использования офисных пространств.",
    },
    profile: {
      title: "Профиль",
      description: "Личная информация, роль и настройки пользователя.",
    },
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
      case "analytics":
        return <Analytics />;
      case "profile":
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar
        userRoles={user.roles}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        pendingRequestsCount={unreadRequestsCount}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-2 mb-6 lg:mb-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Панель управления
              </p>
              <h1 className="mt-1 text-2xl lg:text-3xl font-extrabold text-slate-900">
                {sectionMeta[activeSection].title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
                {sectionMeta[activeSection].description}
              </p>
          </header>

        {renderContent()}
        </div>
      </main>
    </div>
  );
}

