import { useEffect, useRef } from "react";
import { useAuthStore } from "../model/authStore";
import { authApi } from "../api/auth";

/**
 * Хук для автоматического обновления токена перед истечением
 * Проверяет токен каждые 5 минут и обновляет если нужно
 */
export const useTokenRefresh = () => {
  const { accessToken, refreshToken, setTokens, logout, _hasHydrated } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
          setTokens(
            refreshResponse.data.accessToken,
            refreshResponse.data.refreshToken
          );
        } else {
          // Если refresh не сработал, выходим
          logout();
        }
      }
    };

    // Проверяем токен каждые 5 минут
    intervalRef.current = setInterval(refreshIfNeeded, 5 * 60 * 1000);

    // Также проверяем сразу при монтировании
    refreshIfNeeded();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, accessToken, refreshToken]); // Зависимости включают гидратацию
};

