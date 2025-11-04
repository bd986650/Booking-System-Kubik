"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { bookingApi } from "../api/booking";
import type {
  SpaceType,
  SpaceItem,
  TimeIntervalItem,
  BookingItem,
} from "../model/types";
import { canManageBooking, isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";

export const Bookings: React.FC = () => {
  const { user, accessToken } = useAuthStore();

  const defaultLocationId = user?.locationId || 0;
  const [locationId, setLocationId] = useState<number>(defaultLocationId);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [spaceTypeId, setSpaceTypeId] = useState<number | null>(null);
  const [floor, setFloor] = useState<string>("");
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [date, setDate] = useState<string>("");
  const [intervals, setIntervals] = useState<TimeIntervalItem[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingItem[]>([]);
  const [allBookings, setAllBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdminWorkspace = useMemo(() => isWorkspaceAdmin(user || null), [user]);
  const isAdminProject = useMemo(() => isProjectAdmin(user || null), [user]);

  useEffect(() => {
    (async () => {
      const res = await bookingApi.getSpaceTypes();
      if (res.data) setSpaceTypes(res.data);
    })();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      const [activeRes, allRes] = await Promise.all([
        bookingApi.getActiveBookings(accessToken),
        bookingApi.getAllBookings(accessToken),
      ]);
      if (activeRes.data) setActiveBookings(activeRes.data);
      if (allRes.data) setAllBookings(allRes.data);
    })();
  }, [accessToken]);

  const handleFilterSpaces = async () => {
    if (!locationId || !spaceTypeId) {
      setError("Укажите локацию и тип помещения");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await bookingApi.filterSpaces({
      locationId,
      spaceTypeId,
      floor: floor ? Number(floor) : undefined,
    });
    if (res.data) setSpaces(res.data);
    if (res.error) setError(res.error.message);
    setLoading(false);
  };

  const handleLoadIntervals = async () => {
    if (!date || !selectedSpaceId) {
      setError("Выберите помещение и дату");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await bookingApi.getTimeIntervals({ date, spaceId: selectedSpaceId });
    if (res.data) setIntervals(res.data);
    if (res.error) setError(res.error.message);
    setLoading(false);
  };

  const handleCreateBooking = async (start: string, end: string) => {
    if (!accessToken || !selectedSpaceId) return;
    const type = spaceTypes.find((t) => t.id === spaceTypeId)?.type || "";
    const res = await bookingApi.createBooking(
      { spaceId: selectedSpaceId, type, start, end },
      accessToken
    );
    if (res.error) {
      setError(res.error.message);
    } else {
      // Обновляем списки
      const [activeRes, allRes] = await Promise.all([
        bookingApi.getActiveBookings(accessToken),
        bookingApi.getAllBookings(accessToken),
      ]);
      if (activeRes.data) setActiveBookings(activeRes.data);
      if (allRes.data) setAllBookings(allRes.data);
    }
  };

  const handleCancel = async (booking: BookingItem) => {
    if (!accessToken) return;
    const canCancel = canManageBooking(user || null, { scope: "own", ownerEmail: booking.userEmail })
      || canManageBooking(user || null, { scope: "office", officeLocationId: booking.locationId })
      || canManageBooking(user || null, { scope: "organization" });
    if (!canCancel) return;
    const res = await bookingApi.cancelBooking(booking.id, accessToken);
    if (res.error) {
      setError(res.error.message);
    } else {
      // Обновляем списки
      const [activeRes, allRes] = await Promise.all([
        bookingApi.getActiveBookings(accessToken),
        bookingApi.getAllBookings(accessToken),
      ]);
      if (activeRes.data) setActiveBookings(activeRes.data);
      if (allRes.data) setAllBookings(allRes.data);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Бронирования</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Локация (ID)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={locationId || ""}
              onChange={(e) => setLocationId(Number(e.target.value))}
              disabled={!isAdminWorkspace && !isAdminProject}
            />
            {!isAdminWorkspace && !isAdminProject && (
              <p className="text-xs text-gray-500 mt-1">Ваш офис: {defaultLocationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Тип помещения</label>
            <select
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm text-gray-600 mb-1">Этаж (опц.)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilterSpaces}
              className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              Найти помещения
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Помещения</h2>
            {spaces.length === 0 ? (
              <p className="text-gray-500">Нет результатов. Уточните фильтры.</p>
            ) : (
              <ul className="divide-y">
                {spaces.map((s) => (
                  <li key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">#{s.id} · {s.spaceType} · {s.capacity} мест · этаж {s.floor}</div>
                      <div className="text-sm text-gray-500">Локация: {s.locationId} · {s.bookable ? "доступно" : "недоступно"}</div>
                    </div>
                    <button
                      className={`px-3 py-1 rounded ${selectedSpaceId === s.id ? "bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                      onClick={() => setSelectedSpaceId(s.id)}
                    >
                      {selectedSpaceId === s.id ? "Выбрано" : "Выбрать"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Доступные интервалы</h2>
            <div className="flex gap-3 items-end mb-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Дата</label>
                <input type="date" className="border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <button
                onClick={handleLoadIntervals}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Показать интервалы
              </button>
            </div>

            {intervals.length === 0 ? (
              <p className="text-gray-500">Выберите помещение и дату, затем нажмите &quot;Показать интервалы&quot;.</p>
            ) : (
              <ul className="grid md:grid-cols-2 gap-3">
                {intervals.map((it, idx) => (
                  <li key={idx} className={`border rounded p-3 ${it.status !== "available" ? "opacity-60" : ""}`}>
                    <div className="font-medium">{new Date(it.start).toLocaleTimeString()} — {new Date(it.end).toLocaleTimeString()} ({it.offset})</div>
                    <div className="text-sm text-gray-500 mb-2">Статус: {it.status}</div>
                    {it.status === "available" && (
                      <div className="flex flex-wrap gap-2">
                        {it.availableDurations.map((d) => (
                          <button
                            key={d}
                            className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                            onClick={() => {
                              // Вычислить конечное время по длительности? Бэкенд уже отдаёт интервалы; используем как есть
                              handleCreateBooking(it.start, it.end);
                            }}
                          >
                            Забронировать ({d})
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Мои активные бронирования</h2>
            {activeBookings.length === 0 ? (
              <p className="text-gray-500">Нет активных бронирований</p>
            ) : (
              <ul className="space-y-3">
                {activeBookings.map((b) => (
                  <li key={b.id} className="border rounded p-3">
                    <div className="font-medium">#{b.id} · {b.spaceName} · {b.locationName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(b.start).toLocaleString()} — {new Date(b.end).toLocaleString()} · {b.bookingType}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleCancel(b)}
                      >
                        Отменить
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">История бронирований</h2>
            {allBookings.length === 0 ? (
              <p className="text-gray-500">История пуста</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-auto">
                {allBookings.map((b) => (
                  <li key={b.id} className="border rounded p-3">
                    <div className="font-medium">#{b.id} · {b.spaceName} · {b.locationName} · {b.status}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(b.start).toLocaleString()} — {new Date(b.end).toLocaleString()} · {b.bookingType}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Примечание по карте: отдельный экран конструктора сейчас в /map. 
          Для пользовательской карты можно будет сделать просмотр слоями по выбранной локации. */}
    </div>
  );
};



