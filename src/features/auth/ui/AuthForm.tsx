"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField, OrganizationSelector, CustomSelect } from "@/shared/ui";
import { AuthButton } from "@/shared/ui/buttons";
import { organizationsApi, type Organization, type Location } from "@/features/auth";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "../lib/validation";

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
  locationId?: number;
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
  const isLogin = mode === "login";
  const isRegister = mode === "register";

  // Организации
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [isCreatingNewOrganization, setIsCreatingNewOrganization] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("userData");

  // Локации
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // React Hook Form
  const schema = isLogin ? loginSchema : registerSchema;
  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: isLogin
      ? { email: "", password: "" }
      : {
          email: "",
          password: "",
          fullName: "",
          position: "",
        },
  });

  const watchedOrganizationName = watch("organizationName" as keyof RegisterFormData);

  // Синхронизация выбранных значений с формой
  useEffect(() => {
    if (isRegister) {
      if (selectedOrganizationId !== null) {
        setValue("organizationId" as keyof RegisterFormData, selectedOrganizationId as never);
        trigger("organizationId" as keyof RegisterFormData);
      }
      if (selectedLocationId !== null) {
        setValue("locationId" as keyof RegisterFormData, selectedLocationId as never);
        trigger("locationId" as keyof RegisterFormData);
      }
      if (isCreatingNewOrganization && registerStep === "createOrganization") {
        setValue("organizationName" as keyof RegisterFormData, "" as never);
      }
    }
  }, [selectedOrganizationId, selectedLocationId, isCreatingNewOrganization, registerStep, isRegister, setValue, trigger]);

  // Загрузка организаций при регистрации
  useEffect(() => {
    if (isRegister && registerStep === "userData") {
      loadOrganizations();
    }
  }, [isRegister, registerStep]);

  // Загрузка локаций при выборе организации
  useEffect(() => {
    if (isRegister && selectedOrganizationId && !isCreatingNewOrganization) {
      loadLocations(selectedOrganizationId);
    } else {
      setLocations([]);
      setSelectedLocationId(null);
    }
  }, [isRegister, selectedOrganizationId, isCreatingNewOrganization]);

  const loadOrganizations = async () => {
    setOrganizationsLoading(true);
    setOrganizationsError(null);

    try {
      const response = await organizationsApi.getAll();
      if (response.error) {
        if (
          response.error.message.includes("Failed to fetch") ||
          response.error.message.includes("ERR_CONNECTION_REFUSED") ||
          response.error.message.includes("Сетевая ошибка")
        ) {
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

  const loadLocations = async (orgId: number) => {
    setLocationsLoading(true);
    setLocationsError(null);
    setSelectedLocationId(null);

    try {
      const response = await organizationsApi.getLocationsByOrganization(orgId);
      if (response.error) {
        setLocationsError(response.error.message || "Ошибка загрузки локаций");
      } else if (response.data) {
        setLocations(response.data);
      }
    } catch {
      setLocationsError("Не удалось загрузить список локаций.");
    } finally {
      setLocationsLoading(false);
    }
  };

  const onSubmitForm = (data: LoginFormData | RegisterFormData) => {
    const formData: AuthFormData = {
      email: data.email,
      password: data.password,
    };

    if (isRegister) {
      const registerData = data as RegisterFormData;
      formData.fullName = registerData.fullName;
      formData.position = registerData.position;

      if (registerStep === "createOrganization") {
        formData.organizationName = registerData.organizationName;
      } else {
        if (selectedOrganizationId) {
          formData.organizationId = selectedOrganizationId;
        }
        if (selectedLocationId) {
          formData.locationId = selectedLocationId;
        }
      }
    }

    onSubmit(formData);
  };

  const handleOrganizationChange = (id: number | null) => {
    setSelectedOrganizationId(id);
    setIsCreatingNewOrganization(false);
    setSelectedLocationId(null);
    if (isRegister) {
      if (id !== null) {
        setValue("organizationId" as keyof RegisterFormData, id as never);
        setValue("organizationName" as keyof RegisterFormData, undefined as never);
      } else {
        setValue("organizationId" as keyof RegisterFormData, undefined as never);
      }
      trigger("locationId" as keyof RegisterFormData);
    }
  };

  const handleCreateOrganization = () => {
    setIsCreatingNewOrganization(true);
    setSelectedOrganizationId(null);
    setRegisterStep("createOrganization");
    if (isRegister) {
      setValue("organizationId" as keyof RegisterFormData, undefined as never);
      setValue("locationId" as keyof RegisterFormData, undefined as never);
      setValue("organizationName" as keyof RegisterFormData, "" as never);
      trigger("organizationName" as keyof RegisterFormData);
    }
  };

  const handleBackToSelection = () => {
    setRegisterStep("userData");
    setIsCreatingNewOrganization(false);
    setSelectedOrganizationId(null);
    if (isRegister) {
      setValue("organizationName" as keyof RegisterFormData, undefined as never);
      trigger("organizationName" as keyof RegisterFormData);
    }
  };

  const handleLocationChange = (locationId: number | null) => {
    setSelectedLocationId(locationId);
    if (isRegister && locationId !== null) {
      setValue("locationId" as keyof RegisterFormData, locationId as never);
      trigger("locationId" as keyof RegisterFormData);
    }
  };

  // Проверка готовности к регистрации
  const canRegister = isRegister && (
    registerStep === "createOrganization"
      ? (watchedOrganizationName as string | undefined)?.trim() !== ""
      : selectedOrganizationId !== null && (isCreatingNewOrganization || selectedLocationId !== null)
  );

  // Если создаем новую организацию и на шаге создания
  if (isRegister && registerStep === "createOrganization") {
    return (
      <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-4 sm:gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-gray-500">Создание организации</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <div>
            <InputField
              label="Название организации"
              type="text"
              value={(watchedOrganizationName as string) || ""}
              onChange={(value) => {
                setValue("organizationName" as keyof RegisterFormData, value as never);
                trigger("organizationName" as keyof RegisterFormData);
              }}
              placeholder="Введите название организации"
            />
            {errors.organizationName && (
              <p className="mt-1 text-sm text-red-600">{errors.organizationName.message as string}</p>
            )}
          </div>
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
          <AuthButton type="submit" disabled={isLoading || !isValid}>
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
    <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-4 sm:gap-6">
      {isRegister && (
        <div>
          <InputField
            label="ФИО"
            type="text"
            value={watch("fullName" as keyof RegisterFormData) as string || ""}
            onChange={(value) => {
              setValue("fullName" as keyof RegisterFormData, value as never);
              trigger("fullName" as keyof RegisterFormData);
            }}
            placeholder="Введите ваше полное имя"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message as string}</p>
          )}
        </div>
      )}

      <div>
        <InputField
          label="Почта"
          type="email"
          value={watch("email") as string || ""}
          onChange={(value) => {
            setValue("email", value as never);
            trigger("email");
          }}
          placeholder="Введите вашу почту"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
        )}
      </div>

      <div>
        <InputField
          label="Пароль"
          type="password"
          value={watch("password") as string || ""}
          onChange={(value) => {
            setValue("password", value as never);
            trigger("password");
          }}
          placeholder="Введите ваш пароль"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
        )}
      </div>

      {isRegister && (
        <div>
          <InputField
            label="Должность"
            type="text"
            value={watch("position" as keyof RegisterFormData) as string || ""}
            onChange={(value) => {
              setValue("position" as keyof RegisterFormData, value as never);
              trigger("position" as keyof RegisterFormData);
            }}
            placeholder="Введите вашу должность"
          />
          {errors.position && (
            <p className="mt-1 text-sm text-red-600">{errors.position.message as string}</p>
          )}
        </div>
      )}

      {isRegister && (
        <>
          <OrganizationSelector
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onOrganizationChange={handleOrganizationChange}
            onCreateNew={handleCreateOrganization}
            isLoading={organizationsLoading}
            error={organizationsError}
          />

          {selectedOrganizationId && !isCreatingNewOrganization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Локация (офис) <span className="text-red-500">*</span>
              </label>
              {locationsLoading ? (
                <div className="text-sm text-gray-500">Загрузка локаций...</div>
              ) : locationsError ? (
                <div className="text-sm text-red-600">{locationsError}</div>
              ) : (
                <>
                  <CustomSelect
                    value={selectedLocationId}
                    onChange={(val) => handleLocationChange(val ? Number(val) : null)}
                    options={locations.map((loc) => ({
                      value: loc.id,
                      label: `${loc.name}${loc.city ? ` (${loc.city})` : ""}`,
                    }))}
                    placeholder="— выберите локацию —"
                    size="lg"
                  />
                  {errors.locationId && (
                    <p className="mt-1 text-sm text-red-600">{errors.locationId.message as string}</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      <AuthButton
        type="submit"
        disabled={isLoading || (isRegister && !canRegister && !isCreatingNewOrganization) || !isValid}
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
