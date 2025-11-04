"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/features/auth";
import { workspaceAdminApi } from "@/features/user-management/api/workspace";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";

export const Workspaces: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = useMemo(() => isWorkspaceAdmin(user || null) || isProjectAdmin(user || null), [user]);
  
  // Берем organizationId из данных пользователя (из checkAuth)
  const organizationId = user?.organizationId || null;

  // Create Location
  const [locName, setLocName] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locActive, setLocActive] = useState(true);
  const [locWorkStart, setLocWorkStart] = useState("09:00:00");
  const [locWorkEnd, setLocWorkEnd] = useState("18:00:00");
  const [locTimeZone, setLocTimeZone] = useState("Europe/Moscow");
  const [locOrgIdManual, setLocOrgIdManual] = useState<string>("");

  // Create Space Type
  const [stType, setStType] = useState("");
  const [stDurations, setStDurations] = useState("30m,1h,2h,4h");

  // Create Space
  const [spLocationId, setSpLocationId] = useState<string>(user?.locationId ? String(user.locationId) : "");
  const [spTypeId, setSpTypeId] = useState<string>("");
  const [spCapacity, setSpCapacity] = useState<string>("1");
  const [spFloor, setSpFloor] = useState<string>("1");
  const [spX, setSpX] = useState<string>("");
  const [spY, setSpY] = useState<string>("");
  const [spW, setSpW] = useState<string>("");
  const [spH, setSpH] = useState<string>("");

  // Queries
  const [queryLocationId, setQueryLocationId] = useState<string>(user?.locationId ? String(user.locationId) : "");
  const [locationBookings, setLocationBookings] = useState<any[]>([]);
  const [locationUsers, setLocationUsers] = useState<any[]>([]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Рабочие пространства</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
          Доступ только для администраторов проекта или воркспейса.
        </div>
      </div>
    );
  }

  const withUiState = async (fn: () => Promise<void>) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = () => withUiState(async () => {
    if (!accessToken) return;
    
    // Используем автоматически полученный organizationId или ручной ввод
    const finalOrgId = organizationId || (locOrgIdManual ? Number(locOrgIdManual) : null);
    
    if (!finalOrgId) {
      setError("Не удалось определить ID организации. Введите его вручную или проверьте, что у вас назначена локация.");
      return;
    }
    
    const res = await workspaceAdminApi.createLocation({
      name: locName,
      city: locCity,
      address: locAddress,
      isActive: locActive,
      workDayStart: locWorkStart,
      workDayEnd: locWorkEnd,
      timeZone: locTimeZone,
      organizationId: finalOrgId,
    }, accessToken);
    if (res.error) setError(res.error.message); else {
      setSuccess(`Локация создана: ${res.data?.name}`);
      // Очищаем форму
      setLocName("");
      setLocCity("");
      setLocAddress("");
      setLocActive(true);
      setLocOrgIdManual("");
    }
  });

  const handleCreateSpaceType = () => withUiState(async () => {
    if (!accessToken) return;
    const durations = stDurations.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await workspaceAdminApi.createSpaceType({ type: stType, allowedDurations: durations }, accessToken);
    if (res.error) setError(res.error.message); else setSuccess(`Тип создан: ${res.data?.type}`);
  });

  const handleCreateSpace = () => withUiState(async () => {
    if (!accessToken) return;
    const res = await workspaceAdminApi.createSpace({
      locationId: Number(spLocationId),
      spaceTypeId: Number(spTypeId),
      capacity: Number(spCapacity),
      floor: Number(spFloor),
      x: spX ? Number(spX) : undefined,
      y: spY ? Number(spY) : undefined,
      width: spW ? Number(spW) : undefined,
      height: spH ? Number(spH) : undefined,
    }, accessToken);
    if (res.error) setError(res.error.message); else setSuccess(`Помещение создано: #${res.data?.id}`);
  });

  const handleLoadLocationBookings = () => withUiState(async () => {
    if (!accessToken) return;
    const res = await workspaceAdminApi.getLocationActiveBookings(Number(queryLocationId), accessToken);
    if (res.error) setError(res.error.message); else setLocationBookings(res.data || []);
  });

  const handleLoadLocationUsers = () => withUiState(async () => {
    if (!accessToken) return;
    const res = await workspaceAdminApi.getLocationUsers(Number(queryLocationId), accessToken);
    if (res.error) setError(res.error.message); else setLocationUsers(res.data || []);
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Рабочие пространства</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Создание локации</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Название" value={locName} onChange={(e) => setLocName(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Город" value={locCity} onChange={(e) => setLocCity(e.target.value)} />
            <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Адрес" value={locAddress} onChange={(e) => setLocAddress(e.target.value)} />
            <div className="flex items-center gap-2">
              <input id="locActive" type="checkbox" checked={locActive} onChange={(e) => setLocActive(e.target.checked)} />
              <label htmlFor="locActive" className="text-sm text-gray-700">Активна</label>
            </div>
            <input className="border rounded px-3 py-2" placeholder="Начало дня (HH:mm:ss)" value={locWorkStart} onChange={(e) => setLocWorkStart(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Конец дня (HH:mm:ss)" value={locWorkEnd} onChange={(e) => setLocWorkEnd(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Часовой пояс" value={locTimeZone} onChange={(e) => setLocTimeZone(e.target.value)} />
          </div>
          <button onClick={handleCreateLocation} disabled={loading} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Создать локацию</button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Создание типа помещения</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Тип (например, conference_room)" value={stType} onChange={(e) => setStType(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Длительности (через запятую)" value={stDurations} onChange={(e) => setStDurations(e.target.value)} />
          </div>
          <button onClick={handleCreateSpaceType} disabled={loading} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Создать тип</button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Создание помещения</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="ID локации" value={spLocationId} onChange={(e) => setSpLocationId(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="ID типа" value={spTypeId} onChange={(e) => setSpTypeId(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Вместимость" value={spCapacity} onChange={(e) => setSpCapacity(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Этаж" value={spFloor} onChange={(e) => setSpFloor(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="X (опц.)" value={spX} onChange={(e) => setSpX(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Y (опц.)" value={spY} onChange={(e) => setSpY(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Ширина (опц.)" value={spW} onChange={(e) => setSpW(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Высота (опц.)" value={spH} onChange={(e) => setSpH(e.target.value)} />
          </div>
          <button onClick={handleCreateSpace} disabled={loading} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Создать помещение</button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Данные по локации</h2>
          <div className="flex gap-3 items-end mb-3">
            <input className="border rounded px-3 py-2" placeholder="ID локации" value={queryLocationId} onChange={(e) => setQueryLocationId(e.target.value)} />
            <button onClick={handleLoadLocationBookings} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Активные бронирования</button>
            <button onClick={handleLoadLocationUsers} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Пользователи</button>
            <Link
              href={`/map?locationId=${encodeURIComponent(queryLocationId || "")}`}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
            >
              Открыть конструктор
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Бронирования</h3>
              {locationBookings.length === 0 ? (
                <p className="text-gray-500">Нет данных</p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-auto">
                  {locationBookings.map((b) => (
                    <li key={b.id} className="border rounded p-2">
                      <div className="font-medium">#{b.id} · {b.spaceName} · {b.userEmail}</div>
                      <div className="text-sm text-gray-500">{new Date(b.start).toLocaleString()} — {new Date(b.end).toLocaleString()} · {b.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Пользователи</h3>
              {locationUsers.length === 0 ? (
                <p className="text-gray-500">Нет данных</p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-auto">
                  {locationUsers.map((u) => (
                    <li key={u.email} className="border rounded p-2">
                      <div className="font-medium">{u.fullName} · {u.email}</div>
                      <div className="text-sm text-gray-500">{u.locationName} · {Array.isArray(u.roles) ? u.roles.join(", ") : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


