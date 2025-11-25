"use client";

import React from "react";
import { Toaster } from "sonner";

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </>
  );
};

