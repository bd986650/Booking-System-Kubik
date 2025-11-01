import { apiRequest } from "@/shared/api/config";

export interface Organization {
  id: number;
  name: string;
  isActive: boolean;
}

export const organizationsApi = {
  // Получение всех организаций
  async getAll() {
    return apiRequest<Organization[]>("/api/organizations", {
      method: "GET",
    });
  },
};

