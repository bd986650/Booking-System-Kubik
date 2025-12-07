"use client";

import React, { useMemo, useState } from "react";
import { useAuthStore, useForceRefresh } from "@/features/auth";
import { ROLE_LABELS, type UserRole } from "@/entities/user";
import { Button } from "@/shared/ui/buttons";

// Приоритет ролей (от высшего к низшему)
const ROLE_PRIORITY: Record<UserRole, number> = {
  ROLE_ADMIN_PROJECT: 3,
  ROLE_ADMIN_WORKSPACE: 2,
  ROLE_USER: 1,
};

// Функция для получения самой приоритетной роли
const getHighestRole = (roles: string[]): UserRole | null => {
  if (!roles || roles.length === 0) return null;

  let highestRole: UserRole | null = null;
  let highestPriority = 0;

  roles.forEach((role) => {
    const roleKey = role as UserRole;
    if (ROLE_PRIORITY[roleKey] && ROLE_PRIORITY[roleKey] > highestPriority) {
      highestPriority = ROLE_PRIORITY[roleKey];
      highestRole = roleKey;
    }
  });

  return highestRole;
};

export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { forceRefresh } = useForceRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const highestRole = useMemo(() => {
    return user?.roles ? getHighestRole(user.roles) : null;
  }, [user?.roles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forceRefresh(true);
    setIsRefreshing(false);
  };

  if (!user) {
    return (
      <div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Информация о пользователе недоступна</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{(user.fullName || user.email)[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
              <p className="text-blue-100 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Основная информация */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Основная информация
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">ФИО</label>
                    <p className="text-base font-semibold text-gray-900">{user.fullName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                    <p className="text-base font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Локация */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Локация
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Название офиса</label>
                    <p className="text-base font-semibold text-gray-900">
                      {user.locationName || "Не указано"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">ID локации</label>
                    <p className="text-base font-semibold text-gray-900">{user.locationId || "Не указано"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Роли и права */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Роль
                </h3>
                <div className="space-y-3">
                  {highestRole ? (
                    (() => {
                      const roleLabel = ROLE_LABELS[highestRole];
                      const isAdmin = highestRole === "ROLE_ADMIN_WORKSPACE" || highestRole === "ROLE_ADMIN_PROJECT";
                      return (
                        <div
                          className={`inline-flex items-center px-4 py-2 rounded-lg ${
                            isAdmin
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          <span className="text-sm font-semibold">{roleLabel}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-gray-500">Роль не назначена</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-5 border-t border-gray-100 flex justify-end items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            color="blue"
            className="text-sm py-2 px-4"
          >
            {isRefreshing ? "Обновление..." : "Обновить данные"}
          </Button>
          <Button
            onClick={() => {
              logout();
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
            }}
            variant="outline"
            color="gray"
            className="text-sm py-2 px-4"
          >
            Выйти
          </Button>
        </div>
      </div>
    </div>
  );
};
