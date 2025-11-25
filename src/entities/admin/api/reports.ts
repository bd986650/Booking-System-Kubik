import { API_BASE_URL } from "@/shared/api/config";

/**
 * API для аналитики и отчетов
 * Документация: /api/admin/reports
 * Требуется: JWT токен с правами администратора
 * Все эндпоинты возвращают CSV файл для скачивания
 */

export interface ReportRequest {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  timeZone: string; // например, "Asia/Novosibirsk"
}

/**
 * Скачивает CSV файл с отчетом
 */
async function downloadReport(
  endpoint: string,
  payload: ReportRequest,
  token: string,
  filename: string
): Promise<{ error?: { message: string; status?: number } }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Ошибка ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return {
        error: {
          message: errorMessage,
          status: response.status,
        },
      };
    }

    // Получаем CSV данные
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {};
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
    };
  }
}

export const reportsApi = {
  /**
   * 5.1 Базовый отчет (CSV)
   * POST /api/admin/reports/analytics/csv
   * Требуется: JWT токен с правами администратора
   */
  getAnalyticsReport: async (payload: ReportRequest, token: string) => {
    return downloadReport(
      "/api/admin/reports/analytics/csv",
      payload,
      token,
      `analytics_report_${payload.start}_${payload.end}.csv`
    );
  },

  /**
   * 5.2 Базовый отчет по локации (CSV)
   * POST /api/admin/reports/analytics/location/{locationId}/csv
   * Требуется: JWT токен с правами администратора
   */
  getAnalyticsReportByLocation: async (locationId: number, payload: ReportRequest, token: string) => {
    return downloadReport(
      `/api/admin/reports/analytics/location/${locationId}/csv`,
      payload,
      token,
      `analytics_report_location_${locationId}_${payload.start}_${payload.end}.csv`
    );
  },

  /**
   * 5.3 Отчет о загрузке пространств (CSV)
   * POST /api/admin/reports/analytics/space-load/csv
   * Требуется: JWT токен с правами администратора
   */
  getSpaceLoadReport: async (payload: ReportRequest, token: string) => {
    return downloadReport(
      "/api/admin/reports/analytics/space-load/csv",
      payload,
      token,
      `space_load_report_${payload.start}_${payload.end}.csv`
    );
  },

  /**
   * 5.4 Отчет о загрузке пространств по локации (CSV)
   * POST /api/admin/reports/analytics/location/{locationId}/space-load/csv
   * Требуется: JWT токен с правами администратора
   */
  getSpaceLoadReportByLocation: async (locationId: number, payload: ReportRequest, token: string) => {
    return downloadReport(
      `/api/admin/reports/analytics/location/${locationId}/space-load/csv`,
      payload,
      token,
      `space_load_report_location_${locationId}_${payload.start}_${payload.end}.csv`
    );
  },

  /**
   * 5.5 Отчет о загрузке локаций (CSV)
   * POST /api/admin/reports/analytics/location-load/csv
   * Требуется: JWT токен с правами администратора
   */
  getLocationLoadReport: async (payload: ReportRequest, token: string) => {
    return downloadReport(
      "/api/admin/reports/analytics/location-load/csv",
      payload,
      token,
      `location_load_report_${payload.start}_${payload.end}.csv`
    );
  },

  /**
   * 5.6 Отчет о загрузке локации (CSV)
   * POST /api/admin/reports/analytics/location/{locationId}/location-load/csv
   * Требуется: JWT токен с правами администратора
   */
  getLocationLoadReportByLocation: async (locationId: number, payload: ReportRequest, token: string) => {
    return downloadReport(
      `/api/admin/reports/analytics/location/${locationId}/location-load/csv`,
      payload,
      token,
      `location_load_report_location_${locationId}_${payload.start}_${payload.end}.csv`
    );
  },
};

