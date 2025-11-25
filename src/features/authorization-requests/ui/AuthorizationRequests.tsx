"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth";
import { workspaceAdminApi } from "@/entities/location";
import type { RegistrationRequest } from "@/entities/location";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/buttons";

export const AuthorizationRequests: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const fetchRequests = async () => {
    if (!accessToken) {
      setError("Токен авторизации не найден");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await workspaceAdminApi.getRegistrationRequests(accessToken);

    if (response.error) {
      setError(response.error.message || "Ошибка при загрузке заявок");
      setLoading(false);
      return;
    }

    if (response.data) {
      // Фильтруем только запросы со статусом PENDING
      const pendingRequests = response.data.filter((req) => req.status === "PENDING");
      setRequests(pendingRequests);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleApprove = async (id: number) => {
    if (!accessToken) return;

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      const response = await workspaceAdminApi.approveRegistrationRequest(id, accessToken);

      if (response.error) {
        showErrorToast(`Ошибка при одобрении заявки: ${response.error.message}`, "Ошибка");
        return;
      }

      showSuccessToast("Заявка успешно одобрена", "Успешно");
      // Обновляем список заявок
      await fetchRequests();
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: number) => {
    if (!accessToken) return;

    if (!confirm("Вы уверены, что хотите отклонить эту заявку?")) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      const response = await workspaceAdminApi.rejectRegistrationRequest(id, accessToken);

      if (response.error) {
        showErrorToast(`Ошибка при отклонении заявки: ${response.error.message}`, "Ошибка");
        return;
      }

      showSuccessToast("Заявка отклонена", "Успешно");
      // Обновляем список заявок
      await fetchRequests();
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Заявки на авторизацию</h1>

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-300 p-8 text-center transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
          <p className="text-gray-500">Загрузка заявок...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 mb-3">{error}</p>
          <Button
            onClick={fetchRequests}
            variant="outline"
            color="gray"
            className="w-full md:w-auto"
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-300 p-8 text-center transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
              <p className="text-gray-500">Нет заявок на авторизацию</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden transition-all duration-200 hover:border-blue-500 hover:shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Должность
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Дата подачи
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {request.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{request.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{request.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(request.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => handleApprove(request.id)}
                              disabled={processingIds.has(request.id)}
                              variant="filled"
                              color="blue"
                              className="text-xs py-2"
                            >
                              {processingIds.has(request.id) ? "Обработка..." : "Одобрить"}
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              disabled={processingIds.has(request.id)}
                              variant="outline"
                              color="gray"
                              className="text-xs py-2 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {processingIds.has(request.id) ? "Обработка..." : "Отклонить"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
