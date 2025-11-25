import { logger } from "@/shared/lib/logger";
import { showErrorToast } from "@/shared/lib/toast";

// Базовый URL API - можно вынести в переменные окружения
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Типы для ответов API
export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status?: number;
}

// Базовая функция для запросов
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T> & { status?: number }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    let requestBody = null;
    if (options.body) {
      try {
        requestBody = JSON.parse(options.body as string);
        // Маскируем пароли в логах
        if (requestBody && typeof requestBody === "object") {
          const sanitizedBody = { ...requestBody };
          if ("password" in sanitizedBody) {
            sanitizedBody.password = "***";
          }
          requestBody = sanitizedBody;
        }
      } catch {
        // Если не JSON, просто оставляем как есть
      }
    }
    
    logger.debug(`API Request: ${options.method || "GET"} ${url}`, {
      body: requestBody,
      headers: options.headers,
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Сохраняем статус для обработки специальных случаев
    const status = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Произошла ошибка";
      let errorData = null;
      
      try {
        errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      // Очищаем технические детали SQL ошибок
      if (errorMessage.includes("JDBC exception") || errorMessage.includes("SQL") || errorMessage.includes("column") || errorMessage.includes("does not exist")) {
        // Извлекаем понятную часть ошибки
        if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
          const columnMatch = errorMessage.match(/column "([^"]+)" does not exist/);
          if (columnMatch) {
            errorMessage = `Ошибка базы данных: колонка "${columnMatch[1]}" не найдена. Обратитесь к администратору.`;
          } else {
            errorMessage = "Ошибка базы данных. Обратитесь к администратору.";
          }
        } else if (errorMessage.includes("JDBC exception")) {
          errorMessage = "Ошибка базы данных. Обратитесь к администратору.";
        }
      }

      // Специальная обработка для 404
      if (status === 404) {
        errorMessage = "Эндпоинт не найден. Проверьте, запущен ли сервер и правильность пути API.";
      }

      // Специальная обработка для 403
      if (status === 403) {
        errorMessage = errorData?.message || "Доступ запрещен. У вас нет прав для выполнения этого действия.";
      }

      // Специальная обработка для 409 Conflict (дубликат)
      if (status === 409) {
        errorMessage = errorData?.message || "Конфликт: ресурс уже существует.";
      }

      // Специальная обработка для 500 (внутренняя ошибка сервера)
      if (status === 500) {
        // Если это SQL ошибка, показываем более понятное сообщение
        if (errorMessage.includes("базы данных") || errorMessage.includes("JDBC") || errorMessage.includes("SQL")) {
          // Уже обработано выше
        } else if (errorMessage.includes("Duration") || errorMessage.includes("cannot be parsed")) {
          // Ошибка парсинга Duration - обычно связано с настройками рабочего времени локации
          errorMessage = "Ошибка конфигурации: проверьте настройки рабочего времени локации (начало/конец рабочего дня). Обратитесь к администратору.";
        } else {
          errorMessage = "Внутренняя ошибка сервера. Обратитесь к администратору.";
        }
      }

      logger.error(`API Error: ${status} ${url}`, {
        status,
        error: errorData || errorMessage,
        response: errorText,
        fullError: errorText, // Сохраняем полную ошибку в лог
      });

      // Показываем toast для ошибок (кроме 401, который обрабатывается отдельно)
      // 401 не показываем, так как он обрабатывается через refresh token
      // 409 обрабатывается в компонентах с более специфичными сообщениями
      if (status !== 401 && status !== 404 && status !== 409) {
        showErrorToast(errorMessage);
      }

      return {
        error: {
          message: errorMessage,
          status: status,
        },
        status,
      };
    }

    // Читаем тело ответа один раз
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    
    // Если нет контента, возвращаем успешный ответ без данных
    if (!text || text.trim() === "") {
      logger.debug(`API Response: ${status} ${url}`, {
        status,
        data: undefined,
        responseText: "(empty)",
        contentType,
        note: status === 201 ? "201 Created (empty body)" : status === 204 ? "204 No Content" : "Empty response body",
      });
      return { data: undefined as T, status };
    }

    // Для 201 Created может быть тело ответа (например, ID созданного ресурса)
    if (status === 201) {
      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(text);
          logger.debug(`API Response: ${status} ${url}`, {
            status,
            data,
            responseText: text,
            note: "201 Created with body",
          });
          return { data, status };
        } catch {
          // Если не JSON, пытаемся распарсить как число (для простых ID)
          const numValue = Number(text.trim());
          if (!isNaN(numValue)) {
            logger.debug(`API Response: ${status} ${url}`, {
              status,
              data: numValue,
              responseText: text,
              note: "201 Created with numeric ID",
            });
            return { data: numValue as T, status };
          }
          logger.debug(`API Response: ${status} ${url}`, {
            status,
            data: undefined,
            responseText: text,
            note: "201 Created but couldn't parse body",
          });
          return { data: undefined as T, status };
        }
      } else {
        // Если не JSON, пытаемся распарсить как число (для простых ID)
        const numValue = Number(text.trim());
        if (!isNaN(numValue)) {
          logger.debug(`API Response: ${status} ${url}`, {
            status,
            data: numValue,
            responseText: text,
            note: "201 Created with numeric ID (plain text)",
          });
          return { data: numValue as T, status };
        }
        logger.debug(`API Response: ${status} ${url}`, {
          status,
          data: undefined,
          responseText: text,
          note: "201 Created but couldn't parse body",
        });
        return { data: undefined as T, status };
      }
    }

    // Для 204 No Content всегда возвращаем undefined
    if (status === 204) {
      logger.debug(`API Response: ${status} ${url}`, {
        status,
        data: undefined,
        responseText: text || "(empty)",
        contentType,
        note: "204 No Content",
      });
      return { data: undefined as T, status };
    }

    // Для 202 Accepted может быть тело ответа или нет
    if (status === 202) {
      // Если есть контент и это JSON, пытаемся распарсить
      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(text);
          logger.debug(`API Response: ${status} ${url}`, {
            status,
            data,
            responseText: text,
          });
          return { data, status };
        } catch {
          // Если не удалось распарсить, возвращаем успешный ответ
          logger.debug(`API Response: ${status} ${url}`, {
            status,
            data: undefined,
            responseText: text,
            note: "Empty or invalid JSON",
          });
          return { data: undefined as T, status };
        }
      }
      // Если нет контента или это не JSON, возвращаем успешный ответ
      logger.debug(`API Response: ${status} ${url}`, {
        status,
        data: undefined,
        responseText: text || "(empty)",
        contentType,
      });
      return { data: undefined as T, status };
    }

    // Для остальных успешных ответов пытаемся распарсить JSON
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = JSON.parse(text);
        logger.debug(`API Response: ${status} ${url}`, {
          status,
          data,
          responseText: text,
        });
        return { data, status };
      } catch {
        logger.error(`API Parse Error: ${status} ${url}`, {
          status,
          responseText: text,
          contentType,
        });
        const errorMessage = "Ошибка парсинга ответа сервера";
        showErrorToast(errorMessage);
        return {
          error: {
            message: errorMessage,
          },
          status,
        };
      }
    }
    
    // Если это не JSON, возвращаем текст как данные или ошибку
    logger.warn(`API Unexpected Format: ${status} ${url}`, {
      status,
      responseText: text,
      contentType,
    });
    return {
      error: {
        message: "Неожиданный формат ответа от сервера",
      },
      status,
    };
  } catch (error) {
    const url = `${API_BASE_URL}${endpoint}`;
    const errorMessage = error instanceof Error ? error.message : "Сетевая ошибка";
    logger.error(`API Network Error: ${options.method || "GET"} ${url}`, {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      endpoint,
    });
    showErrorToast(errorMessage);
    return {
      error: {
        message: errorMessage,
      },
    };
  }
}

// Функция для авторизованных запросов с автоматическим обновлением токена
export async function authenticatedRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Логируем информацию о токене для отладки (без самого токена)
  logger.debug(`Authenticated Request: ${endpoint}`, {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPrefix: token?.substring(0, 20) + "...",
  });

  // Выполняем запрос
  let response = await apiRequest<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Если получили 401, пытаемся обновить токен
  if (response.error?.status === 401) {
    // Получаем refresh token из zustand store
    // Импортируем динамически чтобы избежать циклических зависимостей
    const { useAuthStore } = await import("@/features/auth");
    const store = useAuthStore.getState();
    const refreshToken = store.refreshToken;

    if (refreshToken) {
      const { authApi } = await import("@/features/auth");
      const refreshResponse = await authApi.refreshToken({ refreshToken });

      if (refreshResponse.data) {
        // Сохраняем новые токены
        store.refreshTokens(
          refreshResponse.data.accessToken,
          refreshResponse.data.refreshToken
        );

        // Повторяем запрос с новым токеном
        response = await apiRequest<T>(endpoint, {
          ...options,
          headers: {
            Authorization: `Bearer ${refreshResponse.data.accessToken}`,
            ...options.headers,
          },
        });
      } else {
        // Если refresh не сработал, выходим
        store.logout();
        return {
          error: {
            message: "Сессия истекла. Пожалуйста, войдите снова.",
            status: 401,
          },
        };
      }
    } else {
      return {
        error: {
          message: "Токен авторизации не найден",
          status: 401,
        },
      };
    }
  }

  return response;
}

export default apiRequest;

