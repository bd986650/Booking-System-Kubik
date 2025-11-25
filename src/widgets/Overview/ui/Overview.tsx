"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { bookingApi, type BookingItem } from "@/entities/booking";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { workspaceAdminApi } from "@/entities/location";
import { ROLE_LABELS, type UserRole } from "@/entities/user";
import { Button } from "@/shared/ui/buttons";

export const Overview: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [upcoming, setUpcoming] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officeActiveCount, setOfficeActiveCount] = useState<number | null>(null);

  const roleLabel = useMemo(() => {
    if (!user?.roles?.length) return "—";
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
          const sorted = [...activeRes.data].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          );
          setUpcoming(sorted.slice(0, 5));
        }
        if (adminProject && user?.locationId) {
          const locRes = await workspaceAdminApi.getLocationActiveBookings(user.locationId, accessToken);
          if (locRes.data) setOfficeActiveCount(locRes.data.length);
        } else if (adminWorkspace) {
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Обзор</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">Статус доступа</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Роль</span>
              <span className="font-semibold text-gray-900">{roleLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Офис</span>
              <span className="font-semibold text-gray-900">{user?.locationName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-semibold text-gray-900">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">Быстрые действия</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="#bookings"
              className="flex-1 min-w-[140px] px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 text-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
            >
              Создать бронь
            </a>
            <a
              href="/map"
              className="flex-1 min-w-[140px] px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 text-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
            >
              Карта офиса
            </a>
            <a
              href="#bookings"
              className="flex-1 min-w-[140px] px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 text-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
            >
              Мои бронирования
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">Метрики</h2>
          {adminProject ? (
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Активные брони в офисе</span>
                <span className="font-bold text-gray-900 text-lg">{officeActiveCount ?? "—"}</span>
              </div>
            </div>
          ) : adminWorkspace ? (
            <div className="text-sm text-gray-600">Метрики по всей организации будут добавлены отдельно.</div>
          ) : (
            <div className="text-sm text-gray-600">Нет административных метрик для текущей роли.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">Мои ближайшие бронирования</h2>
        {loading ? (
          <div className="text-gray-500 text-sm py-4">Загрузка...</div>
        ) : upcoming.length === 0 ? (
          <div className="text-gray-500 text-sm py-4">Нет ближайших бронирований</div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900 mb-1">
                      {b.spaceName} · {b.locationName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(b.start).toLocaleString("ru-RU")} — {new Date(b.end).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <a
                    href="#bookings"
                    className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all"
                  >
                    Подробнее
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
