import { apiRequest, authenticatedRequest } from "@/shared/api/config";

// Типы для запросов и ответов
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  position: string;
  location?: number;
  organizationId?: number;
  organizationName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface LoginResponse {
  jwtResponse: JwtResponse;
  role: string[]; // Массив ролей, например ["ROLE_USER"]
}

export interface CheckAuthResponse {
  email: string;
  fullName: string;
  locationId: number;
  locationName: string;
  organizationId?: number;
  organizationName?: string;
  roles: string[];
}

// API функции
export const authApi = {
  // Регистрация
  async register(data: RegisterRequest) {
    return apiRequest<{ message?: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Вход
  async login(data: LoginRequest) {
    return apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Обновление токена
  async refreshToken(data: RefreshTokenRequest) {
    return apiRequest<JwtResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Выход
  async logout(data: LogoutRequest) {
    return apiRequest<void>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Проверка аутентификации
  async checkAuth(token: string) {
    return authenticatedRequest<CheckAuthResponse>("/api/auth/check-auth", token, {
      method: "GET",
    });
  },
};

