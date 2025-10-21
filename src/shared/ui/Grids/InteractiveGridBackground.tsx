"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { InteractiveGridPattern } from "@/shared/ui/Grids/interactive-grid-pattern";

const InteractiveGridBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
        )}
      />
    </div>
  );
};

export default InteractiveGridBackground;
