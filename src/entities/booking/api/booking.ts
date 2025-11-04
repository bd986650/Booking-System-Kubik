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
  getSpaceTypes: async () => apiRequest<SpaceType[]>("/api/booking/types", { method: "GET" }),
  filterSpaces: async (payload: SpaceFilterRequest) =>
    apiRequest<SpaceItem[]>("/api/booking/space-filter", { method: "POST", body: JSON.stringify(payload) }),
  getTimeIntervals: async (payload: TimeIntervalRequest) =>
    apiRequest<TimeIntervalItem[]>("/api/booking/time-intervals", { method: "POST", body: JSON.stringify(payload) }),
  createBooking: async (payload: CreateBookingRequest, token: string) =>
    authenticatedRequest<BookingItem>("/api/booking/book", token, { method: "POST", body: JSON.stringify(payload) }),
  cancelBooking: async (id: number, token: string) =>
    authenticatedRequest<void>(`/api/booking/cancel/${id}`, token, { method: "POST" }),
  getActiveBookings: async (token: string) =>
    authenticatedRequest<BookingItem[]>("/api/booking/active-bookings", token, { method: "GET" }),
  getAllBookings: async (token: string) =>
    authenticatedRequest<BookingItem[]>("/api/booking/all-bookings", token, { method: "GET" }),
};


