import { toast } from "sonner";

/**
 * Показать ошибку через toast
 * Используется для ошибок API, которые не связаны с формами
 */
export const showErrorToast = (message: string, title?: string) => {
  toast.error(title || "Ошибка", {
    description: message,
    duration: 5000,
  });
};

/**
 * Показать успешное уведомление через toast
 */
export const showSuccessToast = (message: string, title?: string) => {
  toast.success(title || "Успешно", {
    description: message,
    duration: 3000,
  });
};

/**
 * Показать информационное уведомление через toast
 */
export const showInfoToast = (message: string, title?: string) => {
  toast.info(title || "Информация", {
    description: message,
    duration: 4000,
  });
};

