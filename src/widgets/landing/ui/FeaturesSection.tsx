import React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Buttons";
import { features, FeatureCardItem } from "@/widgets/landing";

const FeaturesSection: React.FC = () => {
  return (
    <section
      id="features"
      className="bg-gray-50 py-24 px-6 flex flex-col items-center justify-center"
    >
      <h2 className="text-4xl font-medium lg:text-5xl md:text-5xl mb-12 text-center">
        Почему выбирают <span className="font-bold text-blue-500">Кубик</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-12 max-w-6xl px-6 w-full">
        {features.map((feature, idx) => (
          <FeatureCardItem key={idx} feature={feature} />
        ))}
      </div>

      <div className="mt-10 w-full max-w-6xl px-6">
        <Button asChild variant="outline" color="blue" className="w-full">
          <Link href="/register">Начать сейчас</Link>
        </Button>
      </div>
    </section>
  );
};

export default FeaturesSection;

