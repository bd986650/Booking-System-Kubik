type MinimalUser = {
  email: string;
  locationId: number;
  roles: string[];
};
import type { UserRole } from "@/entities/user";

export function hasRole(user: MinimalUser | null, role: UserRole): boolean {
  if (!user) return false;
  return (user.roles || []).includes(role);
}

export function hasAnyRole(user: MinimalUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  const userRoles = user.roles || [];
  return roles.some((r) => userRoles.includes(r));
}

export function isWorkspaceAdmin(user: MinimalUser | null): boolean {
  return hasRole(user, "ROLE_ADMIN_WORKSPACE");
}

export function isProjectAdmin(user: MinimalUser | null): boolean {
  return hasRole(user, "ROLE_ADMIN_PROJECT");
}

export function isRegularUser(user: MinimalUser | null): boolean {
  return hasRole(user, "ROLE_USER");
}

// Доступ к управлению пользователями
// - Workspace admin: везде
// - Project admin: только внутри своего офиса (locationId)
export function canManageUser(user: MinimalUser | null, target: { locationId: number }): boolean {
  if (!user) return false;
  if (isWorkspaceAdmin(user)) return true;
  if (isProjectAdmin(user)) return user.locationId === target.locationId;
  return false;
}

// Какие роли можно назначать
// - Workspace admin: может назначать любые из списка UserRole
// - Project admin: может назначать только ROLE_USER и ROLE_ADMIN_PROJECT
export function canAssignRole(user: MinimalUser | null, role: UserRole): boolean {
  if (!user) return false;
  if (isWorkspaceAdmin(user)) return true;
  if (isProjectAdmin(user)) return role === "ROLE_USER" || role === "ROLE_ADMIN_PROJECT";
  return false;
}

// Управление бронированиями
// - Обычный пользователь: только свои
// - Project admin: все брони в своем офисе
// - Workspace admin: все брони по организации (везде)
export function canManageBooking(
  user: MinimalUser | null,
  params:
    | { scope: "own"; ownerEmail: string }
    | { scope: "office"; officeLocationId: number }
    | { scope: "organization" }
): boolean {
  if (!user) return false;

  if (params.scope === "own") {
    return user.email === params.ownerEmail || isWorkspaceAdmin(user) || isProjectAdmin(user);
  }

  if (params.scope === "office") {
    if (isWorkspaceAdmin(user)) return true;
    if (isProjectAdmin(user)) return user.locationId === params.officeLocationId;
    return false;
  }

  if (params.scope === "organization") {
    return isWorkspaceAdmin(user);
  }

  return false;
}

// Приоритет ролей для отображения (от высшего к низшему)
const ROLE_PRIORITY: Record<UserRole, number> = {
  ROLE_ADMIN_WORKSPACE: 3,
  ROLE_ADMIN_PROJECT: 2,
  ROLE_USER: 1,
};

export function getHighestRole(roles: string[] | undefined | null): UserRole | null {
  if (!roles || roles.length === 0) return null;
  let highest: UserRole | null = null;
  let pr = 0;
  for (const r of roles) {
    const key = r as UserRole;
    const p = ROLE_PRIORITY[key] || 0;
    if (p > pr) {
      pr = p;
      highest = key;
    }
  }
  return highest;
}


