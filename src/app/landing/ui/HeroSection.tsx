import React from "react";
import LandingHeader from "@/widgets/Header/ui/LandingHeader";
import ScrollButton from "@/shared/ui/Buttons/ScrollButton";
import InteractiveGridBackground from "@/shared/ui/Grids/InteractiveGridBackground";

const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen flex flex-col md:flex-row overflow-hidden">
      <LandingHeader />

      <div className="relative z-10 flex flex-col justify-center px-8 md:px-16 py-24 md:w-1/2 bg-white">
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6">
            Кубик
          </h1>
          <h2 className="text-xl md:text-3xl font-bold text-blue-500 mb-12">
            Твой рабочий уголок в один клик.
          </h2>
          <ScrollButton targetId="features">Подробнее</ScrollButton>
        </div>
      </div>

      <div className="relative md:w-1/2 w-full h-[50vh] md:h-auto hidden md:block">
        <InteractiveGridBackground />
      </div>
    </section>
  );
};

export default HeroSection;
