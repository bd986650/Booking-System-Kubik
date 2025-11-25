"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth";
import { workspaceAdminApi, AdminBookingItem, UserInfo } from "@/entities/location";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { Button } from "@/shared/ui/buttons";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import { logger } from "@/shared/lib/logger";

type TabType = "location" | "space-type" | "constructor" | "view";

export const WorkspacesAdmin: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("location");

  // Поддержка URL параметра tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["location", "space-type", "constructor", "view"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);

  const isAdmin = useMemo(() => isWorkspaceAdmin(user || null) || isProjectAdmin(user || null), [user]);
  const organizationId = user?.organizationId || null;

  // Create Location
  const [locName, setLocName] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locActive, setLocActive] = useState(true);
  const [locWorkStart, setLocWorkStart] = useState("09:00");
  const [locWorkEnd, setLocWorkEnd] = useState("18:00");
  const [locTimeZone, setLocTimeZone] = useState("Europe/Moscow");
  const [locOrgIdManual, setLocOrgIdManual] = useState<string>("");

  // Create Space Type
  const [stName, setStName] = useState("");
  const [stAllowedDurations, setStAllowedDurations] = useState<string[]>([]);
  const [stLocationId, setStLocationId] = useState<string>("");
  
  const availableDurations = ["30m", "1h", "2h", "4h", "6h", "8h"];

  // Constructor
  const [constructorLocationId, setConstructorLocationId] = useState<string>("");
  const [createdLocationId, setCreatedLocationId] = useState<number | null>(null);

  // View location data
  const [viewLocationId, setViewLocationId] = useState<string>("");
  const [locationBookings, setLocationBookings] = useState<AdminBookingItem[]>([]);
  const [locationUsers, setLocationUsers] = useState<UserInfo[]>([]);
  const [loadingLocationData, setLoadingLocationData] = useState(false);

  const validateLocationForm = (): string | null => {
    if (!locName.trim()) return "Название локации обязательно";
    if (!locCity.trim()) return "Город обязателен";
    if (!locAddress.trim()) return "Адрес обязателен";
    if (!locWorkStart.match(/^\d{2}:\d{2}$/)) return "Время начала должно быть в формате HH:mm";
    if (!locWorkEnd.match(/^\d{2}:\d{2}$/)) return "Время окончания должно быть в формате HH:mm";
    const finalOrgId = organizationId || (locOrgIdManual ? Number(locOrgIdManual) : null);
    if (!finalOrgId) return "ID организации обязателен";
    return null;
  };

  const validateSpaceTypeForm = (): string | null => {
    if (!stName.trim()) return "Название типа пространства обязательно";
    if (stAllowedDurations.length === 0) return "Выберите хотя бы одну длительность";
    if (!stLocationId || !Number(stLocationId)) return "ID локации обязателен";
    return null;
  };
  
  const handleDurationToggle = (duration: string) => {
    setStAllowedDurations(prev => 
      prev.includes(duration) 
        ? prev.filter(d => d !== duration)
        : [...prev, duration]
    );
  };

  // Преобразует формат длительности из "30m", "1h" в ISO 8601 Duration "PT30M", "PT1H"
  const convertDurationToISO8601 = (duration: string): string => {
    // Формат: "30m", "1h", "2h", "4h", "6h", "8h"
    const match = duration.match(/^(\d+)([mh])$/);
    if (!match) {
      // Если уже в формате ISO 8601, возвращаем как есть
      if (duration.startsWith("PT")) {
        return duration;
      }
      throw new Error(`Неверный формат длительности: ${duration}`);
    }
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    if (unit === "m") {
      return `PT${value}M`; // Минуты: PT30M
    } else if (unit === "h") {
      return `PT${value}H`; // Часы: PT1H, PT2H
    }
    
    throw new Error(`Неизвестная единица времени: ${unit}`);
  };

  const handleCreateLocation = async () => {
    const validationError = validateLocationForm();
    if (validationError) {
      showErrorToast(validationError);
      return;
    }

    if (!accessToken) {
      showErrorToast("Токен авторизации не найден");
      return;
    }

    setLoading(true);
    try {
      const finalOrgId = organizationId || (locOrgIdManual ? Number(locOrgIdManual) : null);
      if (!finalOrgId) {
        showErrorToast("Не удалось определить ID организации");
        return;
      }

      // Преобразуем время в формат HH:mm:ss
      const workStartFormatted = `${locWorkStart}:00`;
      const workEndFormatted = `${locWorkEnd}:00`;

      const res = await workspaceAdminApi.createLocation({
        name: locName.trim(),
        city: locCity.trim(),
        address: locAddress.trim(),
        isActive: locActive,
        workDayStart: workStartFormatted,
        workDayEnd: workEndFormatted,
        timeZone: locTimeZone,
        organizationId: finalOrgId,
      }, accessToken);

      if (res.error) {
        showErrorToast(res.error.message);
      } else {
        logger.debug("Ответ от API создания локации", { 
          data: res.data, 
          dataType: typeof res.data,
          status: res.status,
        });
        
        // Обрабатываем разные форматы ответа: число, объект с id, строка
        let locationId: number | null = null;
        if (typeof res.data === "number") {
          locationId = res.data;
          logger.debug("ID локации извлечен как число", { locationId });
        } else if (typeof res.data === "string") {
          const parsed = Number(res.data);
          if (!isNaN(parsed)) {
            locationId = parsed;
            logger.debug("ID локации извлечен из строки", { locationId, originalString: res.data });
          }
        } else if (res.data && typeof res.data === "object" && "id" in res.data) {
          locationId = Number((res.data as { id: number | string }).id);
          logger.debug("ID локации извлечен из объекта", { locationId, object: res.data });
        }
        
        if (!locationId || isNaN(locationId)) {
          logger.error("Не удалось извлечь ID локации из ответа", { 
            data: res.data, 
            dataType: typeof res.data,
            status: res.status,
          });
          showErrorToast("Локация создана, но не удалось получить её ID. Проверьте консоль для деталей.");
          return;
        }
        
        logger.debug("Успешно извлечен ID локации", { locationId });
        setCreatedLocationId(locationId);
        setConstructorLocationId(String(locationId));
        setStLocationId(String(locationId)); // Автоматически заполняем ID локации для создания типа пространства
        showSuccessToast(`Локация "${locName}" успешно создана!`, "ID: " + locationId);
        
        // Очищаем форму
        setLocName("");
        setLocCity("");
        setLocAddress("");
        setLocActive(true);
        setLocWorkStart("09:00");
        setLocWorkEnd("18:00");
        setLocTimeZone("Europe/Moscow");
        setLocOrgIdManual("");
        
        // Переключаемся на вкладку конструктора
        setTimeout(() => setActiveTab("constructor"), 1000);
      }
    } catch (error) {
      logger.error("Error creating location", error);
      showErrorToast("Произошла ошибка при создании локации");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpaceType = async () => {
    const validationError = validateSpaceTypeForm();
    if (validationError) {
      showErrorToast(validationError);
      return;
    }

    if (!accessToken) {
      showErrorToast("Токен авторизации не найден");
      return;
    }

    setLoading(true);
    try {
      const locationIdNum = Number(stLocationId);
      if (!locationIdNum) {
        showErrorToast("Неверный ID локации");
        setLoading(false);
        return;
      }

      // Преобразуем длительности в формат ISO 8601 Duration (PT30M, PT1H и т.д.)
      const convertedDurations = stAllowedDurations.map(duration => {
        try {
          return convertDurationToISO8601(duration);
        } catch (error) {
          logger.error(`Ошибка преобразования длительности ${duration}`, error);
          throw new Error(`Неверный формат длительности: ${duration}`);
        }
      });

      const requestPayload = {
        type: stName.trim(),
        allowedDurations: convertedDurations,
        locationId: locationIdNum,
      };

      // Логируем точный формат отправляемых данных
      logger.debug("Создание типа пространства - отправляемые данные", {
        originalDurations: stAllowedDurations,
        convertedDurations: convertedDurations,
        fullPayload: requestPayload,
        payloadJSON: JSON.stringify(requestPayload),
      });

      const res = await workspaceAdminApi.createSpaceType(requestPayload, accessToken);

      if (res.error) {
        // Специальная обработка для 409 Conflict (дубликат типа)
        if (res.error.status === 409) {
          showErrorToast("Тип пространства с таким названием уже существует для данной локации", "Дубликат");
        } else {
          showErrorToast(res.error.message);
        }
      } else {
        showSuccessToast(`Тип пространства "${stName}" успешно создан!`);
        setStName("");
        setStAllowedDurations([]);
        setStLocationId("");
      }
    } catch (error) {
      logger.error("Error creating space type", error);
      showErrorToast("Произошла ошибка при создании типа пространства");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLocationData = async () => {
    if (!accessToken || !viewLocationId) {
      showErrorToast("Введите ID локации");
      return;
    }

    const locationIdNum = Number(viewLocationId);
    if (!locationIdNum || isNaN(locationIdNum)) {
      showErrorToast("Неверный формат ID локации");
      return;
    }

    setLoadingLocationData(true);
    // Очищаем предыдущие данные
    setLocationBookings([]);
    setLocationUsers([]);
    
    try {
      const [bookingsRes, usersRes] = await Promise.all([
        workspaceAdminApi.getLocationActiveBookings(locationIdNum, accessToken),
        workspaceAdminApi.getLocationUsers(locationIdNum, accessToken),
      ]);

      let hasData = false;
      const errorMessages: string[] = [];

      if (bookingsRes.error) {
        logger.error("Ошибка загрузки бронирований", bookingsRes.error);
        errorMessages.push(`Бронирования: ${bookingsRes.error.message}`);
      } else if (bookingsRes.data) {
        setLocationBookings(bookingsRes.data);
        hasData = true;
        logger.debug("Загружены бронирования", { count: bookingsRes.data.length });
      }

      if (usersRes.error) {
        logger.error("Ошибка загрузки пользователей", usersRes.error);
        errorMessages.push(`Пользователи: ${usersRes.error.message}`);
      } else if (usersRes.data) {
        setLocationUsers(usersRes.data);
        hasData = true;
        logger.debug("Загружены пользователи", { count: usersRes.data.length });
      }

      if (errorMessages.length > 0) {
        showErrorToast(errorMessages.join("; "));
      }

      if (hasData) {
        const bookingsCount = bookingsRes.data?.length || 0;
        const usersCount = usersRes.data?.length || 0;
        showSuccessToast(`Загружено: ${bookingsCount} бронирований, ${usersCount} пользователей`);
      } else if (errorMessages.length === 0) {
        showErrorToast("Данные не найдены для данной локации");
      }
    } catch (error) {
      logger.error("Error loading location data", error);
      showErrorToast("Произошла ошибка при загрузке данных");
    } finally {
      setLoadingLocationData(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Рабочие пространства</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Доступ только для администраторов проекта или воркспейса.
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "location", label: "Создание локации" },
    { id: "space-type", label: "Типы пространств" },
    { id: "constructor", label: "Конструктор карты" },
    { id: "view", label: "Просмотр данных" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Управление пространствами</h1>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {/* Create Location Tab */}
        {activeTab === "location" && (
          <div className="bg-white rounded-2xl border border-gray-300 p-8 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Создать новую локацию</h2>
            <p className="text-sm text-gray-500 mb-8">
              Локация — это офис или рабочее пространство вашей организации. После создания вы сможете добавить помещения через конструктор карты.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название локации <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Например: Офис в Москве"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Город <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Например: Москва"
                    value={locCity}
                    onChange={(e) => setLocCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Например: ул. Ленина, д. 1"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Начало рабочего дня <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={locWorkStart}
                    onChange={(e) => setLocWorkStart(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Конец рабочего дня <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={locWorkEnd}
                    onChange={(e) => setLocWorkEnd(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Часовой пояс
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Europe/Moscow"
                    value={locTimeZone}
                    onChange={(e) => setLocTimeZone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="locActive"
                  type="checkbox"
                  checked={locActive}
                  onChange={(e) => setLocActive(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="locActive" className="text-sm text-gray-700 cursor-pointer">
                  Локация активна (доступна для бронирования)
                </label>
              </div>

              {organizationId ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">ID организации:</span> {organizationId} (определён автоматически)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID организации <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Введите ID организации"
                    value={locOrgIdManual}
                    onChange={(e) => setLocOrgIdManual(e.target.value)}
                  />
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleCreateLocation}
                  disabled={loading}
                  variant="filled"
                  color="blue"
                  className="w-full md:w-auto min-w-[220px]"
                >
                  {loading ? "Создание..." : "Создать локацию"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Space Type Tab */}
        {activeTab === "space-type" && (
          <div className="bg-white rounded-2xl border border-gray-300 p-8 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Создать тип пространства</h2>
            <p className="text-sm text-gray-500 mb-8">
              Тип пространства определяет категорию помещения (например, &quot;Переговорная&quot;, &quot;Кабинет&quot;, &quot;Кухня&quot;). 
              Эти типы используются при создании помещений в конструкторе карты.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID локации <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Введите ID локации"
                  value={stLocationId}
                  onChange={(e) => setStLocationId(e.target.value)}
                />
                {createdLocationId && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Последняя созданная локация: ID {createdLocationId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название типа <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Например: Переговорная"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Разрешенные длительности <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {availableDurations.map((duration) => (
                    <label
                      key={duration}
                      className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                        stAllowedDurations.includes(duration)
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={stAllowedDurations.includes(duration)}
                        onChange={() => handleDurationToggle(duration)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{duration}</span>
                    </label>
                  ))}
                </div>
                {stAllowedDurations.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">Выберите хотя бы одну длительность</p>
                )}
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleCreateSpaceType}
                  disabled={loading}
                  variant="filled"
                  color="blue"
                  className="w-full md:w-auto min-w-[220px]"
                >
                  {loading ? "Создание..." : "Создать тип"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Constructor Tab */}
        {activeTab === "constructor" && (
          <div className="bg-white rounded-2xl border border-gray-300 p-8 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Конструктор карты офиса</h2>
            <p className="text-sm text-gray-500 mb-8">
              Откройте визуальный конструктор для создания помещений на карте офиса. 
              Вы сможете нарисовать этажи, комнаты и настроить их параметры.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID локации <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mb-4"
                  placeholder="Введите ID созданной локации"
                  value={constructorLocationId}
                  onChange={(e) => setConstructorLocationId(e.target.value)}
                />
                {createdLocationId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Последняя созданная локация:</span> ID {createdLocationId}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Link href={`/map?locationId=${encodeURIComponent(constructorLocationId || "")}`}>
                  <Button
                    variant="filled"
                    color="blue"
                    className="w-full md:w-auto min-w-[220px]"
                    disabled={!constructorLocationId}
                  >
                    Открыть конструктор карты
                  </Button>
                </Link>
              </div>

              {!constructorLocationId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Сначала создайте локацию на вкладке &quot;Создание локации&quot;, затем вернитесь сюда.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Data Tab */}
        {activeTab === "view" && (
          <div className="bg-white rounded-2xl border border-gray-300 p-8 transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Просмотр данных по локации</h2>
            <p className="text-sm text-gray-500 mb-8">
              Введите ID локации, чтобы просмотреть активные бронирования и список пользователей.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID локации
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Введите ID локации"
                    value={viewLocationId}
                    onChange={(e) => setViewLocationId(e.target.value)}
                  />
                  <Button
                    onClick={handleLoadLocationData}
                    disabled={loadingLocationData || !viewLocationId}
                    variant="filled"
                    color="blue"
                    className="whitespace-nowrap"
                  >
                    {loadingLocationData ? "Загрузка..." : "Загрузить"}
                  </Button>
                </div>
              </div>

              {locationBookings.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Активные бронирования ({locationBookings.length})
                  </h3>
                  <div className="max-h-80 overflow-auto space-y-3">
                    {locationBookings.map((b) => (
                      <div key={b.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 mb-1">#{b.id} · {b.spaceName}</div>
                            <div className="text-xs text-gray-600">
                              {b.userEmail} · {new Date(b.start).toLocaleString("ru-RU")}
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            b.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {locationUsers.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Пользователи ({locationUsers.length})
                  </h3>
                  <div className="max-h-80 overflow-auto space-y-3">
                    {locationUsers.map((u) => (
                      <div key={u.email} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="font-medium text-sm text-gray-900 mb-1">{u.fullName}</div>
                        <div className="text-xs text-gray-600">{u.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingLocationData && locationBookings.length === 0 && locationUsers.length === 0 && viewLocationId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">Данные не найдены или локация не существует</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
