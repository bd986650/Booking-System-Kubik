"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/shared/ui/AuthLayout";
import { AuthForm, AuthFormData } from "@/features/auth/ui/AuthForm";

const RegisterPage: React.FC = () => {
  const router = useRouter();

  const handleSubmit = (data: AuthFormData) => {
    // Логика регистрации
    console.log("Register attempt:", data);
    // Здесь будет логика регистрации
  };

  const handleSwitchMode = () => {
    router.push("/auth/login");
  };

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Заполните форму для создания нового аккаунта"
    >
      <AuthForm
        mode="register"
        onSubmit={handleSubmit}
        onSwitchMode={handleSwitchMode}
      />
    </AuthLayout>
  );
};

export default RegisterPage;