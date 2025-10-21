"use client";

import { useState } from "react";
import { UserRole } from "./roles";

export type AuthMode = "login" | "register";

// interface AuthRequest {
//   email: string;
//   password: string;
//   name?: string;
//   role: UserRole;
// }

interface AuthSuccessResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

interface AuthErrorResponse {
  message: string;
}

export type AuthResponse =
  | { ok: true; data: AuthSuccessResponse }
  | { ok: false; error: string };

export function useAuth(mode: AuthMode) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendAuth(
    role: UserRole,
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    setLoading(true);
    setError(null);

    try {
      // 👉 Моковый режим — просто ждём 1 секунду и возвращаем "успешный" ответ
      await new Promise((res) => setTimeout(res, 1000));

      const fakeResponse: AuthSuccessResponse = {
        token: "mock-token-123",
        user: {
          id: "1",
          email,
          name: name || "Mock User",
          role,
        },
      };

      return { ok: true, data: fakeResponse };
    } catch {
      setError("Ошибка: не удалось выполнить авторизацию");
      return { ok: false, error: "Ошибка: не удалось выполнить авторизацию" };
    } finally {
      setLoading(false);
    }
  }

  return { sendAuth, loading, error };
}
