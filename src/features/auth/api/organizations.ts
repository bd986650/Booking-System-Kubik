import { apiRequest } from "@/shared/api/config";

export interface Organization {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Location {
  id: number;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
}

export const organizationsApi = {
  // Получение всех организаций
  async getAll() {
    return apiRequest<Organization[]>("/api/organizations", {
      method: "GET",
    });
  },

  // Получение локаций по organizationId
  async getLocationsByOrganization(organizationId: number) {
    return apiRequest<Location[]>(`/api/organizations/${organizationId}/locations`, {
      method: "GET",
    });
  },
};

