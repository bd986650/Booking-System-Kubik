import { authenticatedRequest } from "@/shared/api/config";
import type { UserInfo, AssignRoleRequest, RevokeRoleRequest } from "../model/types";

export const usersApi = {
  /**
   * Получение списка всех пользователей
   * GET /api/admin/users
   */
  getAllUsers: async (token: string): Promise<{
    data?: UserInfo[];
    error?: { message: string; status?: number };
  }> => {
    try {
      console.log("[usersApi.getAllUsers] Making request with token:", {
        hasToken: !!token,
        tokenLength: token?.length,
      });

      const response = await authenticatedRequest<UserInfo[]>(
        "/api/admin/users",
        token,
        { method: "GET" }
      );

      console.log("[usersApi.getAllUsers] Response:", {
        hasData: !!response.data,
        hasError: !!response.error,
        errorStatus: response.error?.status,
        errorMessage: response.error?.message,
      });

      if (response.error) {
        return { error: response.error };
      }

      return { data: response.data };
    } catch (error) {
      console.error("[usersApi.getAllUsers] Exception:", error);
      return {
        error: {
          message: error instanceof Error ? error.message : "Неизвестная ошибка",
        },
      };
    }
  },

  /**
   * Назначение роли пользователю
   * POST /api/admin/assign-role
   */
  assignRole: async (
    data: AssignRoleRequest,
    token: string
  ): Promise<{
    data?: void;
    error?: { message: string; status?: number };
  }> => {
    try {
      const response = await authenticatedRequest<void>(
        "/api/admin/assign-role",
        token,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
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
   * Отзыв роли у пользователя
   * POST /api/admin/revoke-role
   */
  revokeRole: async (
    data: RevokeRoleRequest,
    token: string
  ): Promise<{
    data?: void;
    error?: { message: string; status?: number };
  }> => {
    try {
      const response = await authenticatedRequest<void>(
        "/api/admin/revoke-role",
        token,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
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

