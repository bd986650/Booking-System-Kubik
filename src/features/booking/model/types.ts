export interface SpaceType {
  id: number;
  type: string;
  allowedDurations: string[];
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
  floor: number;
  bookable: boolean;
  bounds?: SpaceBounds;
}

export interface SpaceFilterRequest {
  locationId: number;
  spaceTypeId: number;
  floor?: number;
}

export interface TimeIntervalRequest {
  date: string; // YYYY-MM-DD
  spaceId: number;
}

export interface TimeIntervalItem {
  offset: string; // +03:00
  start: string; // ISO start
  end: string; // ISO end
  status: "available" | "unavailable" | string;
  availableDurations: string[];
}

export interface CreateBookingRequest {
  spaceId: number;
  type: string;
  start: string; // ISO
  end: string; // ISO
}

export interface BookingItem {
  id: number;
  userEmail: string;
  locationName: string;
  locationId: number;
  spaceName: string;
  spaceId: number;
  start: string;
  end: string;
  bookingType: string;
  status: "ACTIVE" | "CANCELLED" | string;
}



