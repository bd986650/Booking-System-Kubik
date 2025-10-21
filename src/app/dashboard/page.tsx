"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/features/auth/model/roles";

// Импортируем “поддашборды”
import CompanyDashboard from "./company/page";
import EmployeeDashboard from "./employee/page";
import OfficeDashboard from "./office/page";

// 👇 Здесь ты можешь брать роль из Zustand, контекста или куков.
// Пока — просто мок
const mockGetUserRole = (): UserRole => "EMPLOYEE";

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const userRole = mockGetUserRole();
    setRole(userRole);
  }, []);

  if (!role) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Загрузка...</p>
      </div>
    );
  }

  // 🔀 Рендерим нужную страницу
  switch (role) {
    case "COMPANY":
      return <CompanyDashboard />;
    case "OFFICE":
      return <OfficeDashboard />;
    case "EMPLOYEE":
      return <EmployeeDashboard />;
    default:
      router.push("/auth");
      return null;
  }
};

export default DashboardPage;
