import { apiRequest, authenticatedRequest } from "@/shared/api/config";
import type {
  SpaceType,
  SpaceFilterRequest,
  SpaceItem,
  TimeIntervalRequest,
  TimeIntervalItem,
  CreateBookingRequest,
  BookingItem,
} from "../model/types";

export const bookingApi = {
  // 2.1 Получение всех типов помещений
  getSpaceTypes: async () => {
    return apiRequest<SpaceType[]>("/api/booking/types", { method: "GET" });
  },

  // 2.2 Фильтрация помещений
  filterSpaces: async (payload: SpaceFilterRequest) => {
    return apiRequest<SpaceItem[]>("/api/booking/space-filter", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 2.3 Доступные временные интервалы
  getTimeIntervals: async (payload: TimeIntervalRequest) => {
    return apiRequest<TimeIntervalItem[]>("/api/booking/time-intervals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 2.4 Создание бронирования (JWT)
  createBooking: async (payload: CreateBookingRequest, token: string) => {
    return authenticatedRequest<BookingItem>("/api/booking/book", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 2.5 Отмена бронирования (JWT)
  cancelBooking: async (id: number, token: string) => {
    return authenticatedRequest<void>(`/api/booking/cancel/${id}`, token, {
      method: "POST",
    });
  },

  // 2.6 Активные бронирования пользователя (JWT)
  getActiveBookings: async (token: string) => {
    return authenticatedRequest<BookingItem[]>("/api/booking/active-bookings", token, {
      method: "GET",
    });
  },

  // 2.7 Все бронирования пользователя (JWT)
  getAllBookings: async (token: string) => {
    return authenticatedRequest<BookingItem[]>("/api/booking/all-bookings", token, {
      method: "GET",
    });
  },
};



