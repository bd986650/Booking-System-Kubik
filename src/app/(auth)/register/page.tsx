"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/shared/ui";
import { AuthForm, AuthFormData, authApi, useAuthStore } from "@/features/auth";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { setTokens, setUser } = useAuthStore();

  const handleSubmit = async (data: AuthFormData) => {
    if (!data.fullName || !data.position) {
      setError("Заполните все обязательные поля (ФИО, должность)");
      return;
    }

    // Проверка организации
    if (!data.organizationId && !data.organizationName) {
      setError("Выберите организацию или создайте новую");
      return;
    }

    // Если создается новая организация, проверяем название
    if (data.organizationName && !data.organizationName.trim()) {
      setError("Введите название организации");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        position: data.position,
        location: data.location,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
      });

      if (response.error) {
        setError(response.error.message || "Ошибка регистрации");
        return;
      }

      // Проверяем статус ответа
      const status = response.status;

      // Если регистрация требует подтверждения (202 Accepted)
      if (status === 202) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      // Если статус 200 OK и создана новая организация, автоматически логинимся
      if (status === 200 && data.organizationName) {
        const loginResponse = await authApi.login({
          email: data.email,
          password: data.password,
        });

        if (loginResponse.data) {
          setTokens(
            loginResponse.data.jwtResponse.accessToken,
            loginResponse.data.jwtResponse.refreshToken
          );

          const checkAuthResponse = await authApi.checkAuth(
            loginResponse.data.jwtResponse.accessToken
          );

          if (checkAuthResponse.data) {
            console.log("[Register] Roles from checkAuth:", checkAuthResponse.data.roles);
            console.log("[Register] Roles from login response:", loginResponse.data.role);
            
            setUser({
              email: checkAuthResponse.data.email,
              fullName: checkAuthResponse.data.fullName,
              locationId: checkAuthResponse.data.locationId,
              locationName: checkAuthResponse.data.locationName,
              roles: checkAuthResponse.data.roles || loginResponse.data.role || [],
            });

            // Перенаправляем на главную страницу dashboard
            router.push("/dashboard");
            return;
          } else {
            // Если не удалось получить данные пользователя, используем роли из ответа логина
            console.log("[Register] Using roles from login response:", loginResponse.data.role);
            setUser({
              email: data.email,
              fullName: data.fullName,
              locationId: 0,
              locationName: "",
              roles: loginResponse.data.role || [],
            });
            router.push("/dashboard");
            return;
          }
        }
      }

      // Если выбрана существующая организация (200 OK), переходим на логин
      // или если новая организация не создалась автоматически
      if (status === 200 && !data.organizationName) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("Произошла ошибка при регистрации. Попробуйте снова.");
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    router.push("/login");
  };

  if (success) {
    return (
      <AuthLayout
        title="Регистрация"
        subtitle="Заполните форму для создания нового аккаунта"
      >
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
          Регистрация прошла успешно! Перенаправление...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Заполните форму для создания нового аккаунта"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        onSwitchMode={handleSwitchMode}
        isLoading={isLoading}
      />
    </AuthLayout>
  );
};

export default RegisterPage;
