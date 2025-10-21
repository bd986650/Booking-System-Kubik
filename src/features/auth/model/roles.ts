export type UserRole = "EMPLOYEE" | "OFFICE" | "COMPANY";

export const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: "Сотрудник",
  OFFICE: "Офис",
  COMPANY: "Компания",
};
