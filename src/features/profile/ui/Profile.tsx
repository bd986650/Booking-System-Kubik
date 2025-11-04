"use client";

import React, { useMemo } from "react";
import { useAuthStore } from "@/features/auth";
import { ROLE_LABELS, type UserRole } from "@/shared/types/user";

// Приоритет ролей (от высшего к низшему)
const ROLE_PRIORITY: Record<UserRole, number> = {
  ROLE_ADMIN_WORKSPACE: 3,
  ROLE_ADMIN_PROJECT: 2,
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
  const { user } = useAuthStore();

  const highestRole = useMemo(() => {
    return user?.roles ? getHighestRole(user.roles) : null;
  }, [user?.roles]);

  if (!user) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Информация о пользователе недоступна</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Профиль</h1>

      <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
              <p className="text-blue-100 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Основная информация */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Основная информация
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">ФИО</label>
                    <p className="text-base font-semibold text-gray-900">{user.fullName}</p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">Email</label>
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
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">Название офиса</label>
                    <p className="text-base font-semibold text-gray-900">
                      {user.locationName || "Не указано"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">ID локации</label>
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
      </div>
    </div>
  );
};

