import { useEffect, useRef } from "react";
import { useAuthStore } from "../model/authStore";
import { authApi } from "../api/auth";
import { logger } from "@/shared/lib/logger";

/**
 * Хук для автоматического обновления токена перед истечением
 * Проверяет токен каждые 5 минут и обновляет если нужно
 * Также периодически обновляет данные пользователя (роли) для синхронизации с бэкендом
 */
export const useTokenRefresh = () => {
  const { accessToken, refreshToken, setTokens, setUser, logout, _hasHydrated } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rolesCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для обновления данных пользователя из checkAuth
  const updateUserData = async (token: string) => {
    const checkResponse = await authApi.checkAuth(token);
    if (checkResponse.data) {
      logger.debug("Updating user data from checkAuth", {
        roles: checkResponse.data.roles,
        organizationId: checkResponse.data.organizationId,
      });
      setUser({
        email: checkResponse.data.email,
        fullName: checkResponse.data.fullName,
        locationId: checkResponse.data.locationId,
        locationName: checkResponse.data.locationName,
        roles: checkResponse.data.roles || [],
        organizationId: checkResponse.data.organizationId,
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Ждем гидратации zustand persist из localStorage
    if (!_hasHydrated) {
      return;
    }

    if (!accessToken || !refreshToken) {
      return;
    }

    const refreshIfNeeded = async () => {
      if (!accessToken || !refreshToken) return;

      // Проверяем, валиден ли текущий токен
      const checkResponse = await authApi.checkAuth(accessToken);

      // Если токен невалиден, пытаемся обновить
      if (checkResponse.error?.status === 401 || !checkResponse.data) {
        const refreshResponse = await authApi.refreshToken({ refreshToken });

        if (refreshResponse.data) {
          // Обновляем токены
          setTokens(
            refreshResponse.data.accessToken,
            refreshResponse.data.refreshToken
          );

          // После refresh токена всегда обновляем данные пользователя (роли)
          // чтобы получить актуальные роли, если они были изменены админом
          await updateUserData(refreshResponse.data.accessToken);
        } else {
          // Если refresh не сработал, выходим
          logout();
        }
      } else if (checkResponse.data) {
        // Даже если токен валиден, обновляем данные пользователя
        // на случай, если роли были изменены на бэкенде
        await updateUserData(accessToken);
      }
    };

    // Функция для периодической проверки ролей (даже для валидного токена)
    // Это нужно для синхронизации ролей, если админ изменил их на бэкенде
    const checkRolesPeriodically = async () => {
      if (!accessToken) return;
      
      // Проверяем роли каждые 10 минут
      const checkResponse = await authApi.checkAuth(accessToken);
      if (checkResponse.data) {
        await updateUserData(accessToken);
      }
    };

    // Проверяем токен каждые 5 минут
    intervalRef.current = setInterval(refreshIfNeeded, 5 * 60 * 1000);

    // Проверяем роли каждые 10 минут (для синхронизации с бэкендом)
    rolesCheckIntervalRef.current = setInterval(checkRolesPeriodically, 10 * 60 * 1000);

    // Также проверяем сразу при монтировании
    refreshIfNeeded();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (rolesCheckIntervalRef.current) {
        clearInterval(rolesCheckIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, accessToken, refreshToken]); // Зависимости включают гидратацию
};

