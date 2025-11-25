// 3.5 Получить всех пользователей (админ)
// GET /api/admin/users
export interface UserInfo {
  email: string;
  fullName: string;
  locationId: number;
  locationName: string;
  organizationId?: number;
  organizationName?: string;
  roles: string[];
}

export interface AssignRoleRequest {
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN_WORKSPACE" | "ROLE_ADMIN_PROJECT";
}

export interface RevokeRoleRequest {
  email: string;
  role: string;
}

