import { authenticatedRequest } from "@/shared/api/config";
import type { BookingItem } from "@/entities/booking";

/**
 * API для административных функций
 * Документация: /api/admin
 * Требуется: JWT токен с правами администратора
 */

/**
 * 3.1 Отменить бронирование (админ)
 * POST /api/admin/cancel/{id}
 */
export interface AdminCancelBookingRequest {
  id: number;
}

/**
 * 3.2, 3.3 Получить бронирования пользователя (админ)
 * GET /api/admin/users/active-bookings?email={email}
 * GET /api/admin/users/bookings?email={email}
 */
export interface AdminGetUserBookingsRequest {
  email: string;
}

/**
 * 3.8 Создать бронирование от имени пользователя (админ)
 * POST /api/admin/book
 */
export interface AdminCreateBookingRequest {
  userEmail: string; // обязательное
  spaceId: number; // обязательное
  type: string; // обязательное
  start: string; // обязательное, ISO 8601
  end: string; // обязательное, ISO 8601
}

export const adminApi = {
  /**
   * 3.1 Отменить бронирование (админ)
   * POST /api/admin/cancel/{id}
   * Требуется: JWT токен с правами администратора
   * @param id - ID бронирования
   * @param token - JWT токен
   * @returns 200 OK
   */
  cancelBooking: async (id: number, token: string) => {
    return authenticatedRequest<void>(`/api/admin/cancel/${id}`, token, {
      method: "POST",
    });
  },

  /**
   * 3.2 Получить активные бронирования пользователя (админ)
   * GET /api/admin/users/active-bookings?email={email}
   * Требуется: JWT токен с правами администратора
   * @param email - email пользователя (обязательно)
   * @param token - JWT токен
   */
  getUserActiveBookings: async (email: string, token: string) => {
    const endpoint = `/api/admin/users/active-bookings?email=${encodeURIComponent(email)}`;
    return authenticatedRequest<BookingItem[]>(endpoint, token, {
      method: "GET",
    });
  },

  /**
   * 3.3 Получить все бронирования пользователя (админ)
   * GET /api/admin/users/bookings?email={email}
   * Требуется: JWT токен с правами администратора
   * @param email - email пользователя (обязательно)
   * @param token - JWT токен
   */
  getUserAllBookings: async (email: string, token: string) => {
    const endpoint = `/api/admin/users/bookings?email=${encodeURIComponent(email)}`;
    return authenticatedRequest<BookingItem[]>(endpoint, token, {
      method: "GET",
    });
  },

  /**
   * 3.4 Получить все активные бронирования (админ)
   * GET /api/admin/active-bookings
   * Требуется: JWT токен с правами администратора
   * @param token - JWT токен
   */
  getAllActiveBookings: async (token: string) => {
    return authenticatedRequest<BookingItem[]>("/api/admin/active-bookings", token, {
      method: "GET",
    });
  },

  /**
   * 3.8 Создать бронирование от имени пользователя (админ)
   * POST /api/admin/book
   * Требуется: JWT токен с правами администратора
   * @param payload - userEmail, spaceId, type, start (ISO 8601), end (ISO 8601)
   * @param token - JWT токен
   * @returns 201 Created с данными бронирования
   */
  createBookingForUser: async (payload: AdminCreateBookingRequest, token: string) => {
    return authenticatedRequest<BookingItem>("/api/admin/book", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

