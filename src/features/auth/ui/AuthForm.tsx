"use client";

import React, { useState } from "react";
import { UserRole } from "@/features/auth/model/roles";
import { InputField } from "@/shared/ui/InputField/InputField";
import { AuthButton } from "@/shared/ui/Buttons/AuthButton";
import { RoleSelector } from "@/shared/ui/RoleSelector/RoleSelector";
  
interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: AuthFormData) => void;
  onSwitchMode: () => void;
}

export interface AuthFormData {
  fullName?: string;
  email: string;
  password: string;
  role: UserRole;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onSwitchMode,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("EMPLOYEE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: AuthFormData = {
      email,
      password,
      role: selectedRole,
    };
    
    if (mode === "register") {
      formData.fullName = fullName;
    }
    
    onSubmit(formData);
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";

  return (
    <>
      {isRegister && (
        <RoleSelector
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          title={isLogin ? "Выберите тип входа" : "Выберите тип аккаунта"}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
        {isRegister && (
          <InputField
            label="ФИО"
            type="text"
            value={fullName}
            onChange={setFullName}
            placeholder="Введите ваше полное имя"
          />
        )}

        <InputField
          label="Почта"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Введите вашу почту"
        />

        <InputField
          label="Пароль"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Введите ваш пароль"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <AuthButton type="submit">
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </AuthButton>

        <p className="text-sm text-gray-600 text-center">
          {isLogin ? "Новый пользователь? " : "Уже есть аккаунт? "}
          <button
            type="button"
            onClick={onSwitchMode}
            className="text-blue-500 hover:text-blue-800 hover:underline font-medium transition-colors"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </form>

      {isLogin && (
        <RoleSelector
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          title="Выберите тип аккаунта"
        />
      )}
    </>
  );
};
