"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { bookingApi, type BookingItem } from "@/entities/booking";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { workspaceAdminApi } from "@/entities/location";
import { ROLE_LABELS, type UserRole } from "@/entities/user";

export const Overview: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [upcoming, setUpcoming] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officeActiveCount, setOfficeActiveCount] = useState<number | null>(null);

  const roleLabel = useMemo(() => {
    if (!user?.roles?.length) return "—";
    const priority: Record<UserRole, number> = {
      ROLE_ADMIN_PROJECT: 3,
      ROLE_ADMIN_WORKSPACE: 2,
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
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Верхняя панель метрик */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Ближайшее бронирование */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Ближайшее бронирование
          </p>
          {loading ? (
            <p className="text-sm text-gray-500">Загрузка...</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">Нет запланированных броней</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {upcoming[0].spaceName} · {upcoming[0].locationName}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(upcoming[0].start).toLocaleString("ru-RU")} —{" "}
                {new Date(upcoming[0].end).toLocaleString("ru-RU")}
              </p>
            </>
          )}
        </div>

        {/* Количество активных броней пользователя */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Мои активные бронирования
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {upcoming.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            показываются только ближайшие 5 записей
          </p>
        </div>

        {/* Роль / офисные метрики */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Доступ
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {roleLabel}
          </p>
          {adminProject && (
            <p className="mt-1 text-xs text-gray-500">
              Активные брони в вашем офисе:{" "}
              <span className="font-semibold text-gray-900">
                {officeActiveCount ?? "—"}
              </span>
            </p>
          )}
          {adminWorkspace && !adminProject && (
            <p className="mt-1 text-xs text-gray-500">
              Администрирование рабочих пространств организации
            </p>
          )}
          {!adminProject && !adminWorkspace && (
            <p className="mt-1 text-xs text-gray-500">
              Обычный пользователь, доступ только к своим бронированиям
            </p>
          )}
        </div>
      </div>

      {/* Двухколоночный блок: слева бронь, справа статус/действия */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
      <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-4">
              Мои ближайшие бронирования
            </h2>
        {loading ? (
          <div className="text-gray-500 text-sm py-4">Загрузка...</div>
        ) : upcoming.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">
                Нет ближайших бронирований
              </div>
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
                          {new Date(b.start).toLocaleString("ru-RU")} —{" "}
                          {new Date(b.end).toLocaleString("ru-RU")} ·{" "}
                          {b.bookingType}
                    </div>
                  </div>
                  <a
                        href="/dashboard?section=bookings"
                        className="ml-4 px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all"
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

        <div className="space-y-4">

          <div className="bg-white rounded-2xl border border-gray-300 p-5 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              Быстрые действия
            </h2>
            <div className="flex flex-col gap-2">
              <a
                href="/dashboard?section=bookings"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 text-center transition-all hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
              >
                Создать бронирование
              </a>
              <a
                href={`/map?mode=view${user?.locationId ? `&locationId=${user.locationId}` : ""}`}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 text-center transition-all hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
              >
                Открыть карту офиса
              </a>
              <a
                href="/dashboard?section=bookings"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 text-center transition-all hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
              >
                Перейти к списку броней
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
