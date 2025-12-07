import { useAuthStore } from "../model/authStore";
import { authApi } from "../api/auth";
import { logger } from "@/shared/lib/logger";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";

/**
 * Хук для принудительного обновления токена и данных пользователя
 * Полезно после изменения ролей на бэкенде
 * 
 * @returns Функция для принудительного обновления
 */
export const useForceRefresh = () => {
  const { accessToken, refreshToken, setTokens, setUser, logout } = useAuthStore();

  const forceRefresh = async (showNotification = true): Promise<boolean> => {
    if (!accessToken || !refreshToken) {
      if (showNotification) {
        showErrorToast("Нет токенов для обновления");
      }
      return false;
    }

    try {
      // Обновляем токен
      const refreshResponse = await authApi.refreshToken({ refreshToken });

      if (!refreshResponse.data) {
        if (showNotification) {
          showErrorToast("Не удалось обновить токен");
        }
        return false;
      }

      // Обновляем токены в store
      setTokens(
        refreshResponse.data.accessToken,
        refreshResponse.data.refreshToken
      );

      // Получаем актуальные данные пользователя (включая роли)
      const checkResponse = await authApi.checkAuth(refreshResponse.data.accessToken);

      if (checkResponse.data) {
        logger.debug("Force refresh successful", {
          roles: checkResponse.data.roles,
          organizationId: checkResponse.data.organizationId,
        });

        // Обновляем данные пользователя
        setUser({
          email: checkResponse.data.email,
          fullName: checkResponse.data.fullName,
          locationId: checkResponse.data.locationId,
          locationName: checkResponse.data.locationName,
          roles: checkResponse.data.roles || [],
          organizationId: checkResponse.data.organizationId,
        });

        if (showNotification) {
          showSuccessToast("Данные обновлены");
        }

        return true;
      } else {
        if (showNotification) {
          showErrorToast("Не удалось получить данные пользователя");
        }
        return false;
      }
    } catch (error) {
      logger.error("Error during force refresh", error);
      if (showNotification) {
        showErrorToast("Ошибка при обновлении данных");
      }
      return false;
    }
  };

  return { forceRefresh };
};

