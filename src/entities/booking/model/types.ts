// 6.3 Получить типы пространств по локации
// GET /api/locations/{locationId}/spacetypes
// Примечание: Возвращается упрощенный список типов пространств, содержащий только id и type.
// Информация о allowedDurations и location не включается в ответ.
export interface SpaceType {
  id: number;
  type: string;
}

// 2.2 Фильтрация пространств
// POST /api/booking/space-filter
export interface SpaceFilterRequest {
  locationId: number; // обязательное
  spaceTypeId: number; // обязательное
  floorNumber?: number; // опционально
}

export interface Point {
  x: number;
  y: number;
}

export interface Floor {
  id: number;
  floorNumber: number;
  polygon: Point[];
}

export interface SpaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpaceItem {
  id: number;
  locationId: number;
  spaceTypeId: number;
  spaceType: string;
  capacity: number;
  floor: Floor;
  bookable: boolean;
  bounds: SpaceBounds;
}

// 6.4 Получить пространства по локации и этажу
// GET /api/locations/{locationId}/spaces?floorNumber={floorNumber}
export interface FloorWithPolygon {
  id: number;
  floorNumber: number;
  polygon: Point[]; // Массив объектов {x, y}
}

export interface SpacesByFloorResponse {
  floor: FloorWithPolygon;
  spaces: SpaceItem[];
}

// 2.3 Получить доступные временные интервалы
// POST /api/booking/time-intervals
export interface TimeIntervalRequest {
  date: string; // YYYY-MM-DD, обязательное
  spaceId: number; // обязательное
}

export interface TimeIntervalItem {
  offset?: string; // +03:00
  start: string; // ISO 8601
  end: string; // ISO 8601
  status?: "available" | "unavailable" | string;
  available?: boolean; // Для обратной совместимости
  availableDurations?: string[]; // Массив доступных длительностей в формате ISO 8601 Duration (PT30M, PT1H и т.д.)
}

// 2.4 Создать бронирование
// POST /api/booking/book
export interface CreateBookingRequest {
  spaceId: number; // обязательное
  type: string; // обязательное, тип бронирования
  start: string; // обязательное, ISO 8601
  end: string; // обязательное, ISO 8601
}

// 2.4, 2.6, 2.7 Ответы бронирования
export interface BookingItem {
  id: number;
  userEmail: string;
  locationName: string;
  locationId: number;
  spaceName: string;
  spaceId: number;
  start: string; // ISO 8601
  end: string; // ISO 8601
  bookingType: string;
  status: "ACTIVE" | "CANCELLED" | string;
}


