"use client";

import React, { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Выберите...",
  disabled = false,
  className = "",
  size = "md",
}) => {
  const [open, setOpen] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value) || null;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Плавная анимация появления/скрытия списка
  useEffect(() => {
    if (!open) {
      setAnimateOpen(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setAnimateOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const sizeClasses =
    size === "sm"
      ? "h-9 text-xs"
      : size === "lg"
        ? "h-12 text-base"
        : "h-10 text-sm";

  return (
    <div
      ref={ref}
      className={`relative inline-block w-full ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full ${sizeClasses} px-3 sm:px-4 flex items-center justify-between rounded-lg border bg-white
          ${disabled
            ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
            : "border-gray-300 text-gray-700 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          } transition-colors`}
      >
        <span
          className={`truncate ${selectedOption ? "" : "text-gray-400"}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="ml-2 flex items-center text-gray-400">
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && !disabled && (
        <div
          className={`absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto
            transform origin-top transition-all duration-150 ease-out
            ${animateOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1"}
          `}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">
              Нет доступных вариантов
            </div>
          ) : (
            <ul className="py-1">
              {options.map((opt) => (
                <li
                  key={`${opt.value}`}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer
                    ${opt.disabled
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : opt.value === value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && !opt.disabled && (
                    <span className="text-blue-500 text-xs">✓</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};


