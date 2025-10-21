"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

type ButtonVariants = "filled" | "outline" | "ghost";
type ButtonColors = "blue" | "gray";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariants;
  color?: ButtonColors;
};

export default function Button({
  asChild = false,
  variant = "filled",
  color = "blue",
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const base =
    "w-full px-5 py-3 text-sm font-semibold rounded-lg transition-colors duration-200 " +
    "flex items-center justify-center text-center select-none";

  const variants = {
    filled: {
      blue: "bg-blue-500 text-white hover:bg-blue-600",
      gray: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    outline: {
      blue: "border border-blue-500 text-blue-500 hover:bg-blue-50",
      gray: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    },
    ghost: {
      blue: "text-blue-500 hover:bg-blue-50",
      gray: "text-gray-700 hover:bg-gray-100",
    },
  } satisfies Record<ButtonVariants, Record<ButtonColors, string>>;

  return (
    <Comp {...props} className={clsx(base, variants[variant][color], className)} />
  );
}
