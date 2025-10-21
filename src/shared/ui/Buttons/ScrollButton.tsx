"use client"; // только этот компонент будет клиентским

import React from "react";
import Button from "./Button";

type ScrollButtonProps = {
  targetId: string;
  children: React.ReactNode;
};

export default function ScrollButton({ targetId, children }: ScrollButtonProps) {
  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Button variant="outline" color="gray" onClick={handleClick}>
      {children}
    </Button>
  );
}
