"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { usersApi } from "../api/users";
import type { UserInfo, AssignRoleRequest } from "../model/types";
import { UserRole, ROLE_LABELS } from "@/shared/types/user";

export const UserManagement: React.FC = () => {
  const { accessToken, user } = useAuthStore();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());

  // Проверяем права доступа
  const hasAdminAccess = user?.roles?.some(
    (role) => role === "ROLE_ADMIN_PROJECT" || role === "ROLE_ADMIN_WORKSPACE"
  );

  // Отладочная информация
  useEffect(() => {
    if (user) {
      console.log("[UserManagement] User roles:", user.roles);
      console.log("[UserManagement] Has admin access:", hasAdminAccess);
    }
  }, [user, hasAdminAccess]);

  const fetchUsers = async () => {
    if (!accessToken) {
      setError("Токен авторизации не найден");
      setLoading(false);
      return;
    }

    console.log("[UserManagement.fetchUsers] Starting fetch", {
      hasToken: !!accessToken,
      userRoles: user?.roles,
      hasAdminAccess,
    });

    setLoading(true);
    setError(null);

    const response = await usersApi.getAllUsers(accessToken);

    if (response.error) {
      const errorStatus = response.error.status;
      let errorMessage = response.error.message || "Ошибка при загрузке пользователей";
      
      // Специальное сообщение для 403
      if (errorStatus === 403) {
        const currentRoles = user?.roles || [];
        errorMessage = `Доступ запрещен сервером. У вас есть роли: ${currentRoles.join(", ")}. `;
        errorMessage += "Возможно, эндпоинт требует только ROLE_ADMIN_PROJECT или есть дополнительная проверка прав на бэкенде.";
      }
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    if (response.data) {
      setUsers(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleAssignRole = async (email: string, role: UserRole) => {
    if (!accessToken) {
      setError("Токен авторизации не найден");
      return;
    }

    setProcessingEmails((prev) => new Set(prev).add(email));

    const request: AssignRoleRequest = { email, role };
    const response = await usersApi.assignRole(request, accessToken);

    if (response.error) {
      const errorStatus = response.error.status;
      let errorMessage = response.error.message || "Ошибка при назначении роли";
      
      if (errorStatus === 403) {
        errorMessage = "Доступ запрещен. У вас нет прав для назначения ролей.";
      }
      
      setError(errorMessage);
      setProcessingEmails((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
      return;
    }

    // Обновляем список пользователей после успешного назначения роли
    await fetchUsers();
    setProcessingEmails((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  };

  const handleRevokeRole = async (email: string, role: string) => {
    if (!accessToken) {
      setError("Токен авторизации не найден");
      return;
    }

    setProcessingEmails((prev) => new Set(prev).add(email));

    const response = await usersApi.revokeRole({ email, role }, accessToken);

    if (response.error) {
      const errorStatus = response.error.status;
      let errorMessage = response.error.message || "Ошибка при отзыве роли";
      
      if (errorStatus === 403) {
        errorMessage = "Доступ запрещен. У вас нет прав для отзыва ролей.";
      }
      
      setError(errorMessage);
      setProcessingEmails((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
      return;
    }

    // Обновляем список пользователей после успешного отзыва роли
    await fetchUsers();
    setProcessingEmails((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка пользователей...</p>
          </div>
        </div>
      </div>
    );
  }

  // Если нет прав доступа, показываем предупреждение
  if (!hasAdminAccess) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">Доступ ограничен</h2>
          <p className="text-yellow-800 mb-2">
            Для доступа к разделу "Управление пользователями" необходимы права администратора.
          </p>
          <p className="text-sm text-yellow-700">
            Требуемые роли: <strong>ROLE_ADMIN_PROJECT</strong> или <strong>ROLE_ADMIN_WORKSPACE</strong>
          </p>
          {user && (
            <div className="mt-2">
              <p className="text-sm text-yellow-700">
                Ваши текущие роли: {user.roles.length > 0 ? user.roles.join(", ") : "нет ролей"}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                (Проверьте консоль браузера для отладочной информации)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Обновить
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="font-semibold mb-1">Ошибка:</div>
          <div>{error}</div>
          {error.includes("403") && user && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Ваши текущие роли: {user.roles.length > 0 ? user.roles.join(", ") : "нет ролей"}</p>
              <p className="mt-1">Согласно документации API требуются: ROLE_ADMIN_PROJECT или ROLE_ADMIN_WORKSPACE</p>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-semibold text-yellow-800">Проблема на стороне сервера:</p>
                <p className="text-yellow-700">
                  У вас есть роль <strong>ROLE_ADMIN_WORKSPACE</strong>, но сервер все равно возвращает 403. 
                  Это означает, что на бэкенде либо:
                </p>
                <ul className="list-disc list-inside mt-1 text-yellow-700">
                  <li>Эндпоинт требует только ROLE_ADMIN_PROJECT (а не ROLE_ADMIN_WORKSPACE)</li>
                  <li>Есть дополнительная проверка прав (организация, workspace и т.д.)</li>
                  <li>Настроена проверка прав отличается от документации</li>
                </ul>
                <p className="mt-2 text-yellow-800 font-semibold">
                  Обратитесь к разработчикам бэкенда для проверки конфигурации прав доступа к эндпоинту /api/admin/users
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ФИО
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Локация
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роли
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isProcessing = processingEmails.has(user.email);
                const userRoles = user.roles || [];

                return (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.locationName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {userRoles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {ROLE_LABELS[role as UserRole] || role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-2">
                        {/* Назначение ролей */}
                        <div className="flex gap-2">
                          {(["ROLE_USER", "ROLE_ADMIN_WORKSPACE", "ROLE_ADMIN_PROJECT"] as UserRole[]).map(
                            (role) => {
                              const hasRole = userRoles.includes(role);
                              return (
                                <button
                                  key={role}
                                  onClick={() => handleAssignRole(user.email, role)}
                                  disabled={hasRole || isProcessing}
                                  className={`px-3 py-1 text-xs rounded transition-colors ${
                                    hasRole
                                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  {hasRole ? "✓ " : "+ "}
                                  {ROLE_LABELS[role]}
                                </button>
                              );
                            }
                          )}
                        </div>
                        {/* Отзыв ролей */}
                        {userRoles.length > 0 && (
                          <div className="flex gap-2">
                            {userRoles.map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRevokeRole(user.email, role)}
                                disabled={isProcessing}
                                className={`px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors ${
                                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                - {ROLE_LABELS[role as UserRole] || role}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

