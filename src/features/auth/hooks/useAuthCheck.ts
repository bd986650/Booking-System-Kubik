import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../model/authStore";
import { authApi } from "../api/auth";

export const useAuthCheck = () => {
  const router = useRouter();
  const { accessToken, refreshToken, setTokens, setUser, logout, _hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Ждем гидратации zustand persist из localStorage
    if (!_hasHydrated) {
      setIsChecking(true);
      return;
    }

    const checkAndRefreshAuth = async () => {
      setIsChecking(true);

      // Если нет токенов после гидратации, перенаправляем на логин
      if (!accessToken || !refreshToken) {
        logout();
        router.push("/login");
        setIsChecking(false);
        return;
      }

      // Проверяем текущий токен
      const checkResponse = await authApi.checkAuth(accessToken);

      // Если токен валиден, продолжаем
      if (checkResponse.data) {
        console.log("[useAuthCheck] Roles from checkAuth:", checkResponse.data.roles);
        console.log("[useAuthCheck] OrganizationId from checkAuth:", checkResponse.data.organizationId);
        setUser({
          email: checkResponse.data.email,
          fullName: checkResponse.data.fullName,
          locationId: checkResponse.data.locationId,
          locationName: checkResponse.data.locationName,
          roles: checkResponse.data.roles || [],
          organizationId: checkResponse.data.organizationId,
        });
        setIsChecking(false);
        return;
      }

      // Если токен невалиден (401), пытаемся обновить через refresh token
      if (checkResponse.error?.status === 401 || !checkResponse.data) {
        const refreshResponse = await authApi.refreshToken({ refreshToken });

        if (refreshResponse.data) {
          // Обновляем токены
          setTokens(
            refreshResponse.data.accessToken,
            refreshResponse.data.refreshToken
          );

          // Снова получаем данные пользователя
          const newCheckResponse = await authApi.checkAuth(
            refreshResponse.data.accessToken
          );

          if (newCheckResponse.data) {
            console.log("[useAuthCheck] Roles after refresh:", newCheckResponse.data.roles);
            console.log("[useAuthCheck] OrganizationId after refresh:", newCheckResponse.data.organizationId);
            setUser({
              email: newCheckResponse.data.email,
              fullName: newCheckResponse.data.fullName,
              locationId: newCheckResponse.data.locationId,
              locationName: newCheckResponse.data.locationName,
              roles: newCheckResponse.data.roles || [],
              organizationId: newCheckResponse.data.organizationId,
            });
            setIsChecking(false);
            return;
          }
        }

        // Если refresh тоже не сработал, выходим
        logout();
        router.push("/login");
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
    };

    checkAndRefreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, accessToken, refreshToken]); // Запускаем после гидратации

  return { isChecking };
};

