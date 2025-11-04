export type UserRole = "ROLE_USER" | "ROLE_ADMIN_WORKSPACE" | "ROLE_ADMIN_PROJECT";

export const ROLE_LABELS: Record<UserRole, string> = {
  ROLE_USER: "Обычный пользователь",
  ROLE_ADMIN_WORKSPACE: "Администратор рабочего пространства",
  ROLE_ADMIN_PROJECT: "Администратор проекта",
};


