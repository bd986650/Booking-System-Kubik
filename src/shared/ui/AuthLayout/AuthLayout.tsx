"use client";

import React from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="flex min-h-screen">
      {/* Левая часть - Только изображение */}
      <div className="hidden lg:flex lg:w-3/7 h-screen relative">
        <Image
          src="/images/login-image.png"
          alt="Рабочее пространство офиса"
          fill
          className="object-cover"
        />
      </div>

      {/* Правая часть - Форма */}
      <div className="w-full lg:w-4/7 min-h-screen bg-white flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
          <div className="w-full flex flex-col gap-8 sm:gap-10 lg:gap-12">
            {/* Заголовок формы */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
