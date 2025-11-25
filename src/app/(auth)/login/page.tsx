"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/shared/ui";
import { AuthForm, AuthFormData, authApi, useAuthStore } from "@/features/auth";
import { logger } from "@/shared/lib/logger";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTokens, setUser } = useAuthStore();

  const handleSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      // Проверяем статус ответа
      const status = response.status;

      // Если статус 202 Accepted - заявка еще на рассмотрении
      if (status === 202) {
        setError(
          "Ваша заявка все еще находится на обработке. Попробуйте позже или обратитесь к администратору."
        );
        setIsLoading(false);
        return;
      }

      if (response.error) {
        // Проверяем, не является ли это случаем, когда пользователь на проверке
        const errorMessage = response.error.message || "";
        const errorStatus = response.error.status;
        
        // Если 404 - проблема с сервером/эндпоинтом
        if (errorStatus === 404) {
          setError("Сервер недоступен или эндпоинт не найден. Проверьте подключение к серверу.");
          setIsLoading(false);
          return;
        }
        
        if (
          errorMessage.toLowerCase().includes("user with provided email does not exist") ||
          errorMessage.toLowerCase().includes("пользователь с таким email не найден")
        ) {
          setError(
            "Ваша заявка все еще находится на проверке. Попробуйте позже или обратитесь к администратору."
          );
        } else {
          setError(errorMessage || "Ошибка входа");
        }
        setIsLoading(false);
        return;
      }

      if (response.data) {
        // Сохраняем токены
        setTokens(
          response.data.jwtResponse.accessToken,
          response.data.jwtResponse.refreshToken
        );

        // Получаем информацию о пользователе
        const checkAuthResponse = await authApi.checkAuth(
          response.data.jwtResponse.accessToken
        );

        if (checkAuthResponse.data) {
          logger.debug("Login: Roles from checkAuth", {
            checkAuthRoles: checkAuthResponse.data.roles,
            loginResponseRoles: response.data.role,
          });
          
          setUser({
            email: checkAuthResponse.data.email,
            fullName: checkAuthResponse.data.fullName,
            locationId: checkAuthResponse.data.locationId,
            locationName: checkAuthResponse.data.locationName,
            roles: checkAuthResponse.data.roles || response.data.role || [],
            organizationId: checkAuthResponse.data.organizationId,
          });

          // Перенаправляем на главную страницу dashboard
          router.push("/dashboard");
        } else {
          // Если не удалось получить данные пользователя, используем роли из ответа логина
          logger.debug("Login: Using roles from login response", {
            roles: response.data.role,
          });
          setUser({
            email: data.email,
            fullName: "",
            locationId: 0,
            locationName: "",
            roles: response.data.role || [],
          });
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("Произошла ошибка при входе. Попробуйте снова.");
      logger.error("Login error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    router.push("/register");
  };

  return (
    <AuthLayout
      title="Вход"
      subtitle="Введите почту и пароль для входа в аккаунт"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        onSwitchMode={handleSwitchMode}
        isLoading={isLoading}
      />
    </AuthLayout>
  );
};

export default LoginPage;
