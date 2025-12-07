"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { SpaceItem, TimeIntervalItem } from "@/entities/booking";
import { Button } from "@/shared/ui/buttons";
import { formatTimeWithOffset, processIntervals } from "@/features/booking";
import { bookingApi } from "@/entities/booking";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";

interface BookingModalProps {
  isOpen: boolean;
  space: SpaceItem | null;
  date: string;
  accessToken: string;
  onClose: () => void;
  onBookingCreated: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  space,
  date,
  accessToken,
  onClose,
  onBookingCreated,
}) => {
  const [intervals, setIntervals] = useState<TimeIntervalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<TimeIntervalItem | null>(null);

  const loadIntervals = useCallback(async () => {
    if (!space || !date || !accessToken) return;
    
    setLoading(true);
    try {
      const res = await bookingApi.getTimeIntervals({ date, spaceId: space.id }, accessToken);
      if (res.data) {
        const processedIntervals = processIntervals(res.data);
        setIntervals(processedIntervals);
      }
      if (res.error) {
        showErrorToast(res.error.message, "Ошибка загрузки интервалов");
      }
    } catch {
      showErrorToast("Не удалось загрузить интервалы", "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [space, date, accessToken]);

  // Загружаем интервалы при открытии модального окна
  useEffect(() => {
    if (isOpen && space && date && accessToken) {
      loadIntervals();
    } else {
      setIntervals([]);
      setSelectedInterval(null);
    }
  }, [isOpen, space, date, accessToken, loadIntervals]);

  const handleCreateBooking = async () => {
    if (!selectedInterval || !space || !accessToken || creatingBooking) return;

    setCreatingBooking(true);
    try {
      const bookingType = space.spaceType || "MEETING";
      const res = await bookingApi.createBooking(
        {
          spaceId: space.id,
          type: bookingType,
          start: selectedInterval.start,
          end: selectedInterval.end,
        },
        accessToken
      );

      if (res.error) {
        showErrorToast(res.error.message, "Ошибка бронирования");
      } else if (res.data) {
        showSuccessToast(
          `Бронирование создано успешно! ${res.data.spaceName} на ${new Date(res.data.start).toLocaleString()}`,
          "Бронирование создано"
        );
        onBookingCreated();
        onClose();
      }
    } catch {
      showErrorToast("Не удалось создать бронирование", "Ошибка");
    } finally {
      setCreatingBooking(false);
    }
  };

  if (!isOpen || !space) return null;

  const availableIntervals = intervals.filter(
    (it) => it.status === "available" || it.available === true
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-3xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Бронирование пространства</h2>
            <p className="text-sm text-gray-500 mt-1">
              {space.spaceType} · {space.capacity} мест · Этаж {space.floor.floorNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Мини‑карта пространства + инфо */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 md:gap-6 items-stretch">
            {/* Мини‑карта */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-[11px] font-medium text-slate-500 mb-2">
                Пространство на плане (условное расположение)
              </p>
              <div className="h-40 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center">
                <svg
                  viewBox="0 0 200 120"
                  className="w-full h-full"
                >
                  <defs>
                    <pattern
                      id="mini-grid-small"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="10" height="10" fill="transparent" />
                      <path
                        d="M10 0 L10 10 M0 10 L10 10"
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect
                    x={0}
                    y={0}
                    width={200}
                    height={120}
                    fill="url(#mini-grid-small)"
                  />
                  {/* Комната по центру */}
                  <g transform="translate(60,30)">
                    <rect
                      width={80}
                      height={60}
                      rx={6}
                      ry={6}
                      fill="rgba(37,99,235,0.16)"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                    />
                    <text
                      x={40}
                      y={32}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="#1e3a8a"
                    >
                      {space.spaceType}
                    </text>
                    <text
                      x={40}
                      y={46}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fill="#1e3a8a"
                    >
                      {space.capacity} мест
                    </text>
                  </g>
                </svg>
              </div>
            </div>

          {/* Информация о пространстве */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">ID пространства:</span>
                <span className="ml-2 font-semibold text-gray-900">#{space.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Тип:</span>
                <span className="ml-2 font-semibold text-gray-900">{space.spaceType}</span>
              </div>
              <div>
                <span className="text-gray-500">Вместимость:</span>
                <span className="ml-2 font-semibold text-gray-900">{space.capacity} мест</span>
              </div>
              <div>
                <span className="text-gray-500">Этаж:</span>
                <span className="ml-2 font-semibold text-gray-900">{space.floor.floorNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Выбор даты */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дата бронирования</label>
            <input
              type="date"
              value={date}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          {/* Доступные интервалы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите время {loading && "(загрузка...)"}
            </label>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Загрузка доступных интервалов...</p>
              </div>
            ) : availableIntervals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Нет доступных интервалов на выбранную дату</p>
                <Button
                  onClick={loadIntervals}
                  variant="outline"
                  color="blue"
                  className="mt-4"
                >
                  Обновить
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableIntervals.map((interval, idx) => {
                  const isSelected = selectedInterval?.start === interval.start && selectedInterval?.end === interval.end;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedInterval(interval)}
                      className={`p-3 border rounded-lg transition-all text-left ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className="font-semibold text-sm text-gray-900">
                        {formatTimeWithOffset(interval.start, interval.offset)} —{" "}
                        {formatTimeWithOffset(interval.end, interval.offset)}
                      </div>
                      {interval.availableDurations && interval.availableDurations.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {interval.availableDurations.map((d) => {
                            const match = d.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
                            if (match) {
                              const hours = match[1] ? `${match[1]} ч` : "";
                              const minutes = match[2] ? `${match[2]} мин` : "";
                              return hours && minutes ? `${hours} ${minutes}` : hours || minutes;
                            }
                            return d;
                          }).join(", ")}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              color="gray"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateBooking}
              variant="filled"
              color="blue"
              className="flex-1"
              disabled={!selectedInterval || creatingBooking}
            >
              {creatingBooking ? "Бронирование..." : "Забронировать"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

