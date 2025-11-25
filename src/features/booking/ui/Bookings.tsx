"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { bookingApi } from "@/entities/booking";
import type {
  SpaceType,
  SpaceItem,
  TimeIntervalItem,
  BookingItem,
} from "@/entities/booking";
import { canManageBooking, isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import { adminApi } from "@/entities/admin";
import { Button } from "@/shared/ui/buttons";
import { processIntervals } from "../lib/intervalUtils";
import { formatTimeWithOffset } from "../lib/timeUtils";

export const Bookings: React.FC = () => {
  const { user, accessToken } = useAuthStore();

  const defaultLocationId = user?.locationId || 0;
  const [locationId, setLocationId] = useState<number>(defaultLocationId);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [spaceTypeId, setSpaceTypeId] = useState<number | null>(null);
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [date, setDate] = useState<string>("");
  const [intervals, setIntervals] = useState<TimeIntervalItem[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingItem[]>([]);
  const [allBookings, setAllBookings] = useState<BookingItem[]>([]);
  const [allActiveBookings, setAllActiveBookings] = useState<BookingItem[]>([]); // Для админов
  const [loading, setLoading] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdminWorkspace = useMemo(() => isWorkspaceAdmin(user || null), [user]);
  const isAdminProject = useMemo(() => isProjectAdmin(user || null), [user]);

  useEffect(() => {
    if (!locationId || !accessToken) return;
    (async () => {
      const res = await bookingApi.getSpaceTypes(locationId, accessToken);
      if (res.data) setSpaceTypes(res.data);
    })();
  }, [locationId, accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      const [activeRes, allRes] = await Promise.all([
        bookingApi.getActiveBookings(accessToken),
        bookingApi.getAllBookings(accessToken),
      ]);
      if (activeRes.data) setActiveBookings(activeRes.data);
      if (allRes.data) setAllBookings(allRes.data);
      
      // Для админов загружаем все активные бронирования
      if (isAdminWorkspace || isAdminProject) {
        const allActiveRes = await adminApi.getAllActiveBookings(accessToken);
        if (allActiveRes.data) setAllActiveBookings(allActiveRes.data);
      }
    })();
  }, [accessToken, isAdminWorkspace, isAdminProject]);

  const handleFilterSpaces = async () => {
    if (!locationId || !spaceTypeId || !accessToken) {
      setError("Укажите локацию и тип помещения");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await bookingApi.filterSpaces({
      locationId,
      spaceTypeId,
      floorNumber: floorNumber ? Number(floorNumber) : undefined,
    }, accessToken);
    if (res.data) setSpaces(res.data);
    if (res.error) setError(res.error.message);
    setLoading(false);
  };

  const handleLoadIntervals = async () => {
    if (!date || !selectedSpaceId || !accessToken) {
      setError("Выберите помещение и дату");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await bookingApi.getTimeIntervals({ date, spaceId: selectedSpaceId }, accessToken);
    if (res.data) {
      // Разбиваем большие интервалы на мелкие с учетом availableDurations
      const processedIntervals = processIntervals(res.data);
      setIntervals(processedIntervals);
    }
    if (res.error) setError(res.error.message);
    setLoading(false);
  };

  const handleCreateBooking = async (start: string, end: string) => {
    if (!accessToken || !selectedSpaceId || creatingBooking) return;
    
    setCreatingBooking(true);
    setError(null);
    
    // Используем тип пространства как тип бронирования
    // В документации указано, что type - это тип бронирования (например, "MEETING")
    // Для простоты используем тип пространства
    const spaceType = spaceTypes.find((t) => t.id === spaceTypeId);
    const bookingType = spaceType?.type || "MEETING";
    
    try {
      const res = await bookingApi.createBooking(
        { spaceId: selectedSpaceId, type: bookingType, start, end },
        accessToken
      );
      
      if (res.error) {
        setError(res.error.message);
        showErrorToast(res.error.message, "Ошибка бронирования");
      } else if (res.data) {
        showSuccessToast(
          `Бронирование создано успешно! ${res.data.spaceName} на ${new Date(res.data.start).toLocaleString()}`,
          "Бронирование создано"
        );
        
        // Обновляем списки
        const [activeRes, allRes] = await Promise.all([
          bookingApi.getActiveBookings(accessToken),
          bookingApi.getAllBookings(accessToken),
        ]);
        if (activeRes.data) setActiveBookings(activeRes.data);
        if (allRes.data) setAllBookings(allRes.data);
        
        // Обновляем интервалы, чтобы показать, что этот слот больше недоступен
        if (date && selectedSpaceId && accessToken) {
          const intervalsRes = await bookingApi.getTimeIntervals({ date, spaceId: selectedSpaceId }, accessToken);
          if (intervalsRes.data) {
            const processedIntervals = processIntervals(intervalsRes.data);
            setIntervals(processedIntervals);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(errorMessage);
      showErrorToast(errorMessage, "Ошибка бронирования");
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleCancel = async (booking: BookingItem) => {
    if (!accessToken || cancellingBooking === booking.id) return;
    
    const canCancel = canManageBooking(user || null, { scope: "own", ownerEmail: booking.userEmail })
      || canManageBooking(user || null, { scope: "office", officeLocationId: booking.locationId })
      || canManageBooking(user || null, { scope: "organization" });
    
    if (!canCancel) {
      showErrorToast("У вас нет прав для отмены этого бронирования", "Доступ запрещен");
      return;
    }
    
    // Подтверждение отмены
    const isAdminCancel = isAdminWorkspace || isAdminProject;
    const cancelMessage = isAdminCancel
      ? `Вы уверены, что хотите отменить бронирование "${booking.spaceName}" пользователя ${booking.userEmail} на ${new Date(booking.start).toLocaleString()}?`
      : `Вы уверены, что хотите отменить бронирование "${booking.spaceName}" на ${new Date(booking.start).toLocaleString()}?`;
    
    if (!confirm(cancelMessage)) {
      return;
    }
    
    setCancellingBooking(booking.id);
    setError(null);
    
    try {
      // Для админов используем admin API, для обычных пользователей - обычный API
      const res = isAdminCancel
        ? await adminApi.cancelBooking(booking.id, accessToken)
        : await bookingApi.cancelBooking(booking.id, accessToken);
      
      if (res.error) {
        setError(res.error.message);
        showErrorToast(res.error.message, "Ошибка отмены");
      } else {
        showSuccessToast(
          `Бронирование "${booking.spaceName}" успешно отменено`,
          "Бронирование отменено"
        );
        
        // Обновляем списки
        const [activeRes, allRes] = await Promise.all([
          bookingApi.getActiveBookings(accessToken),
          bookingApi.getAllBookings(accessToken),
        ]);
        if (activeRes.data) setActiveBookings(activeRes.data);
        if (allRes.data) setAllBookings(allRes.data);
        
        // Для админов обновляем список всех активных бронирований
        if (isAdminCancel) {
          const allActiveRes = await adminApi.getAllActiveBookings(accessToken);
          if (allActiveRes.data) setAllActiveBookings(allActiveRes.data);
        }
        
        // Если отмененное бронирование было для выбранного помещения и даты, обновляем интервалы
        if (selectedSpaceId === booking.spaceId && date && accessToken) {
          const intervalsRes = await bookingApi.getTimeIntervals({ date, spaceId: selectedSpaceId }, accessToken);
          if (intervalsRes.data) {
            const processedIntervals = processIntervals(intervalsRes.data);
            setIntervals(processedIntervals);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(errorMessage);
      showErrorToast(errorMessage, "Ошибка отмены");
    } finally {
      setCancellingBooking(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Бронирования</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Поиск помещений</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Локация (ID)</label>
            <input
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              value={locationId || ""}
              onChange={(e) => setLocationId(Number(e.target.value))}
              disabled={!isAdminWorkspace && !isAdminProject}
            />
            {!isAdminWorkspace && !isAdminProject && (
              <p className="text-xs text-gray-500 mt-1.5">Ваш офис: {defaultLocationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип помещения</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              value={spaceTypeId ?? ""}
              onChange={(e) => setSpaceTypeId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— выберите —</option>
              {spaceTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Этаж (опц.)</label>
            <input
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleFilterSpaces}
              variant="filled"
              color="blue"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Поиск..." : "Найти помещения"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Помещения</h2>
            {spaces.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Нет результатов. Уточните фильтры.</p>
            ) : (
              <div className="space-y-3">
                {spaces.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedSpaceId === s.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900 mb-1">
                          #{s.id} · {s.spaceType} · {s.capacity} мест · этаж {s.floor.floorNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Локация: {s.locationId} · {s.bookable ? "доступно" : "недоступно"}
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedSpaceId(s.id)}
                        variant={selectedSpaceId === s.id ? "filled" : "outline"}
                        color="blue"
                        className="ml-4 min-w-[100px]"
                      >
                        {selectedSpaceId === s.id ? "Выбрано" : "Выбрать"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Доступные интервалы</h2>
            <div className="flex gap-3 items-end mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button
                onClick={handleLoadIntervals}
                variant="filled"
                color="blue"
                disabled={loading}
                className="whitespace-nowrap"
              >
                {loading ? "Загрузка..." : "Показать интервалы"}
              </Button>
            </div>

            {intervals.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">
                Выберите помещение и дату, затем нажмите &quot;Показать интервалы&quot;.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {intervals.map((it, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg transition-all ${
                      !(it.status === "available" || it.available === true)
                        ? "opacity-60 border-gray-200 bg-gray-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-1">
                      {formatTimeWithOffset(it.start, it.offset)} — {formatTimeWithOffset(it.end, it.offset)}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {(it.status === "available" || it.available === true) ? (
                        <>
                          Доступно
                          {it.availableDurations && it.availableDurations.length > 0 && (
                            <span className="ml-2">
                              ({it.availableDurations.map(d => {
                                // Преобразуем PT30M в "30 мин", PT1H в "1 ч"
                                const match = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
                                if (match) {
                                  const hours = match[1] ? `${match[1]} ч` : "";
                                  const minutes = match[2] ? `${match[2]} мин` : "";
                                  return hours && minutes ? `${hours} ${minutes}` : hours || minutes;
                                }
                                return d;
                              }).join(", ")})
                            </span>
                          )}
                        </>
                      ) : (
                        "Недоступно"
                      )}
                    </div>
                    {(it.status === "available" || it.available === true) && (
                      <Button
                        onClick={() => handleCreateBooking(it.start, it.end)}
                        variant="filled"
                        color="blue"
                        disabled={creatingBooking}
                        className="w-full text-sm"
                      >
                        {creatingBooking ? "Бронирование..." : "Забронировать"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Мои активные бронирования</h2>
            {activeBookings.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Нет активных бронирований</p>
            ) : (
              <div className="space-y-3">
                {activeBookings.map((b) => (
                  <div key={b.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all">
                    <div className="font-semibold text-sm text-gray-900 mb-1">
                      #{b.id} · {b.spaceName} · {b.locationName}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {new Date(b.start).toLocaleString("ru-RU")} — {new Date(b.end).toLocaleString("ru-RU")} · {b.bookingType}
                    </div>
                    <Button
                      onClick={() => handleCancel(b)}
                      variant="outline"
                      color="gray"
                      disabled={cancellingBooking === b.id}
                      className="w-full text-sm"
                    >
                      {cancellingBooking === b.id ? "Отмена..." : "Отменить"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">История бронирований</h2>
            {allBookings.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">История пуста</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {allBookings.map((b) => (
                  <div key={b.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                    <div className="font-semibold text-sm text-gray-900 mb-1">
                      #{b.id} · {b.spaceName} · {b.locationName}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(b.start).toLocaleString("ru-RU")} — {new Date(b.end).toLocaleString("ru-RU")} · {b.bookingType}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      b.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Секция для админов: все активные бронирования */}
          {(isAdminWorkspace || isAdminProject) && (
            <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Все активные бронирования (админ)</h2>
              {allActiveBookings.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">Нет активных бронирований</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto">
                  {allActiveBookings.map((b) => (
                    <div key={b.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all">
                      <div className="font-semibold text-sm text-gray-900 mb-1">
                        #{b.id} · {b.spaceName} · {b.locationName}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        Пользователь: {b.userEmail}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {new Date(b.start).toLocaleString("ru-RU")} — {new Date(b.end).toLocaleString("ru-RU")} · {b.bookingType}
                      </div>
                      <Button
                        onClick={() => handleCancel(b)}
                        variant="outline"
                        color="gray"
                        disabled={cancellingBooking === b.id}
                        className="w-full text-xs"
                      >
                        {cancellingBooking === b.id ? "Отмена..." : "Отменить (админ)"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Примечание по карте: отдельный экран конструктора сейчас в /map. 
          Для пользовательской карты можно будет сделать просмотр слоями по выбранной локации. */}
    </div>
  );
};



