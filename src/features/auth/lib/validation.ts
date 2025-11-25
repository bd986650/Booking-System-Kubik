import { z } from "zod";

// Схема валидации для логина
// Согласно документации:
// - email: валидный email адрес
// - password: от 6 до 100 символов
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email обязателен")
    .email("Некорректный формат email"),
  password: z
    .string()
    .min(1, "Пароль обязателен")
    .min(6, "Пароль должен содержать минимум 6 символов")
    .max(100, "Пароль не должен превышать 100 символов"),
});

// Схема валидации для регистрации
// Согласно документации:
// - email: валидный email адрес
// - password: от 6 до 100 символов
// - fullName: от 5 до 100 символов
// - position: до 100 символов
// - location: опционально (ID локации)
// - organizationId: опционально (ID существующей организации)
// - organizationName: опционально (название новой организации)
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email обязателен")
      .email("Некорректный формат email"),
    password: z
      .string()
      .min(1, "Пароль обязателен")
      .min(6, "Пароль должен содержать минимум 6 символов")
      .max(100, "Пароль не должен превышать 100 символов")
      .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
      .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
      .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
    fullName: z
      .string()
      .min(1, "ФИО обязательно")
      .min(5, "ФИО должно содержать минимум 5 символов")
      .max(100, "ФИО не должно превышать 100 символов"),
    position: z
      .string()
      .min(1, "Должность обязательна")
      .max(100, "Должность не должна превышать 100 символов"),
    organizationId: z.number().optional(),
    organizationName: z.string().optional(),
    locationId: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    // Если создается новая организация, нужен organizationName
    if (!data.organizationId && !data.organizationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Выберите организацию или создайте новую",
        path: ["organizationId"],
      });
    }
    // Если выбрана существующая организация, нужен locationId
    if (data.organizationId && !data.locationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Для существующей организации необходимо выбрать локацию",
        path: ["locationId"],
      });
    }
    // Если создается новая организация, organizationName должен быть заполнен
    if (!data.organizationId && data.organizationName && data.organizationName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Введите название организации",
        path: ["organizationName"],
      });
    }
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
