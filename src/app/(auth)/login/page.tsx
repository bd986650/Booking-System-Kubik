"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/shared/ui";
import { AuthForm, AuthFormData, authApi, useAuthStore } from "@/features/auth";

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

      if (response.error) {
        setError(response.error.message || "Ошибка входа");
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
          setUser({
            email: checkAuthResponse.data.email,
            fullName: checkAuthResponse.data.fullName,
            locationId: checkAuthResponse.data.locationId,
            locationName: checkAuthResponse.data.locationName,
            roles: checkAuthResponse.data.roles,
          });

          // Перенаправляем в зависимости от роли
          const roles = checkAuthResponse.data.roles;
          if (roles.includes("ROLE_ADMIN_WORKSPACE")) {
            router.push("/dashboard/company");
          } else if (roles.includes("ROLE_ADMIN_LOCATION")) {
            router.push("/dashboard/office");
          } else {
            router.push("/dashboard/employee");
          }
        } else {
          // Если не удалось получить данные пользователя, все равно перенаправляем
          router.push("/dashboard/employee");
        }
      }
    } catch (err) {
      setError("Произошла ошибка при входе. Попробуйте снова.");
      console.error("Login error:", err);
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
