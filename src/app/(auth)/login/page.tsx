"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/shared/ui/AuthLayout";
import { AuthForm, AuthFormData } from "@/features/auth/ui/AuthForm";

const LoginPage: React.FC = () => {
  const router = useRouter();

  const handleSubmit = (data: AuthFormData) => {
    // Логика входа
    console.log("Login attempt:", data);
    // Здесь будет логика авторизации
    router.push("/dashboard/employee");
  };

  const handleSwitchMode = () => {
    router.push("/auth/register");
  };

  return (
    <AuthLayout
      title="Вход"
      subtitle="Введите почту и пароль для входа в аккаунт"
    >
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        onSwitchMode={handleSwitchMode}
      />
    </AuthLayout>
  );
};

export default LoginPage;