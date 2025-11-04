import { authenticatedRequest } from "@/shared/api/config";
import type { UserInfo } from "../model/types";

export interface CreateLocationRequest {
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  workDayStart: string; // HH:mm:ss
  workDayEnd: string;   // HH:mm:ss
  timeZone: string;
  organizationId: number;
}

export interface LocationItem {
  id: number;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  workDayStart: string;
  workDayEnd: string;
  timeZone: string;
  organizationId?: number;
}

export interface CreateSpaceRequest {
  locationId: number;
  spaceTypeId: number;
  capacity: number;
  floor: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SpaceCreatedItem {
  id: number;
  capacity: number;
  floor: number;
  isBookable: boolean;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface CreateSpaceTypeRequest {
  type: string;
  allowedDurations: string[];
}

export interface SpaceTypeItem {
  id: number;
  type: string;
  allowedDurations: string[];
}

export interface AdminBookingItem {
  id: number;
  userEmail: string;
  locationName: string;
  locationId: number;
  spaceName: string;
  spaceId: number;
  start: string;
  end: string;
  bookingType: string;
  status: string;
}

export const workspaceAdminApi = {
  createLocation: async (payload: CreateLocationRequest, token: string) => {
    return authenticatedRequest<LocationItem>(
      "/api/admin/work-space/create-location",
      token,
      { method: "POST", body: JSON.stringify(payload) }
    );
  },

  createSpace: async (payload: CreateSpaceRequest, token: string) => {
    return authenticatedRequest<SpaceCreatedItem>(
      "/api/admin/work-space/create-space",
      token,
      { method: "POST", body: JSON.stringify(payload) }
    );
  },

  createSpaceType: async (payload: CreateSpaceTypeRequest, token: string) => {
    return authenticatedRequest<SpaceTypeItem>(
      "/api/admin/work-space/create-spacetype",
      token,
      { method: "POST", body: JSON.stringify(payload) }
    );
  },

  getLocationActiveBookings: async (locationId: number, token: string) => {
    return authenticatedRequest<AdminBookingItem[]>(
      `/api/admin/work-space/location/${locationId}/bookings`,
      token,
      { method: "GET" }
    );
  },

  getLocationUsers: async (locationId: number, token: string) => {
    return authenticatedRequest<UserInfo[]>(
      `/api/admin/work-space/location/${locationId}/users`,
      token,
      { method: "GET" }
    );
  },

  // Получение информации о локации по ID (для получения organizationId)
  getLocationById: async (locationId: number, token: string) => {
    // Предполагаем, что есть эндпоинт для получения информации о локации
    // Если такого нет, можно использовать другой способ получения organizationId
    return authenticatedRequest<LocationItem>(
      `/api/admin/work-space/location/${locationId}`,
      token,
      { method: "GET" }
    );
  },
};



