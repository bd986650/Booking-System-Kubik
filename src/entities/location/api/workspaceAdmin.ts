import { authenticatedRequest } from "@/shared/api/config";

export interface UserInfo {
  email: string;
  fullName: string;
  locationId: number;
  locationName: string;
  roles: string[];
}

export interface CreateLocationRequest {
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  workDayStart: string;
  workDayEnd: string;
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
}

export interface CreateSpaceRequest {
  locationId: number;
  spaceTypeId: number;
  capacity: number;
  floorNumber: number; // Изменено с floor на floorNumber согласно документации
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
  type: string; // Название типа пространства (например, "Переговорная")
  allowedDurations: string[]; // Массив разрешенных длительностей (например, ["30m", "1h", "2h"])
  locationId: number; // ID локации, к которой относится тип пространства
}

export interface SpaceTypeItem {
  id: number;
  name: string; // Изменено с type на name
  description: string; // Добавлено
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

/**
 * 4.4 Создать пространства на этаже
 * POST /api/admin/work-space/create-floor-spaces
 */
export interface Point {
  x: number;
  y: number;
}

export interface CreateFloorSpaceItem {
  spaceTypeId: number;
  capacity: number;
  locationId: number; // Требуется сервером в каждом элементе spaces
  floorNumber: number; // Требуется сервером в каждом элементе spaces
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface CreateFloorSpacesRequest {
  locationId: number;
  floorNumber: number;
  polygon: Point[]; // Границы этажа (массив объектов {x, y})
  spaces: CreateFloorSpaceItem[];
}

/**
 * 4.7 Получить запросы на регистрацию
 * GET /api/admin/work-space/registration-requests
 */
export interface RegistrationRequest {
  id: number;
  email: string;
  fullName: string;
  position: string;
  locationId: number;
  organizationId: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export const workspaceAdminApi = {
  /**
   * 4.1 Создать локацию
   * POST /api/admin/work-space/create-location
   * @returns 201 Created - ID созданной локации (number)
   */
  createLocation: async (payload: CreateLocationRequest, token: string) =>
    authenticatedRequest<number>("/api/admin/work-space/create-location", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * 4.2 Создать пространство
   * POST /api/admin/work-space/create-space
   * @returns 201 Created - объект Space
   */
  createSpace: async (payload: CreateSpaceRequest, token: string) =>
    authenticatedRequest<SpaceCreatedItem>("/api/admin/work-space/create-space", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * 4.3 Создать тип пространства
   * POST /api/admin/work-space/create-spacetype
   * Параметры: type, locationId, allowedDurations
   * @returns 201 Created (без тела)
   * @throws 409 Conflict при дубликате типа
   */
  createSpaceType: async (payload: CreateSpaceTypeRequest, token: string) =>
    authenticatedRequest<void>("/api/admin/work-space/create-spacetype", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * 4.4 Создать пространства на этаже
   * POST /api/admin/work-space/create-floor-spaces
   * @returns 201 Created - список объектов Space
   */
  createFloorSpaces: async (payload: CreateFloorSpacesRequest, token: string) =>
    authenticatedRequest<SpaceCreatedItem[]>("/api/admin/work-space/create-floor-spaces", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * 4.5 Получить бронирования по локации
   * GET /api/admin/work-space/location/{locationId}/bookings
   */
  getLocationActiveBookings: async (locationId: number, token: string) =>
    authenticatedRequest<AdminBookingItem[]>(`/api/admin/work-space/location/${locationId}/bookings`, token, {
      method: "GET",
    }),

  /**
   * 4.6 Получить пользователей по локации
   * GET /api/admin/work-space/location/{locationId}/users
   */
  getLocationUsers: async (locationId: number, token: string) =>
    authenticatedRequest<UserInfo[]>(`/api/admin/work-space/location/${locationId}/users`, token, {
      method: "GET",
    }),

  /**
   * 4.7 Получить запросы на регистрацию
   * GET /api/admin/work-space/registration-requests
   */
  getRegistrationRequests: async (token: string) =>
    authenticatedRequest<RegistrationRequest[]>("/api/admin/work-space/registration-requests", token, {
      method: "GET",
    }),

  /**
   * 4.8 Одобрить запрос на регистрацию
   * POST /api/admin/work-space/registration-requests/{id}/approve
   * @returns 200 OK
   */
  approveRegistrationRequest: async (id: number, token: string) =>
    authenticatedRequest<void>(`/api/admin/work-space/registration-requests/${id}/approve`, token, {
      method: "POST",
    }),

  /**
   * 4.9 Отклонить запрос на регистрацию
   * POST /api/admin/work-space/registration-requests/{id}/reject
   * @returns 200 OK
   */
  rejectRegistrationRequest: async (id: number, token: string) =>
    authenticatedRequest<void>(`/api/admin/work-space/registration-requests/${id}/reject`, token, {
      method: "POST",
    }),
};


