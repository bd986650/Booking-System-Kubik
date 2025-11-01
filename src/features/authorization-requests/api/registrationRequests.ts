import { apiRequest, authenticatedRequest } from "@/shared/api/config";
import type { RegistrationRequest } from "../model/types";

export const registrationRequestsApi = {
  /**
   * Получение списка запросов на регистрацию
   * GET /api/admin/work-space/registration-requests
   */
  getRequests: async (token: string): Promise<{
    data?: RegistrationRequest[];
    error?: { message: string };
  }> => {
    try {
      const response = await authenticatedRequest<RegistrationRequest[]>(
        "/api/admin/work-space/registration-requests",
        token,
        { method: "GET" }
      );

      if (response.error) {
        return { error: response.error };
      }

      return { data: response.data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Неизвестная ошибка",
        },
      };
    }
  },

  /**
   * Одобрение запроса на регистрацию
   * POST /api/admin/work-space/registration-requests/{id}/approve
   */
  approveRequest: async (
    id: number,
    token: string
  ): Promise<{
    data?: void;
    error?: { message: string };
  }> => {
    try {
      const response = await authenticatedRequest<void>(
        `/api/admin/work-space/registration-requests/${id}/approve`,
        token,
        { method: "POST" }
      );

      if (response.error) {
        return { error: response.error };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Неизвестная ошибка",
        },
      };
    }
  },

  /**
   * Отклонение запроса на регистрацию
   * POST /api/admin/work-space/registration-requests/{id}/reject
   */
  rejectRequest: async (
    id: number,
    token: string
  ): Promise<{
    data?: void;
    error?: { message: string };
  }> => {
    try {
      const response = await authenticatedRequest<void>(
        `/api/admin/work-space/registration-requests/${id}/reject`,
        token,
        { method: "POST" }
      );

      if (response.error) {
        return { error: response.error };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Неизвестная ошибка",
        },
      };
    }
  },
};

