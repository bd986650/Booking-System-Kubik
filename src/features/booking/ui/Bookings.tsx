"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { bookingApi } from "@/entities/booking";
import type {
  SpaceType,
  SpaceItem,
  BookingItem,
} from "@/entities/booking";
import { canManageBooking, isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import { adminApi } from "@/entities/admin";
import { organizationsApi, type Location } from "@/entities/organization";
import { Button } from "@/shared/ui/buttons";
import { CustomSelect } from "@/shared/ui";
import { BookingModal } from "./BookingModal";
import { BookingMap } from "./BookingMap";

export const Bookings: React.FC = () => {
  const { user, accessToken } = useAuthStore();

  const defaultLocationId = user?.locationId || 0;
  const [locationId, setLocationId] = useState<number>(defaultLocationId);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [spaceTypeId, setSpaceTypeId] = useState<number | null>(null);
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<SpaceItem | null>(null);
  const [date, setDate] = useState<string>("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentFloorNumber, setCurrentFloorNumber] = useState<number>(1);
  const [allSpaces, setAllSpaces] = useState<SpaceItem[]>([]); // Все загруженные пространства
  const [activeBookings, setActiveBookings] = useState<BookingItem[]>([]);
  const [allBookings, setAllBookings] = useState<BookingItem[]>([]);
  const [allActiveBookings, setAllActiveBookings] = useState<BookingItem[]>([]); // Для админов
  const [loading, setLoading] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Locations list
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const isAdminWorkspace = useMemo(() => isWorkspaceAdmin(user || null), [user]);
  const isAdminProject = useMemo(() => isProjectAdmin(user || null), [user]);
  const organizationId = user?.organizationId || null;

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

  // Загрузка списка локаций
  useEffect(() => {
    const loadLocations = async () => {
      if (!organizationId || !accessToken) {
        setLocations([]);
        return;
      }

      setLoadingLocations(true);
      try {
        const res = await organizationsApi.getLocationsByOrganization(organizationId);
        if (res.error) {
          // Не показываем ошибку для обычных пользователей, только для админов
          if (isAdminWorkspace || isAdminProject) {
            showErrorToast(res.error.message || "Не удалось загрузить список локаций");
          }
        } else if (res.data) {
          setLocations(res.data);
        }
      } catch {
        if (isAdminWorkspace || isAdminProject) {
          showErrorToast("Произошла ошибка при загрузке списка локаций");
        }
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, [organizationId, accessToken, isAdminWorkspace, isAdminProject]);

  const handleFilterSpaces = async () => {
    if (!locationId || !spaceTypeId || !accessToken) {
      setError("Укажите локацию и тип помещения");
      return;
    }
    setError(null);
    setLoading(true);
    const floorNum = floorNumber ? Number(floorNumber) : undefined;
    const res = await bookingApi.filterSpaces({
      locationId,
      spaceTypeId,
      floorNumber: floorNum,
    }, accessToken);
    if (res.data) {
      setAllSpaces(res.data);
      // Фильтруем по текущему этажу
      const floorNum = floorNumber ? Number(floorNumber) : (res.data.length > 0 && res.data[0].floor ? res.data[0].floor.floorNumber : 1);
      setCurrentFloorNumber(floorNum);
      const filteredSpaces = res.data.filter(s => s.floor.floorNumber === floorNum);
      setSpaces(filteredSpaces);
      // Сбрасываем выбранное пространство
      setSelectedSpaceId(null);
      setSelectedSpace(null);
    }
    if (res.error) setError(res.error.message);
    setLoading(false);
  };

  const handleSpaceClick = (space: SpaceItem) => {
    if (!date) {
      showErrorToast("Сначала выберите дату для бронирования", "Выберите дату");
      return;
    }
    setSelectedSpace(space);
    setSelectedSpaceId(space.id);
    setShowBookingModal(true);
  };

  const handleBookingCreated = async () => {
    // Обновляем списки бронирований
    if (accessToken) {
      const [activeRes, allRes] = await Promise.all([
        bookingApi.getActiveBookings(accessToken),
        bookingApi.getAllBookings(accessToken),
      ]);
      if (activeRes.data) setActiveBookings(activeRes.data);
      if (allRes.data) setAllBookings(allRes.data);
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
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Поиск помещений</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Локация</label>
            {(isAdminWorkspace || isAdminProject) ? (
              <CustomSelect
                value={locationId || null}
                onChange={(val) => setLocationId(val ? Number(val) : 0)}
                options={locations.map((location) => ({
                  value: location.id,
                  label: `${location.name}${location.city ? ` (${location.city})` : ""}${location.isActive ? "" : " [Неактивна]"}`,
                }))}
                placeholder="Выберите локацию"
                disabled={loadingLocations}
                size="md"
              />
            ) : (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                {loadingLocations ? (
                  <p className="text-sm text-gray-500">Загрузка...</p>
                ) : (
                  <p className="text-sm text-gray-700">
                    {(() => {
                      const userLocation = locations.find(l => l.id === defaultLocationId);
                      return userLocation 
                        ? `${userLocation.name}${userLocation.city ? ` (${userLocation.city})` : ""}`
                        : `ID: ${defaultLocationId}`;
                    })()}
                  </p>
                )}
              </div>
            )}
            {loadingLocations && (isAdminWorkspace || isAdminProject) && (
              <p className="text-xs text-gray-500 mt-1.5">Загрузка локаций...</p>
            )}
            {!loadingLocations && locations.length === 0 && (isAdminWorkspace || isAdminProject) && organizationId && (
              <p className="text-xs text-gray-500 mt-1.5">Локации не найдены</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип помещения</label>
            <CustomSelect
              value={spaceTypeId}
              onChange={(val) => setSpaceTypeId(val ? Number(val) : null)}
              options={spaceTypes.map((t) => ({
                value: t.id,
                label: t.type,
              }))}
              placeholder="— выберите —"
              size="md"
            />
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

      {/* Выбор даты перед показом карты */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Дата бронирования</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="text-sm text-gray-500">
            {date ? `Выбрана дата: ${new Date(date).toLocaleDateString('ru-RU')}` : "Выберите дату для бронирования"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Карта с пространствами */}
          <div className="bg-white rounded-2xl border border-gray-300 p-6 transition-colors duration-200 hover:border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Карта офиса</h2>
              {spaces.length > 0 && (
                <div className="flex items-center gap-4">
                  {/* Переключение этажей, если есть пространства на разных этажах */}
                  {(() => {
                    const uniqueFloors = Array.from(new Set(spaces.map(s => s.floor.floorNumber))).sort();
                    if (uniqueFloors.length > 1) {
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Этаж:</span>
                          <CustomSelect
                            value={currentFloorNumber}
                            onChange={(val) => {
                              const floor = Number(val);
                              setCurrentFloorNumber(floor);
                              const filteredSpaces = allSpaces.filter(s => s.floor.floorNumber === floor);
                              setSpaces(filteredSpaces);
                              setSelectedSpaceId(null);
                              setSelectedSpace(null);
                            }}
                            options={uniqueFloors.map((floor) => ({
                              value: floor,
                              label: `Этаж ${floor}`,
                            }))}
                            size="sm"
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="text-sm text-gray-500">
                        Этаж {currentFloorNumber} · Найдено: {spaces.length} пространств
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            {spaces.length === 0 ? (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Нет результатов. Уточните фильтры.</p>
                  <p className="text-gray-400 text-xs">Выберите локацию, тип помещения и нажмите &quot;Найти помещения&quot;</p>
                </div>
              </div>
            ) : !date ? (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Выберите дату для бронирования</p>
                  <p className="text-gray-400 text-xs">Дата необходима для отображения доступных интервалов</p>
                </div>
              </div>
            ) : (
              <div className="h-96">
                <BookingMap
                  locationId={locationId}
                  floorNumber={currentFloorNumber}
                  spaces={spaces}
                  selectedSpaceId={selectedSpaceId}
                  accessToken={accessToken || ""}
                  onSpaceClick={handleSpaceClick}
                />
              </div>
            )}
          </div>

          {/* Список помещений (альтернативный вид) */}
          {spaces.length > 0 && (
            <div className="bg-white border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Список помещений</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {spaces.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 border border-gray-200 transition-colors cursor-pointer ${
                      selectedSpaceId === s.id
                        ? "bg-gray-100 border-gray-300"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (date) {
                        handleSpaceClick(s);
                      } else {
                        showErrorToast("Сначала выберите дату", "Выберите дату");
                      }
                    }}
                  >
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      #{s.id} · {s.spaceType} · {s.capacity} мест · этаж {s.floor.floorNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.bookable ? "✓ Доступно для бронирования" : "✗ Недоступно"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

      {/* Модальное окно бронирования */}
      {accessToken && (
        <BookingModal
          isOpen={showBookingModal}
          space={selectedSpace}
          date={date}
          accessToken={accessToken}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSpace(null);
          }}
          onBookingCreated={handleBookingCreated}
        />
      )}
    </div>
  );
};



