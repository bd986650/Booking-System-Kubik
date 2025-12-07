"use client";

import React, { useState } from "react";
import type { BookingItem, SpaceType, SpaceItem, TimeIntervalItem } from "@/entities/booking";
import { formatTimeWithOffset } from "@/features/booking";
import { CustomSelect } from "@/shared/ui";

interface UserBookingsSectionProps {
  userEmail: string;
  userLocationId: number;
  activeBookings: BookingItem[];
  allBookings: BookingItem[];
  loading: boolean;
  spaceTypes: SpaceType[];
  spaces: SpaceItem[];
  selectedSpaceId: number | null;
  setSelectedSpaceId: (id: number | null) => void;
  bookingDate: string;
  setBookingDate: (date: string) => void;
  intervals: TimeIntervalItem[];
  onFilterSpaces: (locationId: number, spaceTypeId: number, floorNumber?: number) => Promise<void>;
  onLoadIntervals: (date: string, spaceId: number) => Promise<void>;
  onCreateBooking: (userEmail: string, start: string, end: string, spaceTypeId?: number) => Promise<void>;
  creatingBooking: boolean;
  accessToken: string;
  setSpaces: (spaces: SpaceItem[]) => void;
}

export const UserBookingsSection: React.FC<UserBookingsSectionProps> = ({
  userEmail,
  userLocationId,
  activeBookings,
  allBookings,
  loading,
  spaceTypes,
  spaces,
  selectedSpaceId,
  setSelectedSpaceId,
  bookingDate,
  setBookingDate,
  intervals,
  onFilterSpaces,
  onLoadIntervals,
  onCreateBooking,
  creatingBooking,
  setSpaces,
  // accessToken не используется, но оставлен для совместимости API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accessToken: _accessToken,
}) => {
  const [spaceTypeId, setSpaceTypeId] = useState<number | null>(null);
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleFilter = async () => {
    if (!spaceTypeId) return;
    await onFilterSpaces(userLocationId, spaceTypeId, floorNumber ? Number(floorNumber) : undefined);
  };

  const handleLoadIntervals = async () => {
    if (!bookingDate || !selectedSpaceId) return;
    await onLoadIntervals(bookingDate, selectedSpaceId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Бронирования пользователя: {userEmail}</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {showCreateForm ? "Скрыть форму" : "Создать бронирование"}
        </button>
      </div>

      {/* Форма создания бронирования */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-3">Создать бронирование от имени пользователя</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Тип помещения</label>
              <CustomSelect
                value={spaceTypeId}
                onChange={(val) => {
                  const next = val ? Number(val) : null;
                  setSpaceTypeId(next);
                  setSpaces([]);
                  setSelectedSpaceId(null);
                }}
                options={spaceTypes.map((t) => ({
                  value: t.id,
                  label: t.type,
                }))}
                placeholder="— выберите —"
                size="md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Этаж (опц.)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Найти помещения
              </button>
            </div>
          </div>

          {spaces.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Выберите помещение</label>
              <CustomSelect
                value={selectedSpaceId}
                onChange={(val) => setSelectedSpaceId(val ? Number(val) : null)}
                options={spaces.map((s) => ({
                  value: s.id,
                  label: `#${s.id} · ${s.spaceType} · ${s.capacity} мест · этаж ${s.floor.floorNumber}`,
                }))}
                placeholder="— выберите —"
                size="md"
              />
            </div>
          )}

          {selectedSpaceId && (
            <div className="mb-4">
              <div className="flex gap-3 items-end mb-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Дата</label>
                  <input
                    type="date"
                    className="border rounded px-3 py-2"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleLoadIntervals}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Показать интервалы
                </button>
              </div>

              {intervals.length > 0 && (
                <div className="grid md:grid-cols-2 gap-3">
                  {intervals.map((it, idx) => (
                    <div
                      key={idx}
                      className={`border rounded p-3 ${!(it.status === "available" || it.available === true) ? "opacity-60" : ""}`}
                    >
                      <div className="font-medium">
                        {formatTimeWithOffset(it.start, it.offset)} — {formatTimeWithOffset(it.end, it.offset)}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
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
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          onClick={() => onCreateBooking(userEmail, it.start, it.end, spaceTypeId || undefined)}
                          disabled={creatingBooking}
                        >
                          {creatingBooking ? "Создание..." : "Забронировать"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Активные бронирования */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Активные бронирования</h4>
        {loading ? (
          <p className="text-gray-500">Загрузка...</p>
        ) : activeBookings.length === 0 ? (
          <p className="text-gray-500">Нет активных бронирований</p>
        ) : (
          <ul className="space-y-2">
            {activeBookings.map((b) => (
              <li key={b.id} className="border rounded p-3">
                <div className="font-medium">#{b.id} · {b.spaceName} · {b.locationName}</div>
                <div className="text-sm text-gray-500">
                  {new Date(b.start).toLocaleString()} — {new Date(b.end).toLocaleString()} · {b.bookingType}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Все бронирования */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Все бронирования</h4>
        {loading ? (
          <p className="text-gray-500">Загрузка...</p>
        ) : allBookings.length === 0 ? (
          <p className="text-gray-500">История пуста</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-auto">
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
  );
};

