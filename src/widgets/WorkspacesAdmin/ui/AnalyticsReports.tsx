"use client";

import React, { useState } from "react";
import { reportsApi, type ReportRequest } from "@/entities/admin";
import { Button } from "@/shared/ui/buttons";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import { logger } from "@/shared/lib/logger";

interface AnalyticsReportsProps {
  accessToken: string;
  locationId?: number | null; // Для админа офиса - конкретная локация, для админа компании - null (все локации)
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  accessToken,
  locationId,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeZone, setTimeZone] = useState("Europe/Moscow");
  const [loading, setLoading] = useState<string | null>(null);

  // Получаем текущую дату и дату месяц назад для удобства
  const getDefaultDates = () => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return {
      start: monthAgo.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
    };
  };

  // Устанавливаем значения по умолчанию при монтировании
  React.useEffect(() => {
    const { start, end } = getDefaultDates();
    setStartDate(start);
    setEndDate(end);
  }, []);

  const validateForm = (): string | null => {
    if (!startDate) return "Укажите начальную дату";
    if (!endDate) return "Укажите конечную дату";
    if (!timeZone) return "Укажите часовой пояс";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) return "Неверный формат начальной даты";
    if (isNaN(end.getTime())) return "Неверный формат конечной даты";
    if (start > end) return "Начальная дата не может быть позже конечной";
    
    return null;
  };

  const getReportPayload = (): ReportRequest => {
    return {
      start: startDate,
      end: endDate,
      timeZone: timeZone,
    };
  };

  const handleDownload = async (
    reportName: string,
    downloadFn: () => Promise<{ error?: { message: string; status?: number } }>
  ) => {
    const validationError = validateForm();
    if (validationError) {
      showErrorToast(validationError);
      return;
    }

    setLoading(reportName);
    try {
      const result = await downloadFn();
      if (result.error) {
        showErrorToast(result.error.message || "Ошибка при генерации отчета");
      } else {
        showSuccessToast(`Отчет "${reportName}" успешно скачан!`);
      }
    } catch (error) {
      logger.error(`Error downloading report ${reportName}`, error);
      showErrorToast("Произошла ошибка при генерации отчета");
    } finally {
      setLoading(null);
    }
  };

  const isGenerating = (reportName: string) => loading === reportName;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Параметры отчетов</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Начальная дата
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Конечная дата
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Часовой пояс
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Europe/Moscow">Москва (Europe/Moscow)</option>
              <option value="Asia/Novosibirsk">Новосибирск (Asia/Novosibirsk)</option>
              <option value="Asia/Yekaterinburg">Екатеринбург (Asia/Yekaterinburg)</option>
              <option value="Asia/Krasnoyarsk">Красноярск (Asia/Krasnoyarsk)</option>
              <option value="Asia/Irkutsk">Иркутск (Asia/Irkutsk)</option>
              <option value="Asia/Vladivostok">Владивосток (Asia/Vladivostok)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Доступные отчеты</h2>
        
        <div className="space-y-4">
          {/* Базовые отчеты */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Базовые отчеты</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!locationId && (
                <Button
                  onClick={() =>
                    handleDownload("Базовый отчет", () =>
                      reportsApi.getAnalyticsReport(getReportPayload(), accessToken)
                    )
                  }
                  disabled={isGenerating("Базовый отчет")}
                  className="w-full"
                >
                  {isGenerating("Базовый отчет") ? "Генерация..." : "Базовый отчет (все локации)"}
                </Button>
              )}
              
              {locationId && (
                <Button
                  onClick={() =>
                    handleDownload("Базовый отчет по локации", () =>
                      reportsApi.getAnalyticsReportByLocation(
                        locationId,
                        getReportPayload(),
                        accessToken
                      )
                    )
                  }
                  disabled={isGenerating("Базовый отчет по локации")}
                  className="w-full"
                >
                  {isGenerating("Базовый отчет по локации")
                    ? "Генерация..."
                    : "Базовый отчет по локации"}
                </Button>
              )}
            </div>
          </div>

          {/* Отчеты о загрузке пространств */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Загрузка пространств</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!locationId && (
                <Button
                  onClick={() =>
                    handleDownload("Отчет о загрузке пространств", () =>
                      reportsApi.getSpaceLoadReport(getReportPayload(), accessToken)
                    )
                  }
                  disabled={isGenerating("Отчет о загрузке пространств")}
                  className="w-full"
                >
                  {isGenerating("Отчет о загрузке пространств")
                    ? "Генерация..."
                    : "Загрузка пространств (все локации)"}
                </Button>
              )}
              
              {locationId && (
                <Button
                  onClick={() =>
                    handleDownload("Отчет о загрузке пространств по локации", () =>
                      reportsApi.getSpaceLoadReportByLocation(
                        locationId,
                        getReportPayload(),
                        accessToken
                      )
                    )
                  }
                  disabled={isGenerating("Отчет о загрузке пространств по локации")}
                  className="w-full"
                >
                  {isGenerating("Отчет о загрузке пространств по локации")
                    ? "Генерация..."
                    : "Загрузка пространств по локации"}
                </Button>
              )}
            </div>
          </div>

          {/* Отчеты о загрузке локаций */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Загрузка локаций</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!locationId && (
                <Button
                  onClick={() =>
                    handleDownload("Отчет о загрузке локаций", () =>
                      reportsApi.getLocationLoadReport(getReportPayload(), accessToken)
                    )
                  }
                  disabled={isGenerating("Отчет о загрузке локаций")}
                  className="w-full"
                >
                  {isGenerating("Отчет о загрузке локаций")
                    ? "Генерация..."
                    : "Загрузка локаций (все локации)"}
                </Button>
              )}
              
              {locationId && (
                <Button
                  onClick={() =>
                    handleDownload("Отчет о загрузке локации", () =>
                      reportsApi.getLocationLoadReportByLocation(
                        locationId,
                        getReportPayload(),
                        accessToken
                      )
                    )
                  }
                  disabled={isGenerating("Отчет о загрузке локации")}
                  className="w-full"
                >
                  {isGenerating("Отчет о загрузке локации")
                    ? "Генерация..."
                    : "Загрузка локации"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Примечание:</strong> Все отчеты генерируются в формате CSV и автоматически
          скачиваются на ваше устройство. Убедитесь, что в браузере разрешена загрузка файлов.
        </p>
      </div>
    </div>
  );
};

