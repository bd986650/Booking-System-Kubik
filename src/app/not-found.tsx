"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/shared/ui/Buttons/Button";

const NotFoundPage: React.FC = () => {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <section className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-start max-w-md px-6">
        <p className="text-sm font-medium text-blue-500">Ошибка 404</p>

        <h1 className="mt-3 text-2xl font-semibold text-gray-800 md:text-3xl">
          Страница не найдена
        </h1>

        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Извините, страница, которую вы ищете, не существует.
        </p>

        <div className="flex items-center mt-6 gap-x-3 w-full">
          <Button
            variant="outline"
            color="gray"
            className="flex-1 text-center py-2"
            onClick={handleGoBack}
          >
            Назад
          </Button>

          <Button
            variant="filled"
            color="blue"
            className="flex-1 text-center py-2"
            onClick={handleGoHome}
          >
            На главную
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
