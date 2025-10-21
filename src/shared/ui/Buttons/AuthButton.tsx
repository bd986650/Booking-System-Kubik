"use client";

import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export const AuthButton: React.FC<ButtonProps> = ({
  children,
  type = "button",
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const baseClasses = "w-full rounded-lg font-semibold transition-colors";
  
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-700",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  
  const sizeClasses = {
    sm: "h-10 text-sm",
    md: "h-10 sm:h-12 text-sm sm:text-base",
    lg: "h-12 sm:h-14 text-base sm:text-lg",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};
