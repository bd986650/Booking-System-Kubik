import { apiRequest, authenticatedRequest } from "@/shared/api/config";
import type {
  SpaceType,
  SpaceFilterRequest,
  SpaceItem,
  TimeIntervalRequest,
  TimeIntervalItem,
  CreateBookingRequest,
  BookingItem,
  SpacesByFloorResponse,
} from "../model/types";

/**
 * API для работы с бронированиями
 * Документация: /api/booking
 */
export const bookingApi = {
  /**
   * 6.3 Получить типы пространств по локации
   * GET /api/locations/{locationId}/spacetypes
   * Требуется: JWT токен
   * @param locationId - ID локации
   * @param token - JWT токен
   */
  getSpaceTypes: async (locationId: number, token: string) => {
    return authenticatedRequest<SpaceType[]>(`/api/locations/${locationId}/spacetypes`, token, {
      method: "GET",
    });
  },

  /**
   * 6.4 Получить пространства по локации и этажу
   * GET /api/locations/{locationId}/spaces?floorNumber={floorNumber}
   * Требуется: JWT токен
   * @param locationId - ID локации
   * @param floorNumber - номер этажа (обязательно)
   * @param token - JWT токен
   * @returns объект с floor (содержит polygon) и spaces
   */
  getSpacesByLocationAndFloor: async (locationId: number, floorNumber: number, token: string) => {
    return authenticatedRequest<SpacesByFloorResponse>(
      `/api/locations/${locationId}/spaces?floorNumber=${floorNumber}`,
      token,
      {
        method: "GET",
      }
    );
  },

  /**
   * 2.2 Фильтрация пространств
   * POST /api/booking/space-filter
   * Требуется: JWT токен
   * @param payload - locationId (обязательно), spaceTypeId (обязательно), floorNumber (опционально)
   * @param token - JWT токен
   */
  filterSpaces: async (payload: SpaceFilterRequest, token: string) => {
    return authenticatedRequest<SpaceItem[]>("/api/booking/space-filter", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * 2.3 Получить доступные временные интервалы
   * POST /api/booking/time-intervals
   * Требуется: JWT токен
   * @param payload - date (YYYY-MM-DD, обязательно), spaceId (обязательно)
   * @param token - JWT токен
   */
  getTimeIntervals: async (payload: TimeIntervalRequest, token: string) => {
    // Валидация формата даты
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(payload.date)) {
      throw new Error(`Неверный формат даты: ${payload.date}. Ожидается формат YYYY-MM-DD`);
    }
    
    // Убеждаемся, что spaceId - число
    if (!payload.spaceId || typeof payload.spaceId !== 'number') {
      throw new Error(`Неверный spaceId: ${payload.spaceId}. Ожидается число`);
    }
    
    const requestPayload = {
      date: payload.date,
      spaceId: payload.spaceId,
    };
    
    return authenticatedRequest<TimeIntervalItem[]>("/api/booking/time-intervals", token, {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
  },

  /**
   * 2.4 Создать бронирование
   * POST /api/booking/book
   * Требуется: JWT токен
   * @param payload - spaceId, type, start (ISO 8601), end (ISO 8601)
   * @param token - JWT токен
   * @returns 201 Created с данными бронирования
   */
  createBooking: async (payload: CreateBookingRequest, token: string) => {
    return authenticatedRequest<BookingItem>("/api/booking/book", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * 2.5 Отменить бронирование
   * POST /api/booking/cancel/{id}
   * Требуется: JWT токен
   * @param id - ID бронирования
   * @param token - JWT токен
   * @returns 200 OK
   */
  cancelBooking: async (id: number, token: string) => {
    return authenticatedRequest<void>(`/api/booking/cancel/${id}`, token, {
      method: "POST",
    });
  },

  /**
   * 2.6 Получить активные бронирования пользователя
   * GET /api/booking/active-bookings
   * Требуется: JWT токен
   * @param token - JWT токен
   */
  getActiveBookings: async (token: string) => {
    return authenticatedRequest<BookingItem[]>("/api/booking/active-bookings", token, {
      method: "GET",
    });
  },

  /**
   * 2.7 Получить все бронирования пользователя
   * GET /api/booking/all-bookings
   * Требуется: JWT токен
   * @param token - JWT токен
   */
  getAllBookings: async (token: string) => {
    return authenticatedRequest<BookingItem[]>("/api/booking/all-bookings", token, {
      method: "GET",
    });
  },
};


