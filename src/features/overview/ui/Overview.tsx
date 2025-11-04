"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { bookingApi, type BookingItem } from "@/features/booking";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { workspaceAdminApi } from "@/features/user-management/api/workspace";
import { ROLE_LABELS, type UserRole } from "@/shared/types/user";

export const Overview: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [upcoming, setUpcoming] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officeActiveCount, setOfficeActiveCount] = useState<number | null>(null);

  const roleLabel = useMemo(() => {
    if (!user?.roles?.length) return "—";
    // Покажем самую приоритетную роль, как в остальных разделах
    const priority: Record<UserRole, number> = {
      ROLE_ADMIN_WORKSPACE: 3,
      ROLE_ADMIN_PROJECT: 2,
      ROLE_USER: 1,
    };
    const highest = (user.roles as UserRole[])
      .slice()
      .sort((a, b) => (priority[b] || 0) - (priority[a] || 0))[0];
    return ROLE_LABELS[highest] || highest;
  }, [user?.roles]);

  const adminProject = useMemo(() => isProjectAdmin(user || null), [user]);
  const adminWorkspace = useMemo(() => isWorkspaceAdmin(user || null), [user]);

  useEffect(() => {
    const load = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const activeRes = await bookingApi.getActiveBookings(accessToken);
        if (activeRes.data) {
          // Ближайшие 5 по началу
          const sorted = [...activeRes.data].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          );
          setUpcoming(sorted.slice(0, 5));
        }
        // Для проектного админа загрузим счетчик активных броней по офису
        if (adminProject && user?.locationId) {
          const locRes = await workspaceAdminApi.getLocationActiveBookings(user.locationId, accessToken);
          if (locRes.data) setOfficeActiveCount(locRes.data.length);
        } else if (adminWorkspace) {
          // Для админа воркспейса пока покажем метку, т.к. нет сводного эндпоинта по всей организации
          setOfficeActiveCount(null);
        }
      } catch {
        setError("Не удалось загрузить данные для обзора");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken, adminProject, adminWorkspace, user?.locationId]);

  const QuickAction: React.FC<React.PropsWithChildren<{ href: string }>> = ({ href, children }) => (
    <a
      href={href}
      className="flex-1 min-w-[180px] px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 text-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
    >
      {children}
    </a>
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Обзор</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Карточка статуса */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Статус доступа</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Роль</span><span className="font-medium">{roleLabel}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Офис</span><span className="font-medium">{user?.locationName || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span></div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Быстрые действия */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Быстрые действия</h2>
          <div className="flex flex-wrap gap-3">
            <QuickAction href="#">Создать бронь</QuickAction>
            <QuickAction href="/map">Открыть карту офиса</QuickAction>
            <QuickAction href="#bookings">Мои бронирования</QuickAction>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Метрики для админов */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Метрики</h2>
          {adminProject ? (
            <div className="text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Активные брони в офисе</span><span className="font-bold text-gray-900">{officeActiveCount ?? "—"}</span></div>
            </div>
          ) : adminWorkspace ? (
            <div className="text-sm text-gray-600">Метрики по всей организации будут добавлены отдельно.</div>
          ) : (
            <div className="text-sm text-gray-600">Нет административных метрик для текущей роли.</div>
          )}
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Ближайшие бронирования */}
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mt-6 transition-all duration-200 hover:shadow-lg hover:border-blue-200">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Мои ближайшие бронирования</h2>
        {loading ? (
          <div className="text-gray-500 text-sm">Загрузка...</div>
        ) : upcoming.length === 0 ? (
          <div className="text-gray-500 text-sm">Нет ближайших бронирований</div>
        ) : (
          <ul className="divide-y">
            {upcoming.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between transition-colors hover:bg-blue-50/40 rounded-lg px-2">
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{b.spaceName} · {b.locationName}</div>
                  <div className="text-gray-500">{new Date(b.start).toLocaleString()} — {new Date(b.end).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  {/* Ссылка на раздел бронирований */}
                  <a href="#bookings" className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">Подробнее</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


