"use client";

import React, { useState, useEffect } from "react";
import { InputField, OrganizationSelector } from "@/shared/ui";
import { AuthButton } from "@/shared/ui/Buttons";
import { organizationsApi, type Organization } from "@/features/auth";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: AuthFormData) => void;
  onSwitchMode: () => void;
  isLoading?: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
  position?: string;
  location?: number;
  organizationId?: number;
  organizationName?: string;
}

type RegisterStep = "userData" | "createOrganization";

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onSwitchMode,
  isLoading = false,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Организации
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [isCreatingNewOrganization, setIsCreatingNewOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("userData");

  const isLogin = mode === "login";
  const isRegister = mode === "register";

  // Загрузка организаций при регистрации
  useEffect(() => {
    if (isRegister && registerStep === "userData") {
      loadOrganizations();
    }
  }, [isRegister, registerStep]);

  const loadOrganizations = async () => {
    setOrganizationsLoading(true);
    setOrganizationsError(null);
    
    try {
      const response = await organizationsApi.getAll();
      if (response.error) {
        // Если ошибка подключения, просто не показываем список, но позволяем создать новую
        if (response.error.message.includes("Failed to fetch") || 
            response.error.message.includes("ERR_CONNECTION_REFUSED") ||
            response.error.message.includes("Сетевая ошибка")) {
          setOrganizationsError("Сервер недоступен. Вы можете создать новую организацию.");
        } else {
          setOrganizationsError(response.error.message || "Ошибка загрузки организаций");
        }
      } else if (response.data) {
        setOrganizations(response.data);
      }
    } catch {
      setOrganizationsError("Не удалось загрузить список организаций. Вы можете создать новую.");
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: AuthFormData = {
      email,
      password,
    };
    
    if (isRegister) {
      formData.fullName = fullName;
      formData.position = position || ""; // Обязательное поле
      
      if (registerStep === "createOrganization") {
        // Создание новой организации
        formData.organizationName = organizationName;
        // organizationId не указываем (пустое)
      } else {
        // Выбор существующей организации
        if (selectedOrganizationId) {
          formData.organizationId = selectedOrganizationId;
        }
      }
    }
    
    onSubmit(formData);
  };

  const handleOrganizationChange = (id: number | null) => {
    setSelectedOrganizationId(id);
    setIsCreatingNewOrganization(false);
  };

  const handleCreateOrganization = () => {
    setIsCreatingNewOrganization(true);
    setSelectedOrganizationId(null);
    setRegisterStep("createOrganization");
  };

  const handleBackToSelection = () => {
    setRegisterStep("userData");
    setIsCreatingNewOrganization(false);
    setOrganizationName("");
    setSelectedOrganizationId(null);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerStep === "userData" && isCreatingNewOrganization) {
      setRegisterStep("createOrganization");
    }
  };

  // Проверка готовности к регистрации
  // Если список организаций пуст (сервер недоступен), разрешаем создать новую
  const canRegister = isRegister && (
    registerStep === "userData" 
      ? selectedOrganizationId !== null || organizations.length === 0
      : organizationName.trim() !== ""
  );

  // Если создаем новую организацию и на шаге создания
  if (isRegister && registerStep === "createOrganization") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-gray-500">Создание организации</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <InputField
            label="Название организации"
            type="text"
            value={organizationName}
            onChange={setOrganizationName}
            placeholder="Введите название организации"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBackToSelection}
            disabled={isLoading}
            className="flex-1 h-10 sm:h-12 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Назад
          </button>
          <AuthButton type="submit" disabled={isLoading || !canRegister}>
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </AuthButton>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Уже есть аккаунт?{" "}
          <button
            type="button"
            onClick={onSwitchMode}
            disabled={isLoading}
            className="text-blue-500 hover:text-blue-800 hover:underline font-medium transition-colors disabled:opacity-50"
          >
            Войти
          </button>
        </p>
      </form>
    );
  }

  // Основная форма (логин или регистрация на шаге userData)
  return (
    <form onSubmit={isRegister && isCreatingNewOrganization ? handleNext : handleSubmit} className="flex flex-col gap-4 sm:gap-6">
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

      {isRegister && (
        <>
          <InputField
            label="Должность"
            type="text"
            value={position}
            onChange={setPosition}
            placeholder="Введите вашу должность"
          />

          <OrganizationSelector
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onOrganizationChange={handleOrganizationChange}
            onCreateNew={handleCreateOrganization}
            isLoading={organizationsLoading}
            error={organizationsError}
          />
        </>
      )}

      <AuthButton 
        type="submit" 
        disabled={isLoading || (isRegister && !canRegister && !isCreatingNewOrganization)}
      >
        {isLoading 
          ? "Загрузка..." 
          : isLogin 
            ? "Войти" 
            : isCreatingNewOrganization
              ? "Далее"
              : "Зарегистрироваться"}
      </AuthButton>

      <p className="text-sm text-gray-600 text-center">
        {isLogin ? "Новый пользователь? " : "Уже есть аккаунт? "}
        <button
          type="button"
          onClick={onSwitchMode}
          disabled={isLoading}
          className="text-blue-500 hover:text-blue-800 hover:underline font-medium transition-colors disabled:opacity-50"
        >
          {isLogin ? "Зарегистрироваться" : "Войти"}
        </button>
      </p>
    </form>
  );
};
