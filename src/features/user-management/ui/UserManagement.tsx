"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { usersApi } from "../api/users";
import type { UserInfo, AssignRoleRequest } from "../model/types";
import { UserRole, ROLE_LABELS } from "@/entities/user";
import { canAssignRole, canManageUser, isProjectAdmin, getHighestRole } from "@/shared/lib/roles";
import { logger } from "@/shared/lib/logger";
import { adminApi } from "@/entities/admin";
import { bookingApi } from "@/entities/booking";
import type { BookingItem, SpaceType, SpaceItem, TimeIntervalItem } from "@/entities/booking";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import { UserBookingsSection } from "./UserBookingsSection";
import { Button } from "@/shared/ui/buttons";
import { processIntervals } from "@/features/booking/lib/intervalUtils";

export const UserManagement: React.FC = () => {
  const { accessToken, user } = useAuthStore();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const [confirmWorkspaceAdminEmail, setConfirmWorkspaceAdminEmail] = useState<string | null>(
    null
  );
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);
  
  // Состояния для управления бронированиями пользователей
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<Record<string, BookingItem[]>>({});
  const [userActiveBookings, setUserActiveBookings] = useState<Record<string, BookingItem[]>>({});
  const [loadingBookings, setLoadingBookings] = useState<Record<string, boolean>>({});
  
  // Состояния для создания бронирования от имени пользователя
  const [creatingBookingFor, setCreatingBookingFor] = useState<string | null>(null);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingIntervals, setBookingIntervals] = useState<TimeIntervalItem[]>([]);

  // Проверяем права доступа
  const hasAdminAccess = user?.roles?.some(
    (role) => role === "ROLE_ADMIN_PROJECT" || role === "ROLE_ADMIN_WORKSPACE"
  );

  // Отладочная информация
  useEffect(() => {
    if (user) {
      logger.debug("UserManagement: User roles", {
        roles: user.roles,
        hasAdminAccess,
      });
    }
  }, [user, hasAdminAccess]);

  const fetchUsers = async () => {
    if (!accessToken) {
      setError("Токен авторизации не найден");
      setLoading(false);
      return;
    }

    logger.debug("UserManagement: Starting fetch users", {
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
      const currentUser = user;
      // Project admin видит только свой офис; workspace admin — всех
      const filtered = isProjectAdmin(currentUser)
        ? response.data.filter((u) => u.locationId === currentUser?.locationId)
        : response.data;
      setUsers(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Загружаем типы пространств при монтировании
  useEffect(() => {
    if (!user?.locationId || !accessToken) return;
    (async () => {
      const res = await bookingApi.getSpaceTypes(user.locationId, accessToken);
      if (res.data) setSpaceTypes(res.data);
    })();
  }, [user?.locationId, accessToken]);

  // Функция для загрузки бронирований пользователя
  const loadUserBookings = async (email: string) => {
    if (!accessToken) return;
    
    setLoadingBookings((prev) => ({ ...prev, [email]: true }));
    
    try {
      const [activeRes, allRes] = await Promise.all([
        adminApi.getUserActiveBookings(email, accessToken),
        adminApi.getUserAllBookings(email, accessToken),
      ]);
      
      if (activeRes.data) {
        setUserActiveBookings((prev) => ({ ...prev, [email]: activeRes.data || [] }));
      }
      if (allRes.data) {
        setUserBookings((prev) => ({ ...prev, [email]: allRes.data || [] }));
      }
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Ошибка загрузки бронирований",
        "Ошибка"
      );
    } finally {
      setLoadingBookings((prev) => ({ ...prev, [email]: false }));
    }
  };

  // Функция для создания бронирования от имени пользователя
  const handleCreateBookingForUser = async (userEmail: string, start: string, end: string, spaceTypeIdForBooking?: number) => {
    if (!accessToken || !selectedSpaceId || creatingBookingFor === userEmail) return;
    
    setCreatingBookingFor(userEmail);
    
    try {
      const spaceType = spaceTypes.find((t) => t.id === spaceTypeIdForBooking);
      const bookingType = spaceType?.type || "MEETING";
      
      const res = await adminApi.createBookingForUser(
        {
          userEmail,
          spaceId: selectedSpaceId,
          type: bookingType,
          start,
          end,
        },
        accessToken
      );
      
      if (res.error) {
        showErrorToast(res.error.message, "Ошибка создания бронирования");
      } else if (res.data) {
        showSuccessToast(
          `Бронирование создано для ${userEmail}: ${res.data.spaceName} на ${new Date(res.data.start).toLocaleString()}`,
          "Бронирование создано"
        );
        
        // Обновляем бронирования пользователя
        await loadUserBookings(userEmail);
        
        // Очищаем форму
        setSelectedSpaceId(null);
        setBookingDate("");
        setBookingIntervals([]);
        setSpaces([]);
      }
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Неизвестная ошибка",
        "Ошибка создания бронирования"
      );
    } finally {
      setCreatingBookingFor(null);
    }
  };

  // Функция для фильтрации пространств
  const handleFilterSpacesForUser = async (locationId: number, spaceTypeId: number, floorNumber?: number) => {
    if (!accessToken) {
      showErrorToast("Токен авторизации не найден", "Ошибка");
      return;
    }
    setLoading(true);
    try {
      const res = await bookingApi.filterSpaces({
        locationId,
        spaceTypeId,
        floorNumber,
      }, accessToken);
      if (res.data) setSpaces(res.data);
      if (res.error) showErrorToast(res.error.message, "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Функция для загрузки интервалов
  const handleLoadIntervalsForUser = async (date: string, spaceId: number) => {
    if (!accessToken) {
      showErrorToast("Токен авторизации не найден", "Ошибка");
      return;
    }
    setLoading(true);
    try {
      const res = await bookingApi.getTimeIntervals({ date, spaceId }, accessToken);
      if (res.data) {
        // Разбиваем большие интервалы на мелкие с учетом availableDurations
        const processedIntervals = processIntervals(res.data);
        setBookingIntervals(processedIntervals);
      }
      if (res.error) showErrorToast(res.error.message, "Ошибка");
    } finally {
      setLoading(false);
    }
  };

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

    // Нельзя снимать базовую роль пользователя
    if (role === "ROLE_USER") {
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

  const handleDeleteUser = async (email: string) => {
    if (!accessToken) {
      setError("Токен авторизации не найден");
      return;
    }

    setProcessingEmails((prev) => new Set(prev).add(email));
    const response = await usersApi.deleteUser(email, accessToken);
    if (response.error) {
      setError(response.error.message || "Ошибка при удалении пользователя");
      setProcessingEmails((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
      return;
    }
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
            Для доступа к разделу &quot;Управление пользователями&quot; необходимы права администратора.
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
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900">Управление пользователями</h1>
        <Button
          onClick={fetchUsers}
          variant="filled"
          color="blue"
          className="min-w-[120px]"
        >
          Обновить
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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
        <div className="bg-white rounded-2xl border border-gray-300 p-8 text-center transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <p className="text-gray-500">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ФИО
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Локация
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Роли
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((rowUser) => {
                const isProcessing = processingEmails.has(rowUser.email);
                const userRoles = rowUser.roles || [];
                const manageAllowed = canManageUser(user || null, { locationId: rowUser.locationId });

                return (
                  <React.Fragment key={rowUser.email}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {rowUser.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {rowUser.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {rowUser.locationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const highest = getHighestRole(userRoles);
                          if (!highest) return <span className="text-xs text-gray-500">нет ролей</span>;
                          const isAdmin = highest === "ROLE_ADMIN_WORKSPACE" || highest === "ROLE_ADMIN_PROJECT";
                          return (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                isAdmin ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {ROLE_LABELS[highest]}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                          {/* Спец-действие: назначить единственного администратора воркспейса */}
                          {canAssignRole(user || null, "ROLE_ADMIN_WORKSPACE") && !userRoles.includes("ROLE_ADMIN_WORKSPACE") && (
                            <button
                              onClick={() => setConfirmWorkspaceAdminEmail(rowUser.email)}
                              disabled={isProcessing || !manageAllowed}
                              className={`text-[10px] px-2 py-1 rounded border transition-all ${
                                isProcessing || !manageAllowed
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 font-medium"
                              }`}
                            >
                              Админ воркспейса
                            </button>
                          )}

                          {/* Группа: Назначение ролей */}
                          <div className="flex flex-wrap gap-1">
                            {(["ROLE_ADMIN_PROJECT", "ROLE_USER"] as UserRole[]).map((role) => {
                              const hasRole = userRoles.includes(role);
                              const roleAllowed = canAssignRole(user || null, role);
                              const disabled = hasRole || isProcessing || !manageAllowed || !roleAllowed;
                              return (
                                <button
                                  key={role}
                                  onClick={() => handleAssignRole(rowUser.email, role)}
                                  disabled={disabled}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                    disabled
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : hasRole
                                      ? "bg-blue-100 text-blue-800 border-blue-300 font-medium"
                                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {hasRole ? "✓ " : "+ "}
                                  {ROLE_LABELS[role] === "Обычный пользователь" ? "Пользователь" : ROLE_LABELS[role] === "Администратор проекта" ? "Админ проекта" : ROLE_LABELS[role]}
                                </button>
                              );
                            })}
                          </div>

                          {/* Группа: Снятие ролей */}
                          {userRoles.filter((role) => role !== "ROLE_USER").length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {userRoles
                                .filter((role) => role !== "ROLE_USER")
                                .map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => handleRevokeRole(rowUser.email, role)}
                                    disabled={isProcessing || !manageAllowed}
                                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                      isProcessing || !manageAllowed
                                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        : "bg-white text-red-600 border-red-300 hover:bg-red-50"
                                    }`}
                                  >
                                    − {ROLE_LABELS[role as UserRole] === "Администратор проекта" ? "Админ проекта" : ROLE_LABELS[role as UserRole] === "Администратор рабочего пространства" ? "Админ воркспейса" : ROLE_LABELS[role as UserRole]}
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* Группа: Действия */}
                          <div className="flex flex-wrap gap-1 pt-0.5 border-t border-gray-200">
                            <button
                              onClick={() => {
                                if (expandedUserEmail === rowUser.email) {
                                  setExpandedUserEmail(null);
                                } else {
                                  setExpandedUserEmail(rowUser.email);
                                  loadUserBookings(rowUser.email);
                                }
                              }}
                              disabled={isProcessing || !manageAllowed}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                isProcessing || !manageAllowed
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : expandedUserEmail === rowUser.email
                                  ? "bg-blue-100 text-blue-800 border-blue-300 font-medium"
                                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {expandedUserEmail === rowUser.email ? "Скрыть" : "Брони"}
                            </button>
                            {(() => {
                              const isRowWorkspaceAdmin = userRoles.includes("ROLE_ADMIN_WORKSPACE");
                              const canProjectAdminDelete = isProjectAdmin(user || null) && rowUser.locationId === (user?.locationId || -1) && !isRowWorkspaceAdmin;
                              const canWorkspaceAdminDelete = (user?.roles || []).includes("ROLE_ADMIN_WORKSPACE");
                              const canDelete = manageAllowed && (canWorkspaceAdminDelete || canProjectAdminDelete);
                              return (
                                <button
                                  onClick={() => setConfirmDeleteEmail(rowUser.email)}
                                  disabled={isProcessing || !canDelete}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                    isProcessing || !canDelete
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : "bg-white text-red-600 border-red-300 hover:bg-red-50 font-medium"
                                  }`}
                                >
                                  Удалить
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedUserEmail === rowUser.email && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <UserBookingsSection
                            userEmail={rowUser.email}
                            userLocationId={rowUser.locationId}
                            activeBookings={userActiveBookings[rowUser.email] || []}
                            allBookings={userBookings[rowUser.email] || []}
                            loading={loadingBookings[rowUser.email] || false}
                            spaceTypes={spaceTypes}
                            spaces={spaces}
                            selectedSpaceId={selectedSpaceId}
                            setSelectedSpaceId={setSelectedSpaceId}
                            bookingDate={bookingDate}
                            setBookingDate={setBookingDate}
                            intervals={bookingIntervals}
                            onFilterSpaces={handleFilterSpacesForUser}
                            onLoadIntervals={handleLoadIntervalsForUser}
                            onCreateBooking={handleCreateBookingForUser}
                            creatingBooking={creatingBookingFor === rowUser.email}
                            accessToken={accessToken || ""}
                            setSpaces={setSpaces}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmWorkspaceAdminEmail && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-300 shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Переназначить администратора воркспейса</h3>
            <p className="text-sm text-gray-600 mb-6">
              Вы собираетесь назначить пользователя <span className="font-semibold">{confirmWorkspaceAdminEmail}</span> единственным администратором
              воркспейса. Текущее ограничение — один администратор воркспейса на проект: права будут переназначены.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setConfirmWorkspaceAdminEmail(null)}
                variant="outline"
                color="gray"
                className="min-w-[100px]"
              >
                Отмена
              </Button>
              <Button
                onClick={async () => {
                  const email = confirmWorkspaceAdminEmail;
                  setConfirmWorkspaceAdminEmail(null);
                  await handleAssignRole(email, "ROLE_ADMIN_WORKSPACE");
                }}
                variant="filled"
                color="blue"
                className="min-w-[100px]"
              >
                Назначить
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteEmail && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-300 shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Удалить пользователя</h3>
            <p className="text-sm text-gray-600 mb-6">
              Вы собираетесь полностью удалить пользователя <span className="font-semibold">{confirmDeleteEmail}</span> из системы.
              Это действие необратимо.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setConfirmDeleteEmail(null)}
                variant="outline"
                color="gray"
                className="min-w-[100px]"
              >
                Отмена
              </Button>
              <Button
                onClick={async () => {
                  const email = confirmDeleteEmail;
                  setConfirmDeleteEmail(null);
                  await handleDeleteUser(email);
                }}
                variant="filled"
                color="gray"
                className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

