"use client";

import React from "react";
import { useAuthStore } from "@/features/auth";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { AnalyticsReports } from "@/widgets/WorkspacesAdmin/ui/AnalyticsReports";

export const Analytics: React.FC = () => {
  const { user, accessToken } = useAuthStore();

  if (!accessToken) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Токен авторизации не найден. Пожалуйста, войдите в систему.
        </div>
      </div>
    );
  }

  // Определяем locationId: для админа офиса - его локация, для админа компании - null (все локации)
  const locationId = isWorkspaceAdmin(user || null) && !isProjectAdmin(user || null) 
    ? user?.locationId 
    : null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Аналитика и отчеты</h1>
      <AnalyticsReports accessToken={accessToken} locationId={locationId || undefined} />
    </div>
  );
};

