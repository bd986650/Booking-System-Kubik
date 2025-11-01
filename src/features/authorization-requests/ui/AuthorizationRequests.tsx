"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth";
import { registrationRequestsApi } from "../api/registrationRequests";
import type { RegistrationRequest } from "../model/types";

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

    const response = await registrationRequestsApi.getRequests(accessToken);

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
      const response = await registrationRequestsApi.approveRequest(id, accessToken);

      if (response.error) {
        alert(`Ошибка при одобрении заявки: ${response.error.message}`);
        return;
      }

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
      const response = await registrationRequestsApi.rejectRequest(id, accessToken);

      if (response.error) {
        alert(`Ошибка при отклонении заявки: ${response.error.message}`);
        return;
      }

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Заявки на авторизацию
        </h1>
        <p className="text-gray-600">
          Управление заявками пользователей на получение доступа к системе
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">Загрузка заявок...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <p className="text-gray-500">Нет заявок на авторизацию</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Должность
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата подачи
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{request.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(request.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={processingIds.has(request.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingIds.has(request.id) ? "Обработка..." : "Одобрить"}
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              disabled={processingIds.has(request.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingIds.has(request.id) ? "Обработка..." : "Отклонить"}
                            </button>
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
