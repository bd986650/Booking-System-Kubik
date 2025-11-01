"use client";

import React from "react";

interface InputFieldProps {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  showPassword,
  onTogglePassword,
  className = "",
}) => {
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-900">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 sm:h-12 px-3 sm:px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        {isPassword && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6.85223 5.66319C6.85223 6.45172 6.21504 7.08891 5.42651 7.08891C4.63799 7.08891 4.00079 6.45172 4.00079 5.66319C4.00079 4.87467 4.63799 4.23747 5.42651 4.23747C6.21504 4.23747 6.85223 4.87467 6.85223 5.66319Z" stroke="#5B5B5B" strokeWidth="0.597369" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.4265 8.95661C6.83231 8.95661 8.14253 8.12826 9.05452 6.69458C9.41294 6.13305 9.41294 5.18921 9.05452 4.62768C8.14253 3.194 6.83231 2.36565 5.4265 2.36565C4.02069 2.36565 2.71046 3.194 1.79848 4.62768C1.44006 5.18921 1.44006 6.13305 1.79848 6.69458C2.71046 8.12826 4.02069 8.95661 5.4265 8.95661Z" stroke="#5B5B5B" strokeWidth="0.597369" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
